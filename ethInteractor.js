const Web3 = require('web3');
const bitGoUTXO = require('bitgo-utxo-lib');
const confFile = require('./confFile.js')
var constants = require('./constants');
const { keccak256, addHexPrefix } = require('ethereumjs-util');

const util = require('./utils.js');
const abi = require('web3-eth-abi');
const deserializer = require('./deserializer.js');

const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST";
const logging = (process.argv.indexOf('-log') > -1);
const settings = confFile.loadConfFile(ticker);
const verusBridgeStartBlock = 1;

//Main coin ID's
const ETHSystemID = constants.VETHCURRENCYID;
const VerusSystemID = constants.VERUSSYSTEMID
const BridgeID = constants.BRIDGEID
    //const BridgeIDHex = constants.BRIDGEIDHEX

const bridgeAddress = settings.bridgemasteraddress;
const storageAddress = settings.bridgestorageaddress;

var d = new Date();
let globalgetinfo = {};
let globalgetcurrency = {};
let globallastimport = {};
let globalsubmitimports = { "transactionHash": "" };
//let globalbestproofroot = { "result": "" };

let globaltimedelta = 10000; //10s
let globallastinfo = d.getTime() - globaltimedelta;
let globallastcurrency = d.getTime() - globaltimedelta;
let globalgetlastimport = d.getTime() - globaltimedelta;
let globalgetsubmitimports = d.getTime() - globaltimedelta;
let globalgetbestproofroot = d.getTime() - globaltimedelta;

const IAddress = 102;
const RAddressBaseConst = 60;

let maxGas = 6000000;

const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode, {
    clientConfig: {
        maxReceivedFrameSize: 100000000,
        maxReceivedMessageSize: 100000000,
        keepalive: true,
        keepaliveInterval: -1 // ms
    },
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false,
    }
}));


const verusBridgeAbi = require('./abi/VerusBridgeMaster.json');

const verusBridge = new web3.eth.Contract(verusBridgeAbi, bridgeAddress);

let transactioncount = 0;
//setup account and put it in the wallet
let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true


function amountFromValue(incoming) {
    if (incoming == 0) return 0;
    //use rtoFixed to stop floating point behaviour
    return (incoming * 100000000).toFixed(0);
}

function serializeCCurrencyValueMap(ccvm) {

    let encodedOutput = Buffer.from(util.removeHexLeader(ccvm.currency), 'hex');
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(amountFromValue(ccvm.amount), 64)]);

    return encodedOutput
}

function serializeCCurrencyValueMapVarInt(ccvm) {

    let encodedOutput = Buffer.from(util.removeHexLeader(ccvm.currency), 'hex');
    encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(parseInt(ccvm.amount, 10))]);

    return encodedOutput
}

function serializeCCurrencyValueMapArray(ccvm) {
    let encodedOutput = util.writeCompactSize(ccvm.length);
    //loop through the array
    for (let i = 0; i < ccvm.length; i++) {
        //  console.log("ccvm:",ccvm[i]);  [encodedOutput,bitGoUTXO.address.fromBase58Check(ccvm[i].currency,160).hash]
        encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check(ccvm[i].currency, 160).hash]);
        encodedOutput = Buffer.concat([encodedOutput, util.writeUInt((ccvm[i].amount), 64)]);
        // encodedOutput = Buffer.concat([encodedOutput,writeUInt(amountFromValue(ccvm[i].amount),64)]); OLD ABOVE

    }
    return encodedOutput
}

function serializeCTransferDestination(ctd) {
    // Buffer.concat([encodedOutput,writeUInt(ctd.destinationaddress,160)]);
    let encodedOutput = Buffer.alloc(1);
    encodedOutput.writeUInt8(ctd.destinationtype);

    let lengthOfDestination = {};
    let destination = Buffer.from(util.removeHexLeader(ctd.destinationaddress), 'hex');

    if (ctd.destinationtype == constants.DEST_REGISTERCURRENCY) {

        lengthOfDestination = Buffer.byteLength(destination);
    } else {

        lengthOfDestination = constants.UINT160_LENGTH;

    }

    encodedOutput = Buffer.concat([encodedOutput, util.writeCompactSize(lengthOfDestination), destination]);

    return encodedOutput;
}



function serializeCrossChainExport(cce) {

    let encodedOutput = util.writeUInt(cce.version, 16);
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(cce.flags, 16)]);
    encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check(cce.sourcesystemid, 160).hash]);
    //hashtransfers uint256
    encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(cce.hashtransfers), 'hex')]);
    encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check(cce.destinationsystemid, 160).hash]);
    encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check(cce.destinationcurrencyid, 160).hash]);
    encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(cce.sourceheightstart)]);
    encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(cce.sourceheightend)]);
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(cce.numinputs, 32)]);
    //totalamounts CCurrencyValueMap
    encodedOutput = Buffer.concat([encodedOutput, serializeCCurrencyValueMapArray(cce.totalamounts)]);
    //totalfees CCurrencyValueMap
    encodedOutput = Buffer.concat([encodedOutput, serializeCCurrencyValueMapArray(cce.totalfees)]);
    //totalburned CCurrencyValueMap
    encodedOutput = Buffer.concat([encodedOutput, util.writeCompactSize(1), serializeCCurrencyValueMap(cce.totalburned[0])]); //fees always blank value map 0
    //CTransfer DEstionation for Reward Address
    let typeETH = Buffer.alloc(1);
    typeETH.writeUInt8(4); //eth type

    encodedOutput = Buffer.concat([encodedOutput, typeETH]);
    let destination = Buffer.from(bitGoUTXO.address.fromBase58Check(cce.rewardaddress, 160).hash); // TODO: [EB-3] Daemon expects vector not uint160

    encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(destination.length), destination]);

    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(cce.firstinput, 32)]);

    let reserveTransfers = Buffer.alloc(1);
    reserveTransfers.writeUInt8(0); //empty reserve transfers

    encodedOutput = Buffer.concat([encodedOutput, reserveTransfers]);

    return encodedOutput;
}

function serializeCReserveTransfers(crts) {

    let encodedOutput = Buffer.from(''); //util.writeCompactSize(crts.length);
    for (let i = 0; i < crts.length; i++) {
        encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(crts[i].version)]); // should be 1 for single transfer
        if (crts[i].currencyvalue)
            encodedOutput = Buffer.concat([encodedOutput, serializeCCurrencyValueMapVarInt(crts[i].currencyvalue)]); // TODO: [EB-2] Varint instead of uint64
        else
            encodedOutput = Buffer.concat([encodedOutput, serializeCCurrencyValueMapVarInt(crts[i].currencyvalues)]);

        encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(crts[i].flags)]);
        encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(crts[i].feecurrencyid), 'hex')]);
        encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(crts[i].fees)]);
        encodedOutput = Buffer.concat([encodedOutput, serializeCTransferDestination(crts[i].destination)]);
        if (crts[i].destcurrencyid)
            encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(crts[i].destcurrencyid), 'hex')]);
        else
            encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(crts[i].destinationcurrencyid), 'hex')]);
        if ((crts[i].flags & 0x400) == 0x400)
            encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(crts[i].secondreserveid), 'hex')]);

        if ((crts[i].flags & 0x40) == 0x40 && crts[i].destsystemid)
            encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(crts[i].destsystemid), 'hex')]);
        else if ((crts[i].flags & 0x40) == 0x40 && crts[i].exportto)
            encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(crts[i].exportto), 'hex')]);
        // if(logging)
        //  console.log("log of CReserve: ",JSON.stringify(crts[i]));
    }

    return encodedOutput; //Buffer.from(removeHexLeader(
}

