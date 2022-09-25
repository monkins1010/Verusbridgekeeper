const Web3 = require('web3');
const bitGoUTXO = require('bitgo-utxo-lib');
const confFile = require('./confFile.js')
var constants = require('./constants');
const ethersUtils = require('ethers').utils
const { addHexPrefix } = require('./utils');
const BigNumber = require('bignumber.js');

const util = require('./utils.js');
const notarizationFuncs = require('./notarization.js');
const abi = new Web3().eth.abi
const deserializer = require('./deserializer.js');

const { initApiCache, setCachedApi, getCachedApi, checkCachedApi, setCachedApiValue, clearCachedApis } = require('./cache/apicalls')

const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST";
const logging = (process.argv.indexOf('-log') > -1);
const debug = (process.argv.indexOf('-debug') > -1);
const debugsubmit = (process.argv.indexOf('-debugsubmit') > -1);
const noimports = (process.argv.indexOf('-noimports') > -1);
let settings = undefined;
let noaccount = false;
const verusBridgeStartBlock = 1;
let errorcounter = 0;

//Main coin ID's
const ETHSystemID = constants.VETHCURRENCYID;
const VerusSystemID = constants.VERUSSYSTEMID
const BridgeID = constants.BRIDGEID

var d = new Date();
let globalgetinfo = {};
let globalgetcurrency = {};
let globallastimport = {};
let globalsubmitimports = { "transactionHash": "" };

let globaltimedelta = 60000; //60s
let globallastinfo = d.valueOf() - globaltimedelta;
let globallastcurrency = d.valueOf() - globaltimedelta;
let globalgetlastimport = d.valueOf() - globaltimedelta;

const IAddress = 102;
const RAddressBaseConst = 60;

let maxGas = 6000000;

let web3 = undefined;

const verusBridgeMasterAbi = require('./abi/VerusBridgeMaster.json');
const verusNotarizerStorageAbi = require('./abi/VerusNotarizerStorage.json');
const verusUpgradeManagerAbi = require('./abi/VerusUpgradeManager.json');
const verusBridgeStorageAbi = require('./abi/VerusBridgeStorage.json');

var verusBridgeMaster = undefined;
var verusNotorizerStorage = undefined;
var verusBridgeStorage = undefined;
var storageAddress = undefined;
let GLOBAL_FIRST_BLOCK = undefined;

let transactioncount = 0;

let account = undefined;

let upgradeManager = undefined;
var contracts = [];