//takes in an array of proof strings and serializes
function serializeEthProof(proofArray) {
    if (proofArray === undefined) return null;
    let encodedOutput = util.writeVarInt(proofArray.length);
    //loop through the array and add each string length and the sstring
    //serialize account proof
    for (let i = 0; i < proofArray.length; i++) {
        //remove the 0x at the start of the string
        let proofElement = util.removeHexLeader(proofArray[i]);
        encodedOutput = Buffer.concat([encodedOutput, util.writeCompactSize(proofElement.length / 2)]);
        encodedOutput = Buffer.concat([encodedOutput, Buffer.from(proofElement, 'hex')]);
    }
    return encodedOutput;
}

function serializeEthFullProof(ethProof) {
    let encodedOutput = Buffer.alloc(1);
    let version = 1;
    encodedOutput.writeUInt8(version);

    let type = 3; //type eth
    let typeBuffer = Buffer.alloc(1);
    typeBuffer.writeUInt8(type);
    encodedOutput = Buffer.concat([encodedOutput, typeBuffer]);

    //write accountProof length
    //proof size as an int 32
    let sizeBuffer = Buffer.alloc(4);
    sizeBuffer.writeUInt32LE(1);
    encodedOutput = Buffer.concat([encodedOutput, sizeBuffer]);

    let branchTypeBuffer = Buffer.alloc(1);
    branchTypeBuffer.writeUInt8(4); //eth branch type
    encodedOutput = Buffer.concat([encodedOutput, branchTypeBuffer]);
    //merkle branch base
    encodedOutput = Buffer.concat([encodedOutput, branchTypeBuffer]);

    //serialize account proof
    encodedOutput = Buffer.concat([encodedOutput, serializeEthProof(ethProof.accountProof)]);
    //serialize address bytes 20
    encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(ethProof.address), 'hex')]);
    let balanceBuffer = Buffer.alloc(8);
    let balancehex = util.removeHexLeader(web3.utils.numberToHex(ethProof.balance));
    let isBigBalance = balancehex.length > 16 || balancehex === "ffffffffffffffff";

    if (isBigBalance) {
        balanceBuffer = Buffer.from("ffffffffffffffff", 'hex')
    } else {
        balanceBuffer.writeBigUInt64LE(BigInt(ethProof.balance));
    }
    encodedOutput = Buffer.concat([encodedOutput, balanceBuffer]);
    //serialize codehash bytes 32
    encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(ethProof.codeHash), 'hex')]);
    //serialize nonce as uint32

    encodedOutput = Buffer.concat([encodedOutput, util.writeVarInt(ethProof.nonce)]);
    //serialize storageHash bytes 32
    encodedOutput = Buffer.concat([encodedOutput, Buffer.from(util.removeHexLeader(ethProof.storageHash), 'hex')]);

    //loop through storage proofs
    let key = util.removeHexLeader(ethProof.storageProof[0].key);
    key = web3.utils.padLeft(key, 64);
    // if(key.length % 2 != 0) key = '0'.concat(key);
    encodedOutput = Buffer.concat([encodedOutput, Buffer.from(key, 'hex')]);
    encodedOutput = Buffer.concat([encodedOutput, serializeEthProof(ethProof.storageProof[0].proof)]);

    let proof = util.removeHexLeader(ethProof.storageProof[0].value);

    //if(proof.length % 2 != 0) proof = '0'.concat(proof);
    proof = web3.utils.padLeft(proof, 64);
    let proofval = Buffer.alloc(32);
    Buffer.from(proof, 'hex').copy(proofval);
    encodedOutput = Buffer.concat([encodedOutput, proofval]);
    if (isBigBalance) {
        let temphexreversed = web3.utils.padLeft(balancehex, 64).match(/[a-fA-F0-9]{2}/g).reverse().join('');
        let tempbuf = Buffer.from(temphexreversed, 'hex');
        encodedOutput = Buffer.concat([encodedOutput, tempbuf]);
    }
    //append 12 0s to the end of the buffer to override the component part of the Proof
    return encodedOutput;
}

/** get Proof for **/
async function getProof(eIndex, blockHeight) {
    let index = "0000000000000000000000000000000000000000000000000000000000000000";

    let position = Buffer.alloc(4);
    position.writeUInt32BE(eIndex);
    let posString = position.toString('hex');
    posString = web3.utils.padLeft(posString, 64);

    let key = web3.utils.sha3("0x" + posString + index, { "encoding": "hex" });

    try {

        let proof = await web3.eth.getProof(storageAddress, [key], blockHeight);
        return proof;
    } catch (error) {
        console.log("error:", error);
        return { status: false, error: error };
    }
}

// create the component parts for the proof

function createComponents(transfers, blockHeight, previousExportHash, poolavailable) {

    let cce = createCrossChainExport(transfers, blockHeight, false, poolavailable);
    //Var Int Components size as this can only 
    let encodedOutput = util.writeCompactSize(1);
    //eltype
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(7, 16)]);
    //elIdx
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(0, 16)]);
    //elVchObj
    let exportKey = constants.VDXFDATAKEY[ticker]; // TODO: [EB-1] Hardcoded
    let serializedVDXF = Buffer.from(exportKey, 'hex');
    let version = 1;
    serializedVDXF = Buffer.concat([serializedVDXF, util.writeUInt(version, 1)]);

    let serialized = Buffer.from(serializeCrossChainExport(cce));

    let prevhash = Buffer.from(util.removeHexLeader(previousExportHash), 'hex');

    serialized = Buffer.concat([serialized, prevhash]);

    //let hashofcce_reserves = keccak256(serialized);
    // let serialization = Buffer.concat([serializeCrossChainExport(cce),serializeCReserveTransfers(transfers).slice(1)]);
    //console.log("Hash of cce+reservet: \n", hashofcce_reserves.toString('hex'));
    //console.log("serialization of ccx + prevhash: \n", serialized.toString('hex'));

    serialized = Buffer.concat([util.writeCompactSize(serialized.length), serialized]);

    serialized = Buffer.concat([serializedVDXF, serialized]);

    serialized = Buffer.concat([util.writeCompactSize(serialized.length), serialized]);

    encodedOutput = Buffer.concat([encodedOutput, serialized]);
    encodedOutput = Buffer.concat([encodedOutput, Buffer.from('00000000', 'hex')]); //no elproof
    return encodedOutput.toString('Hex');

}
//create an outbound trans
function createOutboundTransfers(transfers) {
    let outTransfers = [];
    for (let i = 0; i < transfers.length; i++) {
        let transfer = transfers[i];
        let outTransfer = {};
        outTransfer.version = 1;
        outTransfer.currencyvalues = {
            [util.ethAddressToVAddress(transfer.currencyvalue.currency, IAddress)]: util.uint64ToVerusFloat(transfer.currencyvalue.amount)
        };
        outTransfer.flags = transfer.flags;
        //outTransfer.crosssystem = true;
        outTransfer.exportto = util.ethAddressToVAddress(transfer.destsystemid, IAddress);
        //outTransfer.convert = true;
        outTransfer.feecurrencyid = util.ethAddressToVAddress(transfer.feecurrencyid, IAddress);
        outTransfer.fees = util.uint64ToVerusFloat(transfer.fees);

        if ((parseInt(transfer.flags) & 1024) == 1024) { // RESERVETORESERVE FLAG
            outTransfer.destinationcurrencyid = util.ethAddressToVAddress(transfer.secondreserveid, IAddress);
            outTransfer.via = util.ethAddressToVAddress(transfer.destcurrencyid, IAddress);
        } else {
            outTransfer.destinationcurrencyid = util.ethAddressToVAddress(transfer.destcurrencyid, IAddress);
        }

        let address = {};

        if ((parseInt(transfer.destination.destinationtype) & 127) == 2) {

            address = util.ethAddressToVAddress(transfer.destination.destinationaddress.slice(0, 42), RAddressBaseConst);
        } else if ((parseInt(transfer.destination.destinationtype) & 127) == 4) {

            address = util.ethAddressToVAddress(transfer.destination.destinationaddress.slice(0, 42), IAddress);
        } else {
            address = transfer.destination.destinationaddress.slice(0, 42);

        }

        outTransfer.destination = {
            "type": transfer.destination.destinationtype,
            "address": address,
            "gateway": transfer.destination.destinationaddress.length > 42 ? util.ethAddressToVAddress(transfer.destination.destinationaddress.slice(42, 82), IAddress) : "",
            "fees": transfer.destination.destinationaddress.length > 42 ? parseInt(transfer.destination.destinationaddress.slice(transfer.destination.destinationaddress.length - 16, transfer.destination.destinationaddress.length - 1).match(/[a-fA-F0-9]{2}/g).reverse().join(''), 16) / 100000000 : ""
        }
        outTransfers.push(outTransfer);
    }
    return outTransfers;
}

function createCrossChainExport(transfers, blockHeight, jsonready = false, poolavailable) {
    let cce = {};
    let hash = keccak256(serializeCReserveTransfers(transfers));
    // console.log("hash of transfers: ",hash.toString('Hex'));
    // console.log("Serialize: ",serializeCReserveTransfers(transfers).slice(1).toString('Hex'));
    cce.version = 1;
    cce.flags = 2;
    cce.sourcesystemid = ETHSystemID;
    cce.hashtransfers = hash.toString('hex'); //hash the transfers
    cce.destinationsystemid = VerusSystemID;

    if (poolavailable) {
        cce.destinationcurrencyid = BridgeID;
    } else {
        cce.destinationcurrencyid = VerusSystemID;
    }

    cce.sourceheightstart = blockHeight;
    cce.sourceheightend = blockHeight;
    cce.numinputs = transfers.length;
    cce.totalamounts = [];
    let totalamounts = [];
    cce.totalfees = [];
    let totalfees = [];
    for (let i = 0; i < transfers.length; i++) {
        //sum up all the currencies 
        if (util.uint160ToVAddress(transfers[i].currencyvalue.currency, IAddress) in totalamounts)
            totalamounts[util.uint160ToVAddress(transfers[i].currencyvalue.currency, IAddress)] += parseInt(transfers[i].currencyvalue.amount);
        else
            totalamounts[util.uint160ToVAddress(transfers[i].currencyvalue.currency, IAddress)] = parseInt(transfers[i].currencyvalue.amount);
        //add fees to the total amounts
        if (util.uint160ToVAddress(transfers[i].feecurrencyid, IAddress) in totalamounts)
            totalamounts[util.uint160ToVAddress(transfers[i].feecurrencyid, IAddress)] += parseInt(transfers[i].fees);
        else
            totalamounts[util.uint160ToVAddress(transfers[i].feecurrencyid, IAddress)] = parseInt(transfers[i].fees);


        if (util.uint160ToVAddress(transfers[i].feecurrencyid, IAddress) in totalfees)
            totalfees[util.uint160ToVAddress(transfers[i].feecurrencyid, IAddress)] += parseInt(transfers[i].fees);
        else
            totalfees[util.uint160ToVAddress(transfers[i].feecurrencyid, IAddress)] = parseInt(transfers[i].fees);
    }
    for (let key in totalamounts) {
        cce.totalamounts.push({ "currency": key, "amount": (jsonready ? util.uint64ToVerusFloat(totalamounts[key]) : totalamounts[key]) });
    }
    for (let key in totalfees) {
        cce.totalfees.push({ "currency": key, "amount": (jsonready ? util.uint64ToVerusFloat(totalfees[key]) : totalfees[key]) });
    }

    //  console.log(JSON.stringify(cce.totalamounts));
    cce.totalburned = [{ "currency": '0x0000000000000000000000000000000000000000', "amount": 0 }]; // TODO: serialiser doesnt like empty strings or non BIgints
    cce.rewardaddress = "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB"; //  TODO: what should this be?
    cce.firstinput = 1;
    //console.log("cce", JSON.stringify(cce));
    return cce;
}

function createCrossChainExportToETH(transfers, blockHeight, jsonready = false) { //TODO: This may not be nessassary for the import into vETH
    let cce = {};
    let hash = keccak256(serializeCReserveTransfers(transfers));
    //console.log("hash of transfers: ",hash.toString('Hex'));

    //console.log("Serialize: ",serializeCReserveTransfers(transfers).slice(1).toString('Hex'));
    cce.version = 1;
    cce.flags = 2;
    cce.sourcesystemid = util.convertVerusAddressToEthAddress(ETHSystemID);
    cce.hashtransfers = "0x" + hash.toString('hex'); //hash the transfers
    cce.destinationsystemid = util.convertVerusAddressToEthAddress(VerusSystemID);

    if (transfers[0].destcurrencyid.slice(0, 2) == "0x" && transfers[0].destcurrencyid.length == 42) {
        cce.destinationcurrencyid = transfers[0].destcurrencyid; //TODO:VERIFY
    } else {
        cce.destinationcurrencyid = util.convertVerusAddressToEthAddress(transfers[0].destcurrencyid); //TODO:VERIFY
    }

    cce.sourceheightstart = 1;
    cce.sourceheightend = 2;

    cce.numinputs = transfers.length;
    cce.totalamounts = [];
    let totalamounts = [];
    cce.totalfees = [];
    let totalfees = [];

    for (let i = 0; i < transfers.length; i++) {
        //sum up all the currencies
        if (transfers[i].currencyvalue.currency in totalamounts)
            totalamounts[transfers[i].currencyvalue.currency] += transfers[i].currencyvalue.amount;
        else
            totalamounts[transfers[i].currencyvalue.currency] = transfers[i].currencyvalue.amount;
        //add fees to the total amounts
        if (transfers[i].feecurrencyid in totalamounts)
            totalamounts[transfers[i].feecurrencyid] += transfers[i].fees;
        else
            totalamounts[transfers[i].feecurrencyid] = transfers[i].fees;

        if (transfers[i].feecurrencyid in totalfees)
            totalfees[transfers[i].feecurrencyid] += transfers[i].fees;
        else
            totalfees[transfers[i].feecurrencyid] = transfers[i].fees;
    }
    for (let key in totalamounts) {
        cce.totalamounts.push({ "currency": key, "amount": (jsonready ? util.uint64ToVerusFloat(totalamounts[key]) : totalamounts[key]) });
    }
    for (let key in totalfees) {
        cce.totalfees.push({ "currency": key, "amount": (jsonready ? util.uint64ToVerusFloat(totalfees[key]) : totalfees[key]) });
    }
    //  console.log(JSON.stringify(cce.totalamounts));
    cce.totalburned = [{ "currency": '0x0000000000000000000000000000000000000000', "amount": 0 }]; // TODO: serialiser doesnt like empty strings or non BIgints
    cce.rewardaddress = { destinationtype: 9, destinationaddress: util.convertVerusAddressToEthAddress("iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB") }; //  TODO: what should this be
    cce.firstinput = 1;
    return cce;
}