function setupConf() {
    settings = confFile.loadConfFile(ticker);
    web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode, {
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
    if (settings.privatekey.length == 64) {
        account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
        web3.eth.accounts.wallet.add(account);
    } else {
        noaccount = true;
    }
    web3.eth.handleRevert = true;
    upgradeManager = new web3.eth.Contract(verusUpgradeManagerAbi, settings.upgrademanageraddress);

}

exports.init = async() => {

    setupConf();
    for (let i = 0; i < 12; i++) {
        let tempContract = await upgradeManager.methods.contracts(i).call();
        contracts.push(tempContract);
    }
    verusBridgeMaster = new web3.eth.Contract(verusBridgeMasterAbi, contracts[constants.CONTRACT_TYPE.VerusBridgeMaster]);
    verusNotorizerStorage = new web3.eth.Contract(verusNotarizerStorageAbi, contracts[constants.CONTRACT_TYPE.VerusNotarizerStorage]);
    verusBridgeStorage = new web3.eth.Contract(verusBridgeStorageAbi, contracts[constants.CONTRACT_TYPE.VerusBridgeStorage]);
    storageAddress = contracts[constants.CONTRACT_TYPE.VerusBridgeStorage];

    //GLOBAL_FIRST_BLOCK = await verusNotorizerStorage.methods.firstBlock().call();

    initApiCache();
    eventListener(contracts[constants.CONTRACT_TYPE.VerusNotarizer]);

};

async function eventListener(notarizerAddress) {

    var options = {
        reconnect: {
            auto: true,
            delay: 5000, // ms
            maxAttempts: 5,
            onTimeout: false
        },
        address: notarizerAddress,
        topics: [
            '0x8d1d9676a2c636da682623d5ab7a7e6e9b5637dc940873176573d7fe68b96680'
        ]
    };

    var subscription = web3.eth.subscribe('logs', options, function(error, result) {
        if (!error) console.log('got result');
        else console.log(error);
    }).on("data", function(log) {
        console.log('***** EVENT: Got new Notarization, Clearing the cache*********');
        clearCachedApis();
        globallastimport = {};
        // await setCachedApi(log?.blockNumber, 'lastNotarizationHeight');
    }).on("changed", function(log) {
        console.log('***** EVENT: Got new Notarization, Clearing the cache**********');
        clearCachedApis();
        globallastimport = {};
    });
}

function amountFromValue(incoming) {
    if (incoming == 0) return 0;
    //use toFixed to stop floating point behaviour
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
    //TODO: remove 
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
    let exportKey = constants.VDXFDATAKEY[ticker];
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
    let hash = ethersUtils.keccak256(serializeCReserveTransfers(transfers));
    // console.log("hash of transfers: ",hash.toString('Hex'));
    // console.log("Serialize: ",serializeCReserveTransfers(transfers).slice(1).toString('Hex'));
    cce.version = 1;
    cce.flags = 2;
    cce.sourcesystemid = ETHSystemID;
    cce.hashtransfers = hash;
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
    cce.totalburned = [{ "currency": '0x0000000000000000000000000000000000000000', "amount": 0 }]; // serialiser doesnt like empty strings or non BIgints
    cce.rewardaddress = "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB"; //  TODO: what should this be?
    cce.firstinput = 1;
    //console.log("cce", JSON.stringify(cce));
    return cce;
}

function createCrossChainExportToETH(transfers, blockHeight, jsonready = false) {
    let cce = {};
    let hash = ethersUtils.keccak256(serializeCReserveTransfers(transfers));
    //console.log("hash of transfers: ",hash.toString('Hex'));

    //console.log("Serialize: ",serializeCReserveTransfers(transfers).slice(1).toString('Hex'));
    cce.version = 1;
    cce.flags = 2;
    cce.sourcesystemid = util.convertVerusAddressToEthAddress(ETHSystemID);
    cce.hashtransfers = addHexPrefix(hash);
    cce.destinationsystemid = util.convertVerusAddressToEthAddress(VerusSystemID);

    if (transfers[0].destcurrencyid.slice(0, 2) == "0x" && transfers[0].destcurrencyid.length == 42) {
        cce.destinationcurrencyid = transfers[0].destcurrencyid;
    } else {
        cce.destinationcurrencyid = util.convertVerusAddressToEthAddress(transfers[0].destcurrencyid);
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
    cce.totalburned = [{ "currency": '0x0000000000000000000000000000000000000000', "amount": 0 }];
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
        var timenow = d.valueOf();

        if (globaltimedelta + globallastinfo < timenow) {
            globallastinfo = timenow;
            let info = await verusBridgeMaster.methods.getinfo().call();

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
        var timenow = d.valueOf();

        if (globaltimedelta + globallastcurrency < timenow) {
            globallastcurrency = timenow;
            let info = await verusBridgeMaster.methods.getcurrency(util.convertVerusAddressToEthAddress(currency)).call();
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
    const lastCTransferArray = await getCachedApi('lastgetExports');
    let chainname = input[0];
    let heightstart = input[1];
    let heightend = input[2];

    let srtInput = JSON.stringify(input);
    if (lastCTransferArray == srtInput) {

        return { "result": null };
    }

    try {
        //input chainname should always be VETH
        let poolavailable = await verusBridgeMaster.methods.isPoolAvailable().call();

        if (chainname != VerusSystemID) throw "i-Address not VRSCTEST";
        if (heightstart > 0 && heightstart < verusBridgeStartBlock || heightstart == 1)
            heightstart = 0;

        //if undefined default to the last block available - 20 and last block available (this might break the node as too many queries)
        if (heightend == undefined) heightend = await web3.eth.getBlockNumber();
        if (heightstart == undefined) heightstart = heightend;

        //end block is after startblock
        if (heightstart > 0 && heightend > 0 && heightend < heightstart) throw { message: "Start/End Height out of range: " };
        //heightstart = heightend -200;

        let exportSets = [];
        let tempExportset = [];
        if (heightstart == 0 || heightstart == '0') {
            exportSets = await verusBridgeMaster.methods.getReadyExportsByRange(heightstart, heightend).call();
        } else {
            let range = parseInt(heightend) - parseInt(heightstart);
            const DELTA = 1000;
            if (range > DELTA) {
                let tempstartheight = undefined;
                let tempendheight = undefined;
                let tempfloor = Math.floor(range / DELTA);
                let tempremaind = range % DELTA;

                for (let i = 0; i < tempfloor; i++) {
                    tempstartheight = parseInt(heightstart) + (i * DELTA);
                    tempendheight = parseInt(heightstart) + ((i + 1) * DELTA);
                    tempExportset.push(await verusBridgeMaster.methods.getReadyExportsByRange(tempstartheight, tempendheight).call());
                }
                if (tempremaind > 0) {
                    tempExportset.push(await verusBridgeMaster.methods.getReadyExportsByRange(parseInt(heightend) - tempremaind, heightend).call());
                }

                for (let j = 0; j < tempExportset.length; j++) {
                    if (tempExportset[j].length > 0) {
                        for (const set of tempExportset[j])
                            exportSets.push(set);
                    }

                }

            } else {
                exportSets = await verusBridgeMaster.methods.getReadyExportsByRange(heightstart, heightend).call();
            }


        }
        //exportSets = parseContractExports(exportSets);
        console.log("Height end: ", heightend, "heightStart:", heightstart);

        for (let i = 0; i < exportSets.length; i++) {
            //loop through and add in the proofs for each export set and the additional fields
            let exportSet = exportSets[i];
            let outputSet = {};
            let poolLaunchedHeight = await verusNotorizerStorage.methods.poolAvailable(constants.BRIDGECURRENCYHEX).call();
            poolavailable = parseInt(poolLaunchedHeight) == 0 ? false : parseInt(poolLaunchedHeight) < parseInt(exportSet.blockHeight);
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

        // console.log(JSON.stringify(output, null, 2));
        await setCachedApi(input, 'lastgetExports');
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
    var d = new Date();
    var timenow = d.valueOf();
    const lastTime = await getCachedApi('lastBestProofinputtime');

    // new notarization scheme as of July 2022 adds lastconfirmed notarizations

    let cachedValue = await checkCachedApi('lastGetBestProofRoot', input);

    if (cachedValue) {

        if (lastTime && (JSON.parse(lastTime) + globaltimedelta) < timenow) {

            clearCachedApis();
            cachedValue = null;
        }

    }


    if (cachedValue) {
        return cachedValue;
    }

    await setCachedApi(timenow, 'lastBestProofinputtime');
    try {
        if (input.length && proofroots) {
            for (let i = 0; i < proofroots.length; i++) {
                // console.log(proofroots[i]);
                if (await checkProofRoot(proofroots[i].height, proofroots[i].stateroot, proofroots[i].blockhash, BigInt(util.addBytesIndicator(proofroots[i].power)))) {
                    validindexes.push(i);
                    if (proofroots[bestindex].height < proofroots[i].height) {
                        bestindex = i;
                    }
                }
            }
        }

        let latestProofHeight = proofroots[bestindex].height;
        let latestBlock = await web3.eth.getBlockNumber();

        if (parseInt(latestProofHeight) >= (parseInt(latestBlock) - 2)) {
            latestproofroot = proofroots[bestindex];
        } else {
            latestproofroot = await getProofRoot(latestBlock - 2);
        }

        let laststableproofroot = null;


        laststableproofroot = await getProofRoot(parseInt(latestBlock) - 30);


        if (logging) {
            console.log("getbestproofroot result:", { bestindex, validindexes, latestproofroot, laststableproofroot });
        }

        let gasPrice = await web3.eth.getGasPrice();
        // let currencies = [gasPrice, 0, 0]; // TODO: Enable gas price truncated to  8 decminal places
        if (logging)
            console.log("GAS PRICE:", util.uint64ToVerusFloat(gasPrice))

        let retval = { "result": { bestindex, validindexes, latestproofroot, laststableproofroot } };

        await setCachedApiValue(retval, input, 'lastGetBestProofRoot');

        return retval;

    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "getBestProofRoot error:" + error);
        return { "result": { "error": true, "message": error } };
    }
}

async function getProofRoot(height = "latest") {

    let block;
    try {
        block = await web3.eth.getBlock(height);
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
//TODO: REMOVE
async function getLastProofRoot() {
    let lastProof = {};
    try {
        lastProof = await verusBridgeMaster.methods.getLastProofRoot().call();
    } catch (error) {

        throw "web3.eth.getLastProofRoot error: \n" + error.message;
    }
    // the contract returns an abi.encoded bytes array for effiencey.
    let decodedParams = null;
    let lastproofroot = {};

    if (lastProof.length > 130) {
        let decodePattern = ['int16', 'int16', 'address', 'uint32', 'bytes32', 'bytes32', 'bytes32']

        decodedParams = abi.decodeParameters(decodePattern, "0x" + lastProof.slice(578));

        const ETHLastProofRoot = {
            "version": decodedParams[0],
            "cprtype": decodedParams[1],
            "systemid": decodedParams[2],
            "rootheight": decodedParams[3],
            "stateroot": decodedParams[4],
            "blockhash": decodedParams[5],
            "compactpower": decodedParams[6],
        }

        lastproofroot.version = parseInt(ETHLastProofRoot.version, 10);
        lastproofroot.type = parseInt(ETHLastProofRoot.cprtype, 10);
        lastproofroot.systemid = VerusSystemID;
        lastproofroot.height = parseInt(ETHLastProofRoot.rootheight, 10);
        lastproofroot.stateroot = util.removeHexLeader(ETHLastProofRoot.stateroot);
        lastproofroot.blockhash = util.removeHexLeader(ETHLastProofRoot.blockhash);
        lastproofroot.power = util.removeHexLeader(ETHLastProofRoot.compactpower);
    }

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

    let Notarization = {};

    var d = new Date();
    var timenow = d.valueOf();

    const lastTime = await getCachedApi('lastgetNotarizationDatatime');

    if (lastTime && (JSON.parse(lastTime) + globaltimedelta) > timenow) {
        let tempNotData = await getCachedApi('lastgetNotarizationData');
        if (tempNotData) {
            return JSON.parse(tempNotData);
        }
    }

    await setCachedApi(timenow, 'lastgetNotarizationDatatime');

    try {
        let forksLength = await verusNotorizerStorage.methods.bestForkLength().call();

        let forksData = [];
        let forks = [];

        for (let i = 0; i < parseInt(forksLength); i++) {
            forksData.push(await verusNotorizerStorage.methods.bestForks(i).call());
            forks.push(i);
        }

        if (forksLength == 0) {
            Notarization.forks = [];
            Notarization.lastconfirmed = -1;
            Notarization.bestchain = 0;
        } else {
            Notarization.forks = [forks];
            Notarization.bestchain = 0;
            Notarization.lastconfirmed = 0;
            Notarization.notarizations = [];

            for (let i = 0; i < forksData.length; i++) {
                let returnedNotarization = await verusNotorizerStorage.methods.getNotarization(forksData[i].txid.hash).call();
                let tempNotarization = notarizationFuncs.createNotarization(returnedNotarization);
                Notarization.notarizations.push({ index: i, txid: util.removeHexLeader(forksData[i].txid.hash), vout: forksData[i].txid.n, notarization: tempNotarization });
            }
        }

        Notarization.version = 1;

        if (debug) {
            console.log(JSON.stringify(Notarization.notarizations, null, 2))
            console.log(JSON.stringify(forksData, null, 2))
        }

        await setCachedApi({ "result": Notarization }, 'lastgetNotarizationData');

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

    if (noaccount || errorcounter > 10 || noimports) {
        console.log("************** Submitimports:" + errorcounter + " Errors counted , Wallet will not spend ********************");
        return { result: { error: true } };
    }

    const lastCTransferArray = await getCachedApi('lastsubmitImports');

    CTransferArray = conditionSubmitImports(CTransferArray);

    let CTempArray = reshapeTransfers(CTransferArray);

    if (lastCTransferArray === JSON.stringify(CTransferArray)) {

        return { result: globalsubmitimports.transactionHash };
    }

    CTempArray = deserializer.deSerializeMMR(CTempArray);

    CTempArray = deserializer.insertHeights(CTempArray);

    let submitArray = [];
    if (debugsubmit)
        console.log(JSON.stringify(CTempArray, null, 2))

    try {

        if (CTempArray.length > 0) {
            let processed = await verusBridgeMaster.methods.checkImport(CTempArray[0].txid).call();
            if (!processed) {
                submitArray.push(CTempArray[0])
            }
        }

        await setCachedApi(CTransferArray, 'lastsubmitImports');

        if (submitArray.length > 0) {
            globalsubmitimports = await verusBridgeMaster.methods.submitImports(submitArray).send({ from: account.address, gas: maxGas });
        } else {
            return { result: "false" };
        }
    } catch (error) {
        // console.log("Error in\n", JSON.stringify(CTempArray));
        console.log("Error Counter incremented in submitimports" + error);
        errorcounter++;
        if (error.reason)
            console.log("\x1b[41m%s\x1b[0m", "submitImports:" + error.reason);
        else {
            if (error.receipt)
                console.log("\x1b[41m%s\x1b[0m", "submitImports:" + error.receipt);

            console.log("\x1b[41m%s\x1b[0m", "submitImports:" + error);
        }
        return { result: { result: error.message } };
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

    if (noaccount || errorcounter > 10) {
        console.log("************** submitAcceptedNotarization" + errorcounter + " Errors counted , Wallet will not spend ********************");
        return { result: { error: true } };
    }
    if (debug) {
        console.log(params[0]);
        console.log(JSON.stringify(params[1], null, 2));
    }
    let pBaasNotarization = params[0];
    let signatures = {};

    let sigArray = {}

    for (const sigObj of params[1].evidence.chainobjects) {
        let sigKeys = Object.keys(sigObj.value.signatures);
        for (let i = 0; i < sigKeys.length; i++) {
            if (sigArray[sigObj.value.signatures[sigKeys[i]].blockheight] == undefined) {
                sigArray[sigObj.value.signatures[sigKeys[i]].blockheight] = [];
            }
            sigArray[sigObj.value.signatures[sigKeys[i]].blockheight].push({
                [sigKeys[i]]: sigObj.value.signatures[sigKeys[i]]
            });
        }
    }

    let sigArrayKeys = Object.keys(sigArray);
    let largestcount = 0;

    for (const heights of sigArrayKeys) {
        if (largestcount < parseInt(heights))
            largestcount = heights;
    }

    for (const items of sigArray[largestcount]) {
        let ID = Object.keys(items);
        signatures[ID[0]] = items[ID[0]];
    }


    let txidObj = params[1].output;

    //  console.log(JSON.stringify(params));
    const lastTxid = await getCachedApi('lastNotarizationTxid');
    try {

        if (lastTxid && lastTxid == JSON.stringify(txidObj.txid)) {
            return { "result": "0" };
        }


    } catch (error) {
        console.log("submitAcceptedNotarization Error:\n", error);
        return null;
    }

    pBaasNotarization.hashnotarization = "0x0000000000000000000000000000000000000000000000000000000000000000"; // set blank as contract will set
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
    pBaasNotarization.hashprevnotarization = addHexPrefix(pBaasNotarization.hashprevcrossnotarization);
    delete pBaasNotarization.hashprevcrossnotarization;

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
    let splitSigs = {}

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

    // Sort signatures in address accending order to assure uniqueness
    // TODO: BigNumber.from("0xCA6b8EaB76F76B458b1c43c0C5f500b33f63F475").toBigInt()

    //process nodes

    for (let i = 0; i < pBaasNotarization.nodes.length; i++) {
        pBaasNotarization.nodes[i].nodeidentity = util.convertVerusAddressToEthAddress(pBaasNotarization.nodes[i].nodeidentity);
    }

    pBaasNotarization.txid = { hash: addHexPrefix(txidObj.txid), n: txidObj.voutnum };

    try {
        let txhash = {}
            // let test4 = await verusSerializer.methods.serializeCPBaaSNotarization(pBaasNotarization).call();

        //  console.log("result from serializeCPBaaSNotarization:\n", (test4));
        var firstNonce = await web3.eth.getTransactionCount(account.address);

        let data = abi.encodeParameter({
            "data": {
                "_vs": 'uint8[]',
                "_rs": 'bytes32[]',
                "_ss": 'bytes32[]',
                "blockheights": "uint32[]",
                "notaryAddress": "address[]"
            }
        }, {
            "_vs": vsVals,
            "_rs": rsVals,
            "_ss": ssVals,
            "blockheights": blockheights,
            "notaryAddress": notaryAddresses
        });

        data = "0x" + data.slice(66); //remove first 32bytes from hex array.

        txhash = await verusBridgeMaster.methods.setLatestData(pBaasNotarization, data).call();
        // console.log(JSON.stringify(txhash));
        if (transactioncount != firstNonce) {
            txhash = await verusBridgeMaster.methods.setLatestData(pBaasNotarization, data).send({ from: account.address, gas: maxGas });
            transactioncount = firstNonce;
        }
        let test = await web3.eth.getTransaction(txhash.transactionHash);

        await setCachedApi(txidObj.txid, 'lastNotarizationTxid');
        return { "result": txhash };

    } catch (error) {
        if (error.message && error.message == "already known") {
            console.log("Notarization already Submitted");
        } else {
            console.log("Error Counter incremented in submitacceptednotarization" + error);
            errorcounter++;
        }
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
            let lastimportheight = await verusBridgeStorage.methods.lastTxImportHeight().call();

            let lastImportInfo = await verusBridgeStorage.methods.lastImportInfo(lastimportheight).call();

            let lastimport = {};

            lastimport.version = 1;
            lastimport.flags = 68;
            lastimport.sourcesystemid = ETHSystemID;
            lastimport.sourceheight = parseInt(lastimportheight);
            lastimport.importcurrencyid = ETHSystemID;
            lastimport.valuein = {};
            lastimport.tokensout = {};
            lastimport.numoutputs = {};
            lastimport.hashtransfers = util.removeHexLeader(lastImportInfo.hashOfTransfers).match(/[a-fA-F0-9]{2}/g).reverse().join('');
            lastimport.exporttxid = util.removeHexLeader(lastImportInfo.exporttxid).match(/[a-fA-F0-9]{2}/g).reverse().join('');
            lastimport.exporttxout = lastImportInfo.exporttxoutnum;

            let forksData = {};
            let lastconfirmednotarization = {};
            let lastconfirmedutxo = {};
            try {
                forksData = await verusNotorizerStorage.methods.bestForks(0).call();
                let returnedNotarization = await verusNotorizerStorage.methods.getNotarization(forksData.txid.hash).call();

                lastconfirmednotarization = notarizationFuncs.createNotarization(returnedNotarization);

                lastconfirmedutxo = { txid: util.removeHexLeader(forksData.txid.hash), voutnum: forksData.txid.n }

            } catch (e) {
                console.log("\x1b[41m%s\x1b[0m", "No Notarizations recieved yet");
            }
            globallastimport = { "result": { lastimport, lastconfirmednotarization, lastconfirmedutxo } }
        }

        return globallastimport;
    } catch (error) {
        console.log("\x1b[41m%s\x1b[0m", "getLastImportFrom:" + error);
        return { "result": { "error": true, "message": error } };
    }

}

exports.invalid = async() => {
    console.log("\x1b[41m%s\x1b[0m", "Invalid API call");
    return { "result": { "error": true, "message": "Unrecognized API call" } }

}