/** core functions */

exports.getInfo = async() => {
    //getinfo is just tested to see that its not null therefore we can just return the version
    //check that we can connect to Ethereum if not return null to kill the connection
    try {

        var d = new Date();
        var timenow = d.getTime();
        if (globaltimedelta + globallastinfo < timenow) {
            globallastinfo = timenow;
            let info = await verusBridge.methods.getinfo().call();

            let decodedParams = abi.decodeParameters(
                ['uint256', 'string', 'uint256', 'uint256', 'string', 'bool'],
                "0x" + info.slice(66));

            globalgetinfo = {
                "version": decodedParams[0],
                "name": decodedParams[4],
                "VRSCversion": decodedParams[1],
                "blocks": decodedParams[2],
                "tiptime": decodedParams[3],
                "testnet": decodedParams[5],
            }
            console.log("Command: getinfo");
        }
        return { "result": globalgetinfo };
    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "Error getInfo:" + error);
        return { "result": { "error": true, "message": error } };
    }


}

exports.getCurrency = async(input) => {

    try {
        let currency = input[0];
        //convert i address to an eth address
        var d = new Date();
        var timenow = d.getTime();

        if (globaltimedelta + globallastcurrency < timenow) {
            globallastcurrency = timenow;
            let info = await verusBridge.methods.getcurrency(util.convertVerusAddressToEthAddress(currency)).call();
            //complete tiptime with the time of a block
            //convert the CTransferDestination
            //convert notary adddresses
            let notaries = [];
            let jime = ['uint', 'string', 'address', 'address', 'address', 'uint8', 'uint8', [
                ['uint8', 'bytes']
            ], 'address', 'uint', 'uint', 'uint256', 'uint256', 'address', 'address[]', 'uint']
            let decodedParams = abi.decodeParameters(jime,
                "0x" + info.slice(66));

            for (let i = 0; i < decodedParams[14].length; i++) {
                notaries[i] = util.ethAddressToVAddress(decodedParams[14][i], IAddress);
            }

            globalgetcurrency = {
                "version": decodedParams[0],
                "name": decodedParams[1],
                "options": (decodedParams[1] === "VETH") ? 172 : 96,
                "currencyid": util.uint160ToVAddress(decodedParams[2], IAddress),
                "parent": util.uint160ToVAddress(decodedParams[3], IAddress),
                "systemid": util.uint160ToVAddress(decodedParams[4], IAddress),
                "notarizationprotocol": decodedParams[5],
                "proofprotocol": decodedParams[6],
                "nativecurrencyid": { "address": '0x' + BigInt(decodedParams[7][1], IAddress).toString(16), "type": decodedParams[7][0] },
                "launchsystemid": util.uint160ToVAddress(decodedParams[8], IAddress),
                "startblock": decodedParams[9],
                "endblock": decodedParams[10],
                "initialsupply": decodedParams[11],
                "prelaunchcarveout": decodedParams[12],
                "gatewayid": util.uint160ToVAddress(decodedParams[13], IAddress),
                "notaries": notaries,
                "minnotariesconfirm": decodedParams[15],
                "gatewayconvertername": (decodedParams[1] === "VETH") ? "Bridge" : ""
            };
            console.log("Command: getcurrency");
        }

        return { "result": globalgetcurrency };
    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "getCurrency:" + error);
        return { "result": { "error": true, "message": error } };
    }
}

exports.getExports = async(input) => {

    let output = [];

    let chainname = input[0];
    let heightstart = input[1];
    let heightend = input[2];

    try {
        //input chainname should always be VETH
        let poolavailable = await verusBridge.methods.isPoolAvailable().call();

        if (chainname != VerusSystemID) throw "i-Address not VRSCTEST";
        if (heightstart > 0 && heightstart < verusBridgeStartBlock || heightstart == 1)
            heightstart = 0;

        //if undefined default to the last block available - 20 and last block available (this might break the node as too many queries)
        if (heightend == undefined) heightend = await web3.eth.getBlockNumber();
        if (heightstart == undefined) heightstart = heightend;

        //end block is after startblock
        if (heightstart > 0 && heightend > 0 && heightend < heightstart) throw { message: "Start/End Height out of range: " };
        //heightstart = heightend -200;
        let exportSets = await verusBridge.methods.getReadyExportsByRange(heightstart, heightend).call();
        //exportSets = parseContractExports(exportSets);
        console.log("Height end: ", heightend, "heightStart:", heightstart);

        for (let i = 0; i < exportSets.length; i++) {
            //loop through and add in the proofs for each export set and the additional fields
            let exportSet = exportSets[i];
            let outputSet = {};
            outputSet.height = exportSet.blockHeight;
            outputSet.txid = util.removeHexLeader(exportSet.exportHash).match(/[a-fA-F0-9]{2}/g).reverse().join(''); //export hash used for txid
            outputSet.txoutnum = 0; //exportSet.position;
            outputSet.exportinfo = createCrossChainExport(exportSet.transfers, exportSet.blockHeight, true, poolavailable);
            outputSet.partialtransactionproof = await getProof(exportSet.blockHeight, heightend);

            //serialize the prooflet index 
            let components = createComponents(exportSet.transfers, parseInt(exportSet.blockHeight, 10), exportSet.prevExportHash, poolavailable);
            outputSet.partialtransactionproof = serializeEthFullProof(outputSet.partialtransactionproof).toString('hex') + components;
            // outputSet.txid = components.txid;

            //build transfer list
            //get the transactions at the index
            outputSet.transfers = createOutboundTransfers(exportSet.transfers);
            console.log("ETH Send to Verus: ", outputSet.transfers[0].currencyvalues, " to ", outputSet.transfers[0].destination);
            //loop through the 
            output.push(outputSet);
        }

        // console.log(JSON.stringify(output));
        return { "result": output };
    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "GetExports error:" + error);
        return { "result": { "error": true, "message": error } };
    }
}

exports.getBestProofRoot = async(input) => {
    //loop through the proofroots and check each one
    //console.log(input);
    let proofroots = input[0].proofroots;
    let bestindex = 0;
    let validindexes = [];
    let latestproofroot = {};
    // block = await web3.eth.getBlock("latest");
    try {
        if (input.length && proofroots) {
            for (let i = 0; i < proofroots.length; i++) {
                // console.log(proofroots[i]);
                if (await checkProofRoot(proofroots[i].height, proofroots[i].stateroot, proofroots[i].blockhash, BigInt(util.addBytesIndicator(proofroots[i].power)))) {
                    validindexes.push(i);
                    if (proofroots[bestindex].height < proofroots[i].height) bestindex = i;
                }
            }
        }


        latestproofroot = await getProofRoot();
        if (logging) {
            console.log("getbestproofroot result:", { bestindex, validindexes, latestproofroot });
        }

        return { "result": { bestindex, validindexes, latestproofroot } };

    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "getBestProofRoot error:" + error);
        return { "result": { "error": true, "message": error } };
    }
}

async function getProofRoot() {

    let block;
    try {
        block = await web3.eth.getBlock("latest");
    } catch (error) {
        throw "web3.eth.getBlock error:"
    }
    let latestproofroot = {};
    latestproofroot.version = 1;
    latestproofroot.type = 2;
    latestproofroot.systemid = ETHSystemID;
    latestproofroot.height = block.number;
    latestproofroot.stateroot = util.removeHexLeader(block.stateRoot).match(/[a-fA-F0-9]{2}/g).reverse().join('');
    latestproofroot.blockhash = util.removeHexLeader(block.hash).match(/[a-fA-F0-9]{2}/g).reverse().join('');
    latestproofroot.power = BigInt(block.totalDifficulty).toString(16);
    return latestproofroot;

}

async function getLastProofRoot() {
    let lastProof = {};
    try {
        lastProof = await verusBridge.methods.getLastProofRoot().call();
    } catch (error) {

        throw "web3.eth.getLastProofRoot error:"
    }
    let lastproofroot = {};
    lastproofroot.version = parseInt(lastProof.version, 10);
    lastproofroot.type = parseInt(lastProof.cprtype, 10);
    lastproofroot.systemid = VerusSystemID;
    lastproofroot.height = parseInt(lastProof.rootheight, 10);
    lastproofroot.stateroot = util.removeHexLeader(lastProof.stateroot);
    lastproofroot.blockhash = util.removeHexLeader(lastProof.blockhash);
    lastproofroot.power = util.removeHexLeader(lastProof.compactpower);
    return lastproofroot;

}

async function checkProofRoot(height, stateroot, blockhash, power) {
    //  console.log("height:", height);
    let block = {};

    try {
        block = await web3.eth.getBlock(height);

    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "web3.eth.getBlock error:" + error);
        throw "web3.eth.getBlock error:"

    }
    // block.
    //  console.log("retrieved block at height ", height);
    //  console.log("block:", block.status, block.stateRoot, block.hash, block.totalDifficulty);
    //  console.log("params:", height, stateroot, blockhash, BigInt(power).toString(16));

    if (!block.stateRoot) {
        return false;

    }

    block.stateRoot = util.removeHexLeader(block.stateRoot).match(/[a-fA-F0-9]{2}/g).reverse().join('');
    block.hash = util.removeHexLeader(block.hash).match(/[a-fA-F0-9]{2}/g).reverse().join('');
    //  console.log(blockStateRoot, newBlockHash, BigInt(block.totalDifficulty).toString(16));
    if (block.stateRoot == stateroot && blockhash == block.hash && BigInt(block.totalDifficulty).toString(16) == BigInt(power).toString(16)) {
        return true;
    } else {
        return false;
    }
}

//return the data required for a notarisation to be made
exports.getNotarizationData = async() => {

    //create a CProofRoot from the block data
    let block;
    try {
        block = await web3.eth.getBlock("latest");
        let Notarization = {};
        Notarization.version = 1;
        //possibly check the contract exists?
        Notarization.launchconfirmed = true;
        Notarization.launchcomplete = true;
        Notarization.mirror = true;
        //proposer should be set to something else this is just sample data
        Notarization.proposer = {
            "type": 4,
            "address": "iPveXFAHwModR7LrvgzxxHvdkKH84evYvT"
        };
        Notarization.currencyid = ETHSystemID; // this should actually be the last VRSC or VRSCTEST notarization as a mirror, but first is ignored
        Notarization.notarizationheight = block.number;
        Notarization.currencystate = {};
        Notarization.currencystate[ETHSystemID] = {
            "flags": 0,
            "version": 1,
            "launchcurrencies": [{
                "currencyid": 0,
                "weight": 0.00000000,
                "reserves": 1.00000000,
                "priceinreserve": 1.00000000
            }],
            "initialsupply": 0.00000000,
            "emitted": 0.00000000,
            "supply": 0.00000000,
            "currencies": {},
            "primarycurrencyfees": 0.00000000,
            "primarycurrencyconversionfees": 0.00000000,
            "primarycurrencyout": 0.00000000,
            "preconvertedout": 0.00000000
        };
        Notarization.currencystate[ETHSystemID].currencyid = ETHSystemID;
        Notarization.currencystate[ETHSystemID].currencies[ETHSystemID] = {
            "reservein": 0.00000000,
            "primarycurrencyin": 0.00000000,
            "reserveout": 0.00000000,
            "lastconversionprice": 1.00000000,
            "viaconversionprice": 0.00000000,
            "fees": 0.00000000,
            "conversionfees": 0.00000000,
            "priorweights": 0.00000000
        };
        Notarization.currencystate[ETHSystemID].launchcurrencies[0].currencyid = ETHSystemID;
        Notarization.prevnotarizationtxid = "0";
        Notarization.prevnotarizationout = 0;
        Notarization.prevheight = 0;

        Notarization.currencystates = [{
            ETHSystemID: {
                "flags": 0,
                "version": 1,
                "currencyid": ETHSystemID,
                "launchcurrencies": [{
                    "currencyid": ETHSystemID,
                    "weight": 0.00000000,
                    "reserves": 1.00000000,
                    "priceinreserve": 1.00000000
                }],
                "initialsupply": 0.00000000,
                "emitted": 0.00000000,
                "supply": 0.00000000,
                "currencies": {
                    ETHSystemID: {
                        "reservein": 0.00000000,
                        "primarycurrencyin": 0.00000000,
                        "reserveout": 0.00000000,
                        "lastconversionprice": 1.00000000,
                        "viaconversionprice": 0.00000000,
                        "fees": 0.00000000,
                        "conversionfees": 0.00000000,
                        "priorweights": 0.00000000
                    }
                },
                "primarycurrencyfees": 0.00000000,
                "primarycurrencyconversionfees": 0.00000000,
                "primarycurrencyout": 0.00000000,
                "preconvertedout": 0.00000000
            }
        }];

        let CProofRoot = {};
        CProofRoot.version = 1;
        CProofRoot.type = 2;
        CProofRoot.systemid = ETHSystemID;
        CProofRoot.rootheight = block.number;
        CProofRoot.stateroot = block.stateRoot;
        CProofRoot.blockhash = block.hash;
        CProofRoot.compactPower = 0; //not required for an eth proof to my knowledge

        Notarization.proofroots = CProofRoot;
        Notarization.nodes = [];
        Notarization.forks = [
            [0]
        ];
        Notarization.lastconfirmedheight = 0;
        Notarization.lastconfirmed = 0;
        Notarization.betchain = 0;

        return { "result": Notarization };

    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "getNotarizationData:" + error);
        return { "result": { "error": true, "message": error } };
    }
}

/** send transactions to ETH 
 * CTransferArray, an array of CTransfer
 * CTransferSet is a CTransferSet
 * proof is an array of bytes32
 * blockheight uint32
 * hashIndex uint32
 */

function conditionSubmitImports(CTransferArray) {

    for (let i = 0; i < CTransferArray.length; i++) {

        CTransferArray[i].notarizationtxid = addHexPrefix(CTransferArray[i].notarizationtxid);
        CTransferArray[i].sourcesystemid = util.convertVerusAddressToEthAddress(CTransferArray[i].sourcesystemid);
        for (let j = 0; j < CTransferArray[i].exports.length; j++) {
            CTransferArray[i].exports[j].partialtransactionproof = addHexPrefix(CTransferArray[i].exports[j].partialtransactionproof);
            CTransferArray[i].exports[j].txid = addHexPrefix(CTransferArray[i].exports[j].txid.match(/[a-fA-F0-9]{2}/g).reverse().join(''));
            for (let k = 0; k < CTransferArray[i].exports[j].transfers.length; k++) {

                let keys = Object.keys(CTransferArray[i].exports[j].transfers[k].currencyvalues);

                for (const vals of keys) {
                    CTransferArray[i].exports[j].transfers[k].currencyvalues[util.convertVerusAddressToEthAddress(vals)] =
                        parseInt(util.convertToInt64(CTransferArray[i].exports[j].transfers[k].currencyvalues[vals]));
                    delete CTransferArray[i].exports[j].transfers[k].currencyvalues[vals];
                }
                if (CTransferArray[i].exports[j].transfers[k].destination.type == 4 ||
                    CTransferArray[i].exports[j].transfers[k].destination.type == 2) //type PKH or ID
                {
                    CTransferArray[i].exports[j].transfers[k].destination.address =
                        util.convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].destination.address);
                }
                if (CTransferArray[i].exports[j].transfers[k].destination.type == constants.DEST_REGISTERCURRENCY ||
                    CTransferArray[i].exports[j].transfers[k].destination.type == constants.DEST_FULLID) {

                    CTransferArray[i].exports[j].transfers[k].destination.address = "0x" + CTransferArray[i].exports[j].transfers[k].destination.serializeddata;
                }

                CTransferArray[i].exports[j].transfers[k].destinationcurrencyid =
                    util.convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].destinationcurrencyid);
                CTransferArray[i].exports[j].transfers[k].exportto =
                    util.convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].exportto);
                CTransferArray[i].exports[j].transfers[k].feecurrencyid =
                    util.convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].feecurrencyid);
                CTransferArray[i].exports[j].transfers[k].fees =
                    parseInt(util.convertToInt64(CTransferArray[i].exports[j].transfers[k].fees));
                CTransferArray[i].exports[j].transfers[k].secondreserveid = CTransferArray[i].exports[j].transfers[k].secondreserveid ?
                    util.convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].secondreserveid) :
                    "0x0000000000000000000000000000000000000000"; //dummy value never read if not set as flags will not read.
                if (CTransferArray[i].exports[j].transfers[k].via) {
                    CTransferArray[i].exports[j].transfers[k].via =
                        util.convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].via);
                }
            }
        }
    }
    return CTransferArray;
}

function fixETHObjects(inputArray) {

    for (let i = 0; i < inputArray.length; i++) {

        let keys = Object.keys(inputArray[i].currencyvalues);

        for (var key of keys) {
            inputArray[i].currencyvalue = { "currency": key, "amount": inputArray[i].currencyvalues[key] };
        }
        delete inputArray[i].currencyvalues;

        inputArray[i].destination.destinationaddress = inputArray[i].destination.address
        inputArray[i].destination.destinationtype = inputArray[i].destination.type

        delete inputArray[i].destination.address;
        delete inputArray[i].destination.type;
        if ((parseInt(inputArray[i].flags) & 1024) == 1024) { // RESERVETORESERVE FLAG
            inputArray[i].destcurrencyid = inputArray[i].via;
            inputArray[i].secondreserveid = inputArray[i].destinationcurrencyid;
        } else {
            inputArray[i].destcurrencyid = inputArray[i].destinationcurrencyid;
        }
        delete inputArray[i].destinationcurrencyid;

        inputArray[i].destsystemid = inputArray[i].exportto;
        delete inputArray[i].exportto;


    }

    return inputArray;
}

function reshapeTransfers(CTransferArray) {
    let CTempArray = [];

    for (let i = 0; i < CTransferArray.length; i++) {
        for (let j = 0; j < CTransferArray[i].exports.length; j++) {

            const transfers = fixETHObjects(CTransferArray[i].exports[j].transfers);
            const serializedTransfers = serializeCReserveTransfers(transfers);
            if (i == -1)
                console.log("Serialized transfers: 0x", serializedTransfers.toString('hex'));
            let exportinfo = createCrossChainExportToETH(transfers);

            let subarray = {
                height: 1,
                txid: CTransferArray[i].exports[j].txid,
                txoutnum: CTransferArray[i].exports[j].txoutnum,
                exportinfo,
                partialtransactionproof: [CTransferArray[i].exports[j].partialtransactionproof],
                transfers: CTransferArray[i].exports[j].transfers,
                serializedTransfers: addHexPrefix(serializedTransfers.toString('hex'))
            };

            CTempArray.push(subarray);
            //let hashtest = keccak256(serializedTransfers);
            //console.log("TRanmsfers hash: ", hashtest.toString('hex'));
        }
    }

    return CTempArray;
}

exports.submitImports = async(CTransferArray) => {
    //need to convert all the base64 encoded addresses back to uint160s to be correcly passed into solidity 
    //checks to 
    //    CTransferArray[0].height = 1;  // TODO: Remove Debug only
    //  console.log("Submitimports in :\n", JSON.stringify(CTransferArray));

    var d = new Date();
    var timenow = d.getTime();
    if (globaltimedelta + globalgetsubmitimports < timenow) {

        globalgetsubmitimports = timenow;

        CTransferArray = conditionSubmitImports(CTransferArray);

        let CTempArray = reshapeTransfers(CTransferArray);

        CTempArray = deserializer.deSerializeMMR(CTempArray);

        CTempArray = deserializer.insertHeights(CTempArray);

        let submitArray = [];
        //  console.log(JSON.stringify(CTempArray))

        try {

            for (let i = 0; i < CTempArray.length; i++) {
                let processed = await verusBridge.methods.checkImport(CTempArray[i].txid).call();
                if (!processed) {
                    submitArray.push(CTempArray[i])
                }
            }

            if (submitArray.length > 0) {
                globalsubmitimports = await verusBridge.methods.submitImports(submitArray).send({ from: account.address, gas: maxGas });
                //return { result: result.transactionHash };
            } else {

                return { result: "false" };

            }
        } catch (error) {
            // console.log("Error in\n", JSON.stringify(CTempArray));

            if (error.reason)
                console.log("\x1b[41m%s\x1b[0m", "submitImports:" + error.reason);
            else {
                if (error.receipt)

                    console.log("\x1b[41m%s\x1b[0m", "submitImports:" + error.receipt);
                console.log("\x1b[41m%s\x1b[0m", "submitImports:" + error);
            }
            return { result: { result: error.message } };
        }
    }

    return { result: globalsubmitimports.transactionHash };
}

function IsLaunchCleared(pBaasNotarization) {
    return pBaasNotarization.launchcleared == true ? constants.FLAG_START_NOTARIZATION : 0;
}

function IsLaunchConfirmed(pBaasNotarization) {
    return pBaasNotarization.launchconfirmed == true ? constants.FLAG_LAUNCH_CONFIRMED : 0;

}

function IsLaunchComplete(pBaasNotarization) {
    return pBaasNotarization.launchcomplete == true ? constants.FLAG_LAUNCH_COMPLETE : 0;
}

exports.submitAcceptedNotarization = async(params) => {

    let pBaasNotarization = params[0];
    let signatures = params[1].signatures; //signatures are in notary key pairs e.g. "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq" : ["1232"]
    //  console.log(JSON.stringify(params));
    try {

        let lastNotarizationHeight = await verusBridge.methods.lastBlockHeight().call();
        if (pBaasNotarization.notarizationheight <= lastNotarizationHeight) return { "result": "0" };

    } catch (error) {
        console.log("submitAcceptedNotarization Error:\n", error);
        return null;
    }


    pBaasNotarization.flags = IsLaunchCleared(pBaasNotarization) | IsLaunchConfirmed(pBaasNotarization) | IsLaunchComplete(pBaasNotarization);
    //change all iaddresses to ethAddress and add 0x to all hex
    pBaasNotarization.proposer.destinationtype = pBaasNotarization.proposer.type;
    pBaasNotarization.proposer.destinationaddress = util.convertVerusAddressToEthAddress(pBaasNotarization.proposer.address);
    delete pBaasNotarization.proposer.type;
    delete pBaasNotarization.proposer.address;
    pBaasNotarization.currencyid = util.convertVerusAddressToEthAddress(pBaasNotarization.currencyid);
    pBaasNotarization.currencystate = completeCurrencyState(pBaasNotarization.currencystate);
    //pBaasNotarization.currencystate.currencyid = convertVerusAddressToEthAddress(pBaasNotarization.currencystate.currencyid);
    pBaasNotarization.prevnotarization = {};
    pBaasNotarization.prevnotarization.hash = addHexPrefix(pBaasNotarization.prevnotarizationtxid);
    pBaasNotarization.prevnotarization.n = pBaasNotarization.prevnotarizationout;
    delete pBaasNotarization.prevnotarizationout;
    delete pBaasNotarization.prevnotarizationtxid;
    pBaasNotarization.hashprevnotarization = addHexPrefix(pBaasNotarization.hashprevnotarizationobject);
    delete pBaasNotarization.hashprevnotarizationobject;

    // complete currencystate
    //loop through currencystates and update the addresses

    let currencystates = [];
    for (let i = 0; i < pBaasNotarization.currencystates.length; i++) {
        let currencystate = {};
        let currencyids = Object.keys(pBaasNotarization.currencystates[i]);
        currencystate.currencyid = util.convertVerusAddressToEthAddress(currencyids[0]);
        currencystate.currencystate = completeCurrencyState(pBaasNotarization.currencystates[i][currencyids[0]]);
        currencystates.push(currencystate);
    }

    pBaasNotarization.currencystates = currencystates;

    for (let i = 0; i < pBaasNotarization.proofroots.length; i++) {

        pBaasNotarization.proofroots[i].cprtype = pBaasNotarization.proofroots[i].type;
        delete pBaasNotarization.proofroots[i].type;
        pBaasNotarization.proofroots[i].systemid = util.convertVerusAddressToEthAddress(pBaasNotarization.proofroots[i].systemid);
        pBaasNotarization.proofroots[i].rootheight = pBaasNotarization.proofroots[i].height;
        delete pBaasNotarization.proofroots[i].height;
        pBaasNotarization.proofroots[i].stateroot = addHexPrefix(pBaasNotarization.proofroots[i].stateroot);
        pBaasNotarization.proofroots[i].blockhash = addHexPrefix(pBaasNotarization.proofroots[i].blockhash);
        pBaasNotarization.proofroots[i].compactpower = addHexPrefix(pBaasNotarization.proofroots[i].power);
        delete pBaasNotarization.proofroots[i].power;
    }
    delete pBaasNotarization.launchcurrencies
        //build signature parameters
        //console.log("signatures:");
        //console.log(signatures);

    let sigKeys = Object.keys(signatures);

    if (signatures[sigKeys[0]].signatures.length == 0) throw "No Signatures present"; //what should i return if we get bad data
    let splitSigs = util.splitSignatures(signatures[sigKeys[0]].signatures);

    let vsVals = [];
    let rsVals = [];
    let ssVals = [];
    let blockheights = [];
    let notaryAddresses = [];
    for (let i = 0; i < sigKeys.length; i++) {

        splitSigs = util.splitSignature(signatures[sigKeys[i]].signatures[0]);
        vsVals.push(splitSigs.vVal);
        rsVals.push(splitSigs.rVal);
        ssVals.push(splitSigs.sVal);
        blockheights.push(signatures[sigKeys[i]].blockheight);
        notaryAddresses.push(util.convertVerusAddressToEthAddress(sigKeys[i]));
    }

    //process nodes

    for (let i = 0; i < pBaasNotarization.nodes.length; i++) {
        pBaasNotarization.nodes[i].nodeidentity = util.convertVerusAddressToEthAddress(pBaasNotarization.nodes[i].nodeidentity);
    }

    try {
        let txhash = {}
            // let test4 = await verusSerializer.methods.serializeCPBaaSNotarization(pBaasNotarization).call();

        //  console.log("result from serializeCPBaaSNotarization:\n", (test4));
        var firstNonce = await web3.eth.getTransactionCount(account.address);
        txhash = await verusBridge.methods.setLatestData(pBaasNotarization, vsVals, rsVals, ssVals, blockheights, notaryAddresses).call();
        // console.log(JSON.stringify(txhash));
        if (transactioncount != firstNonce) {
            txhash = await verusBridge.methods.setLatestData(pBaasNotarization, vsVals, rsVals, ssVals, blockheights, notaryAddresses).send({ from: account.address, gas: maxGas });
            transactioncount = firstNonce;
        }
        return { "result": txhash };

    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", error);
        //locknotorization = false;
        return { "result": { "txid": error } };
    }

}

function completeCurrencyState(currencyState) {

    //currencyState.systemid = convertVerusAddressToEthAddress(currencyState.systemid);
    currencyState.currencyid = util.convertVerusAddressToEthAddress(currencyState.currencyid);
    //currencyState.stateroot = addHexPrefix(currencyState.stateroot);
    //currencyState.blockhash = addHexPrefix(currencyState.blockhash);
    //currencyState.power = addHexPrefix(currencyState.power);

    if (currencyState.weights == undefined) currencyState.weights = [];
    if (currencyState.reserves == undefined) currencyState.reserves = [];
    if (currencyState.reservein == undefined) currencyState.reservein = [];
    if (currencyState.primarycurrencyin == undefined) currencyState.primarycurrencyin = [];
    if (currencyState.reserveout == undefined) currencyState.reserveout = [];
    if (currencyState.conversionprice == undefined) currencyState.conversionprice = [];
    if (currencyState.viaconversionprice == undefined) currencyState.viaconversionprice = [];
    if (currencyState.fees == undefined) currencyState.fees = [];
    if (currencyState.conversionfees == undefined) currencyState.conversionfees = [];
    if (currencyState.priorweights == undefined) currencyState.priorweights = [];
    //!! Because we are creating a matching hash of the import we need to just have a uint160[]
    if (currencyState.currencies !== undefined) {
        //loop through and convert from verusID to 0x address
        let currencies = [];
        let currencyids = Object.keys(currencyState.currencies);

        for (let i = 0; i < currencyids.length; i++) {
            if (currencyState.currencies[currencyids[i]].reservein != undefined) currencyState.reservein.push(amountFromValue(currencyState.currencies[currencyids[i]].reservein));
            else currencyState.reservein.push(0);
            if (currencyState.currencies[currencyids[i]].primarycurrencyin != undefined) currencyState.primarycurrencyin.push(amountFromValue(currencyState.currencies[currencyids[i]].primarycurrencyin));
            else currencyState.primarycurrencyin.push(0);
            if (currencyState.currencies[currencyids[i]].reserveout != undefined) currencyState.reserveout.push(amountFromValue(currencyState.currencies[currencyids[i]].reserveout));
            else currencyState.reserveout.push(0);
            if (currencyState.currencies[currencyids[i]].lastconversionprice != undefined) currencyState.conversionprice.push(amountFromValue(currencyState.currencies[currencyids[i]].lastconversionprice));
            else currencyState.conversionprice.push(0);
            if (currencyState.currencies[currencyids[i]].viaconversionprice != undefined) currencyState.viaconversionprice.push(amountFromValue(currencyState.currencies[currencyids[i]].viaconversionprice));
            else currencyState.viaconversionprice.push(0);
            if (currencyState.currencies[currencyids[i]].fees != undefined) currencyState.fees.push(amountFromValue(currencyState.currencies[currencyids[i]].fees));
            else currencyState.fees.push(0);
            if (currencyState.currencies[currencyids[i]].conversionfees != undefined) currencyState.conversionfees.push(amountFromValue(currencyState.currencies[currencyids[i]].conversionfees));
            else currencyState.conversionfees.push(0);
            if (currencyState.currencies[currencyids[i]].priorweights != undefined) currencyState.priorweights.push(amountFromValue(currencyState.currencies[currencyids[i]].priorweights));
            else currencyState.priorweights.push(0);
        }

        //loop through the object keys
        for (let j = 0; j < currencyids.length; j++) {
            currencies.push(util.convertVerusAddressToEthAddress(currencyids[j]));
        }
        currencyState.currencies = currencies;
    } else currencyState.currencies = [];


    if (currencyState.launchcurrencies != undefined && currencyState.launchcurrencies.length > 0) {
        for (let i = 0; i < currencyState.launchcurrencies.length; i++) {
            currencyState.weights.push(amountFromValue(currencyState.launchcurrencies[i].weight));
            currencyState.reserves.push(amountFromValue(currencyState.launchcurrencies[i].reserves));
        }

    } else if (currencyState.reservecurrencies != undefined && currencyState.reservecurrencies.length > 0) {
        for (let i = 0; i < currencyState.reservecurrencies.length; i++) {
            currencyState.weights.push(amountFromValue(currencyState.reservecurrencies[i].weight));
            currencyState.reserves.push(amountFromValue(currencyState.reservecurrencies[i].reserves));
        }
    }

    if (currencyState.initialsupply > 0) currencyState.initialsupply = amountFromValue(currencyState.initialsupply);
    if (currencyState.supply > 0) currencyState.supply = amountFromValue(currencyState.supply);
    if (currencyState.emitted > 0) currencyState.emitted = amountFromValue(currencyState.emitted);
    currencyState.primarycurrencyout = amountFromValue(currencyState.primarycurrencyout);
    if (currencyState.preconvertedout > 0) currencyState.preconvertedout = amountFromValue(currencyState.preconvertedout);
    if (currencyState.primarycurrencyfees > 0) currencyState.primarycurrencyfees = amountFromValue(currencyState.primarycurrencyfees);
    if (currencyState.primarycurrencyconversionfees > 0) currencyState.primarycurrencyconversionfees = amountFromValue(currencyState.primarycurrencyconversionfees);

    return currencyState;

}
//return the data required for a notarisation to be made
exports.getLastImportFrom = async() => {

    //create a CProofRoot from the block data
    let block;

    try {
        var d = new Date();
        var timenow = d.getTime();
        if (globaltimedelta + globalgetlastimport < timenow) {
            globalgetlastimport = timenow;
            block = await web3.eth.getBlock("latest");
            let lastimportheight = await verusBridge.methods.getLastimportHeight().call();

            let lastimport = {};

            lastimport.version = 1;
            lastimport.flags = 68;
            lastimport.sourcesystemid = ETHSystemID;
            lastimport.sourceheight = parseInt(lastimportheight);
            lastimport.importcurrencyid = ETHSystemID;
            lastimport.valuein = {};
            lastimport.tokensout = {};
            lastimport.numoutputs = {};
            lastimport.hashtransfers = {};
            lastimport.exporttxid = {};
            lastimport.exporttxout = {};


            let lastconfirmednotarization = {};

            lastconfirmednotarization.version = 1;

            //possibly check the contract exists?
            lastconfirmednotarization.launchconfirmed = true;
            lastconfirmednotarization.launchcomplete = true;
            lastconfirmednotarization.ismirror = true;

            //proposer should be set to something else this is just sample data
            lastconfirmednotarization.proposer = {
                "type": 4,
                "address": "iPveXFAHwModR7LrvgzxxHvdkKH84evYvT" //TODO: [EB-6] Confirm the proposer address
            };

            lastconfirmednotarization.currencyid = ETHSystemID;
            lastconfirmednotarization.notarizationheight = block.number;
            lastconfirmednotarization.currencystate = {
                "flags": 0,
                "version": 1,
                "currencyid": ETHSystemID,
                "launchcurrencies": [],
                "initialsupply": 0.00000000,
                "emitted": 0.00000000,
                "supply": 0.00000000,
                "currencies": {},
                "primarycurrencyfees": 0.00000000,
                "primarycurrencyconversionfees": 0.00000000,
                "primarycurrencyout": 0.00000000,
                "preconvertedout": 0.00000000
            };
            lastconfirmednotarization.currencystates = [];
            lastconfirmednotarization.prevnotarizationtxid = "0";
            lastconfirmednotarization.prevnotarizationout = 0;
            lastconfirmednotarization.prevheight = 0;
            let latestProofRoot = await getProofRoot();

            let lastProof = await getLastProofRoot();


            if (logging)
                console.log("latestProofRoot / lastProof:\n", latestProofRoot, lastProof);

            lastconfirmednotarization.proofroots = [];
            lastconfirmednotarization.proofroots.push(latestProofRoot);

            if (lastProof.version != 0)
                lastconfirmednotarization.proofroots.push(lastProof);

            lastconfirmednotarization.lastconfirmedheight = 0;
            lastconfirmednotarization.lastconfirmed = 0;

            let lastconfirmedutxo = {
                "txid": "16736c05a8a28201a3680a4cc0bb7f1d8ac2ca878c358bcde52501328722ebb1", // TODO: [EB-5] Confirm the UTXO to go here
                "voutnum": 0
            }

            globallastimport = { "result": { lastimport, lastconfirmednotarization, lastconfirmedutxo } }
        }

        return globallastimport;
    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "web3.eth.getBlock error:" + error);
        return { "result": { "error": true, "message": error } };
    }

}

exports.invalid = async() => {
    console.log("\x1b[41m%s\x1b[0m", "Invalid API call");
    return { "result": { "error": true, "message": "Unrecognized API call" } }

}