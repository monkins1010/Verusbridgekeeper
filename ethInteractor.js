const Web3 = require('web3');
const bitGoUTXO = require('bitgo-utxo-lib');
const confFile = require('./confFile.js')
var constants = require('./constants');
const { keccak256, addHexPrefix } = require('ethereumjs-util');

require('./utils.js')();
require('./deserializer.js')();

const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST" ;
const logging = (process.argv.indexOf('-log') > -1);
const settings = confFile.loadConfFile(ticker);
const verusBridgeStartBlock = 	9303300;

//Main coin ID's
const ETHSystemID = constants.VETHCURRENCYID;
const VerusSystemID = constants.VERUSSYSTEMID
const BridgeID = constants.BRIDGEID
const BridgeIDHex = constants.BRIDGEIDHEX

const bridgeAddress = settings.verusbridgeaddress;
const notarizerAddress = settings.verusnotarizeraddress;
const proofAddress = settings.verusproofaddress;
const infoAddress = settings.verusinfoaddress;
const serializeraddressAddress = settings.verusserializeraddress;

var d = new Date();
let globalgetinfo = {};
let globalgetcurrency = {};
let globaltimedelta = 10000; //10s
let globallastinfo = d.getTime();
let globallastcurrency = d.getTime();


const IAddress = 102;
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


const verusNotarizerAbi = require('./abi/VerusNotarizer.json');
const verusBridgeAbi = require('./abi/VerusBridge.json');
const verusProofAbi = require('./abi/VerusProof.json');
const verusInfoAbi = require('./abi/VerusInfo.json');
const verusSerializerAbi = require('./abi/VerusSerializer.json');

const verusProof = new web3.eth.Contract(verusProofAbi.abi, proofAddress);
const verusInfo = new web3.eth.Contract(verusInfoAbi.abi, infoAddress);
const verusBridge = new web3.eth.Contract(verusBridgeAbi.abi, bridgeAddress);
const verusNotarizer = new web3.eth.Contract(verusNotarizerAbi.abi, notarizerAddress);
const verusSerializer= new web3.eth.Contract(verusSerializerAbi.abi, serializeraddressAddress);

let transactioncount = 0;
//setup account and put it in the wallet
let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true

async function getRevertReason(txHash){

    const tx = await web3.eth.getTransaction(txHash)
  
    var result = await web3.eth.call(tx, tx.blockNumber)
  
    result = result.startsWith('0x') ? result : `0x${result}`
  
    if (result && result.substr(138)) {
  
      const reason = web3.utils.toAscii(result.substr(138))
      console.log('Revert reason:', reason)
      return reason
  
    } else {
  
      console.log('Cannot get reason - No return value')
  
    }
  
  }

//processing functions



processPartialTransactionProof = (PTProof) => {
    //first 10 bytes is the number in the array afterwards each 32 bytes is a proof
    let returnArray = [];
    if(typeof PTProof == 'string'){
        if(PTProof.length <= 10) return returnArray;
        //breakdown the 
        while(PTProof.length > 0){
            let proofElement = '0x' + PTProof.substr(0,63);
            returnArray.push(proofElement);
            PTProof = PTProof.substr(64);
        }
        return returnArray;
    } else return false;
}

processImports = (imports) => {
    imports.forEach((reserveTransferImport) => {
        if(reserveTransferImport.txid != 'undefined') reserveTransferImport.txid = addBytesIndicator(reserveTransferImport.txid);
        if(reserveTransferImport.exportinfo.sourcesystemid != 'undefined') reserveTransferImport.exportinfo.sourcesystemid = processRAddress(reserveTransferImport.exportinfo.sourcesystemid);
        if(reserveTransferImport.exportinfo.destinationsystemid != 'undefined') reserveTransferImport.exportinfo.destinationsystemid = processRAddress(reserveTransferImport.exportinfo.destinationsystemid);
        if(reserveTransferImport.exportinfo.destinationcurrencyid != 'undefined') reserveTransferImport.exportinfo.destinationcurrencyid = processRAddress(reserveTransferImport.exportinfo.destinationcurrencyid);
        //convert totalamounts
        if(reserveTransferImport.exportinfo.totalamounts !='undefined') {
            //convert this to an array so we can process it 
            reserveTransferImport.exportinfo.totalamounts = convertToCurrencyValues(reserveTransferImport.exportinfo.totalamounts);
        }
        //convert totalFees
        if(reserveTransferImport.exportinfo.totalfees !='undefined') {
            //convert this to an array so we can process it 
            reserveTransferImport.exportinfo.totalfees = convertToCurrencyValues(reserveTransferImport.exportinfo.totalfees);
        }
        
        //do we need to process each of the totalamounts and total fees
        //for the transactions to then do the 
        //loop through the transfers and convert the address
        //deserialize the partial transaction proof into an array to make it happy
        if(reserveTransferImport.partialtransactionproof != 'undefined') reserveTransferImport.partialtransactionproof = processPartialTransactionProof(reserveTransferImport.partialtransactionproof);

        reserveTransferImport.transfers.forEach(element => {
            if(element.destination.address != 'undefined') element.destination.address = processRAddress(element.destination.address);
        });
    })
 //   console.log(imports);
    return imports;
    
}

amountFromValue = (incoming) => {
    if(incoming == 0) return 0;
    //use rtoFixed to stop floating point behaviour
    return (incoming * 100000000).toFixed(0);
}

serializeCCurrencyValueMap = (ccvm) => {
    
    let encodedOutput = Buffer.from(removeHexLeader(ccvm.currency),'hex');
    encodedOutput = Buffer.concat([encodedOutput,writeUInt(amountFromValue(ccvm.amount),64)]);


    return encodedOutput
}

serializeCCurrencyValueMapVarInt = (ccvm) => {
    
    let encodedOutput = Buffer.from(removeHexLeader(ccvm.currency),'hex'); 
    encodedOutput = Buffer.concat([encodedOutput,writeVarInt(parseInt(ccvm.amount,10))]);

    return encodedOutput
}

serializeCCurrencyValueMapArray = (ccvm) => {
    let encodedOutput = writeCompactSize(ccvm.length);
    //loop through the array
    for(let i = 0; i < ccvm.length; i++){
      //  console.log("ccvm:",ccvm[i]);  [encodedOutput,bitGoUTXO.address.fromBase58Check(ccvm[i].currency,160).hash]
        encodedOutput = Buffer.concat([encodedOutput,bitGoUTXO.address.fromBase58Check(ccvm[i].currency,160).hash]);
        encodedOutput = Buffer.concat([encodedOutput,writeUInt((ccvm[i].amount),64)]);
       // encodedOutput = Buffer.concat([encodedOutput,writeUInt(amountFromValue(ccvm[i].amount),64)]); OLD ABOVE
    
    }
    return encodedOutput
}

serializeCTransferDestination = (ctd) => {
    // Buffer.concat([encodedOutput,writeUInt(ctd.destinationaddress,160)]);
    let encodedOutput = Buffer.alloc(1);
    encodedOutput.writeUInt8(ctd.destinationtype);

    let destination = Buffer.from(removeHexLeader(ctd.destinationaddress),'hex');

    encodedOutput = Buffer.concat([encodedOutput,writeCompactSize(20),destination]);  //TODO:hardcoded for address only for now
    return encodedOutput;
}



serializeCrossChainExport = (cce) => {

    let encodedOutput = writeUInt(cce.version,16);
    encodedOutput = Buffer.concat([encodedOutput,writeUInt(cce.flags,16)]);
    encodedOutput = Buffer.concat([encodedOutput,bitGoUTXO.address.fromBase58Check(cce.sourcesystemid,160).hash]);
    encodedOutput = Buffer.concat([encodedOutput,writeVarInt(cce.sourceheightstart)]);
    encodedOutput = Buffer.concat([encodedOutput,writeVarInt(cce.sourceheightend)]);
    encodedOutput = Buffer.concat([encodedOutput,bitGoUTXO.address.fromBase58Check(cce.destinationsystemid,160).hash]);
    encodedOutput = Buffer.concat([encodedOutput,bitGoUTXO.address.fromBase58Check(cce.destinationcurrencyid,160).hash]);
    encodedOutput = Buffer.concat([encodedOutput,writeUInt(cce.numinputs,32)]);
    //totalamounts CCurrencyValueMap
    encodedOutput = Buffer.concat([encodedOutput,serializeCCurrencyValueMapArray(cce.totalamounts)]);
    //totalfees CCurrencyValueMap
    encodedOutput = Buffer.concat([encodedOutput,serializeCCurrencyValueMapArray(cce.totalfees)]);
    //hashtransfers uint256
    encodedOutput = Buffer.concat([encodedOutput,Buffer.from( removeHexLeader(cce.hashtransfers),'hex')]);
    //totalburned CCurrencyValueMap
    encodedOutput = Buffer.concat([encodedOutput,writeCompactSize(1),serializeCCurrencyValueMap(cce.totalburned[0])]);  //fees always blank value map 0
    //CTransfer DEstionation for Reward Address
    let typeETH = Buffer.alloc(1);
    typeETH.writeUInt8(4); //eth type

    encodedOutput = Buffer.concat([encodedOutput,typeETH]);
    let destination = Buffer.from(bitGoUTXO.address.fromBase58Check(cce.rewardaddress,160).hash);   // TODO: [EB-3] Daemon expects vector not uint160

    encodedOutput = Buffer.concat([encodedOutput,writeVarInt(destination.length),destination]);

    encodedOutput = Buffer.concat([encodedOutput,writeUInt(cce.firstinput,32)]);

    let reserveTransfers = Buffer.alloc(1);
    reserveTransfers.writeUInt8(0);   //empty reserve transfers

    encodedOutput = Buffer.concat([encodedOutput,reserveTransfers]);

    return encodedOutput;
}

serializeCReserveTransfers = (crts) => {

    let encodedOutput = writeCompactSize(crts.length);
    for(let i = 0;i < crts.length; i++){
        encodedOutput = Buffer.concat([encodedOutput,writeVarInt(crts[i].version)]); // should be 1 for single transfer
        if(crts[i].currencyvalue)
            encodedOutput = Buffer.concat([encodedOutput,serializeCCurrencyValueMapVarInt(crts[i].currencyvalue)]);  // TODO: [EB-2] Varint instead of uint64
        else
            encodedOutput = Buffer.concat([encodedOutput,serializeCCurrencyValueMapVarInt(crts[i].currencyvalues)]); 

        encodedOutput = Buffer.concat([encodedOutput,writeVarInt(crts[i].flags)]);
        encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(crts[i].feecurrencyid),'hex')]);
        encodedOutput = Buffer.concat([encodedOutput,writeVarInt(crts[i].fees)]);
        encodedOutput = Buffer.concat([encodedOutput,serializeCTransferDestination(crts[i].destination)]);
        if(crts[i].destcurrencyid)
            encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(crts[i].destcurrencyid),'hex')]);
        else
            encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(crts[i].destinationcurrencyid),'hex')]);
        if((crts[i].flags & 0x400) == 0x400 )
            encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(crts[i].secondreserveid),'hex')]);
        
        if((crts[i].flags & 0x40) == 0x40 && crts[i].destsystemid )
            encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(crts[i].destsystemid),'hex')]);
        else if((crts[i].flags & 0x40) == 0x40 && crts[i].exportto)
            encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(crts[i].exportto),'hex')]);
       // if(logging)
          //  console.log("log of CReserve: ",JSON.stringify(crts[i]));
    }
   
    return encodedOutput;  //Buffer.from(removeHexLeader(
}

//takes in an array of proof strings and serializes
serializeEthProof = (proofArray) => {
    if(proofArray === undefined) return null;
    let encodedOutput = writeVarInt(proofArray.length);
    //loop through the array and add each string length and the sstring
    //serialize account proof
    for(let i = 0;i < proofArray.length; i++){
        //remove the 0x at the start of the string
        let proofElement = removeHexLeader(proofArray[i]);
        encodedOutput = Buffer.concat([encodedOutput,writeCompactSize(proofElement.length/2)]);
        encodedOutput = Buffer.concat([encodedOutput,Buffer.from(proofElement,'hex')]);
    }
    return encodedOutput;
}

serializeEthStorageProof = (storageProof) => {
  // encodedOutput = Buffer.concat([encodedOutput,writeVarInt(length)]);
    let length = removeHexLeader(storageProof).length / 2;
    let encodedOutput = Buffer.from(removeHexLeader(storageProof),'hex');
    encodedOutput = Buffer.concat([writeCompactSize(length),encodedOutput]);
    return encodedOutput;
}

serializeEthFullProof = (ethProof) => {
    let encodedOutput = Buffer.alloc(1);
    let version = 1;
    encodedOutput.writeUInt8(version);


    let type = 3; //type eth
    let typeBuffer = Buffer.alloc(1);
    typeBuffer.writeUInt8(type);
    encodedOutput = Buffer.concat([encodedOutput,typeBuffer]);
    //write accountProof length
    //proof size as an int 32
    let sizeBuffer = Buffer.alloc(4);
    sizeBuffer.writeUInt32LE(1);
    encodedOutput = Buffer.concat([encodedOutput,sizeBuffer]);

    let branchTypeBuffer = Buffer.alloc(1);
    branchTypeBuffer.writeUInt8(4); //eth branch type
    encodedOutput = Buffer.concat([encodedOutput,branchTypeBuffer]);
    //merkle branch base
    encodedOutput = Buffer.concat([encodedOutput,branchTypeBuffer]);

    //serialize account proof
    encodedOutput = Buffer.concat([encodedOutput,serializeEthProof(ethProof.accountProof)]);
    //serialize address bytes 20
    encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(ethProof.address),'hex')]);
    let balanceBuffer = Buffer.alloc(8);
    let balancehex = removeHexLeader(web3.utils.numberToHex(ethProof.balance));
    let isBigBalance = balancehex.length > 16 || balancehex === "ffffffffffffffff";
   
    if(isBigBalance)
    {
        balanceBuffer = Buffer.from("ffffffffffffffff",'hex')
    }
    else
    {
        balanceBuffer.writeBigUInt64LE(BigInt(ethProof.balance));
    }
    encodedOutput = Buffer.concat([encodedOutput,balanceBuffer]);
    //serialize codehash bytes 32
    encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(ethProof.codeHash),'hex')]);
    //serialize nonce as uint32
    
    encodedOutput = Buffer.concat([encodedOutput,writeVarInt(ethProof.nonce)]);
    //serialize storageHash bytes 32
    encodedOutput = Buffer.concat([encodedOutput,Buffer.from(removeHexLeader(ethProof.storageHash),'hex')]);
    
    //loop through storage proofs
    let key = removeHexLeader(ethProof.storageProof[0].key);
    key =  web3.utils.padLeft(key, 64);
   // if(key.length % 2 != 0) key = '0'.concat(key);
    encodedOutput = Buffer.concat([encodedOutput,Buffer.from(key,'hex')]);
    encodedOutput = Buffer.concat([encodedOutput,serializeEthProof(ethProof.storageProof[0].proof)]);

    let proof = removeHexLeader(ethProof.storageProof[0].value);

    //if(proof.length % 2 != 0) proof = '0'.concat(proof);
    proof =  web3.utils.padLeft(proof, 64);
    let proofval = Buffer.alloc(32);
    Buffer.from(proof,'hex').copy(proofval);
    encodedOutput = Buffer.concat([encodedOutput,proofval]);
    if(isBigBalance){
       let temphexreversed = web3.utils.padLeft(balancehex,64).match(/[a-fA-F0-9]{2}/g).reverse().join('');
       let tempbuf = Buffer.from(temphexreversed,'hex');
       encodedOutput = Buffer.concat([encodedOutput,tempbuf]);
    }
    //append 12 0s to the end of the buffer to override the component part of the Proof
    return encodedOutput;
}


getBlock = async (input) => {
    try{
        let block = await web3.eth.getBlock(input.blockHeight);
        return block;
    } catch(error){
        return {status:false,error:error};
    }
    
}

/** get Proof for **/
getProof = async (eIndex,blockHeight) => {
    let index = "0x000000000000000000000000000000000000000000000000000000000000000b"; 
    let key = web3.utils.sha3(index,{"encoding":"hex"});
    if(eIndex > 0){
        key = increaseHexByAmount(key,eIndex);
    }
    try{
         
        let proof = await web3.eth.getProof(bridgeAddress,[key],blockHeight);
        return proof;
    } catch(error){
        console.log("error:",error);
        return {status:false,error:error};
    }
}

// create the component parts for the proof

createComponents = (transfers,blockHeight,previousExportHash, poolavailable) => {

    let cce = createCrossChainExport(transfers,blockHeight,false, poolavailable);
    //Var Int Components size as this can only 
    let encodedOutput = writeCompactSize(1);
    //eltype
    encodedOutput = Buffer.concat([encodedOutput,writeUInt(7,16)]);
    //elIdx
    encodedOutput = Buffer.concat([encodedOutput,writeUInt(0,16)]);
    //elVchObj
    let exportKey = constants.VDXFDATAKEY[ticker];  // TODO: [EB-1] Hardcoded
    let serializedVDXF = Buffer.from(exportKey,'hex');
    let version = 1;
    serializedVDXF = Buffer.concat([serializedVDXF,writeUInt(version,1)]);

    let serialized = Buffer.from(serializeCrossChainExport(cce));

    let prevhash = Buffer.from(removeHexLeader(previousExportHash),'hex');

    serialized = Buffer.concat([serialized,prevhash]);

    let hashofcce_reserves = keccak256(serialized);
   /* let serialization = Buffer.concat([serializeCrossChainExport(cce),serializeCReserveTransfers(transfers).slice(1)]);
    console.log("Hash of cce+reservet: \n",hashofcce_reserves.toString('hex'));
    console.log("serialization of ccx + prevhash: \n",serialized.toString('hex'));*/
    serialized = Buffer.concat([writeCompactSize(serialized.length),serialized]);

    serialized = Buffer.concat([serializedVDXF,serialized]);

    serialized = Buffer.concat([writeCompactSize(serialized.length),serialized]);

    encodedOutput = Buffer.concat([encodedOutput,serialized]);
    encodedOutput = Buffer.concat([encodedOutput,Buffer.from('00000000','hex')]); //no elproof
    return {output: encodedOutput.toString('Hex'), txid: "0x" + hashofcce_reserves.toString('Hex').match(/[a-fA-F0-9]{2}/g).reverse().join('')};

}
//create an outbound trans
createOutboundTransfers = (transfers) => {
    let outTransfers = [];
    for(let i = 0; i< transfers.length; i++){
        let transfer = transfers[i];
        let outTransfer = {};
        outTransfer.version = 1;
        outTransfer.currencyvalues = {[ethAddressToVAddress(transfer.currencyvalue.currency,IAddress)] : uint64ToVerusFloat(transfer.currencyvalue.amount)};
        outTransfer.flags = transfer.flags;
        //outTransfer.crosssystem = true;
        outTransfer.exportto = ethAddressToVAddress(transfer.destsystemid,IAddress);
        //outTransfer.convert = true;
        outTransfer.feecurrencyid = ethAddressToVAddress(transfer.feecurrencyid,IAddress);
        outTransfer.fees = uint64ToVerusFloat(transfer.fees);
        
        if((parseInt(transfer.flags) & 1024) == 1024){ // RESERVETORESERVE FLAG
            outTransfer.destinationcurrencyid = ethAddressToVAddress(transfer.secondreserveid,IAddress);
            outTransfer.via = ethAddressToVAddress(transfer.destcurrencyid,IAddress);
        }else{
            outTransfer.destinationcurrencyid = ethAddressToVAddress(transfer.destcurrencyid,IAddress);
        }

        let address = {};

        if((parseInt(transfer.destination.destinationtype) & 127) == 2){

            address = ethAddressToVAddress(transfer.destination.destinationaddress.slice(0,42),60);
        }else if((parseInt(transfer.destination.destinationtype) & 127) == 4){

            address = ethAddressToVAddress(transfer.destination.destinationaddress.slice(0,42),IAddress);
        }else{
            address = transfer.destination.destinationaddress.slice(0,42);

        }

        outTransfer.destination = {
            "type" : transfer.destination.destinationtype,
            "address" : address,
            "gateway" : transfer.destination.destinationaddress.length > 42 ? ethAddressToVAddress(transfer.destination.destinationaddress.slice(42,82),IAddress) : "",
            "fees"    : transfer.destination.destinationaddress.length > 42 ? parseInt(transfer.destination.destinationaddress.slice(transfer.destination.destinationaddress.length - 16,transfer.destination.destinationaddress.length - 1).match(/[a-fA-F0-9]{2}/g).reverse().join(''),16)/100000000 : ""
        }
      outTransfers.push(outTransfer);
    }
    return outTransfers;
}

createCrossChainExport =  (transfers,blockHeight,jsonready = false, poolavailable) => {
    let cce = {};
    let hash = keccak256(serializeCReserveTransfers(transfers).slice(1));
   // console.log("hash of transfers: ",hash.toString('Hex'));
   // console.log("Serialize: ",serializeCReserveTransfers(transfers).slice(1).toString('Hex'));
    cce.version = 1;
    cce.flags = 2;
    cce.sourceheightstart = blockHeight;
    cce.sourceheightend = blockHeight;
    cce.sourcesystemid = ETHSystemID;
    cce.destinationsystemid = VerusSystemID;

    if(poolavailable != 0 && poolavailable < parseInt(blockHeight)){ // RESERVETORESERVE FLAG
        cce.destinationcurrencyid = BridgeID;
    }else{
        cce.destinationcurrencyid = ETHSystemID;
    }
    cce.numinputs = transfers.length;    
    cce.totalamounts = [];
    let totalamounts = [];
    cce.totalfees = [];
    let totalfees = [];
    for(let i = 0; i < transfers.length; i++){
        //sum up all the currencies 
        if(uint160ToVAddress(transfers[i].currencyvalue.currency,IAddress) in totalamounts) 
            totalamounts[uint160ToVAddress(transfers[i].currencyvalue.currency,IAddress)] += parseInt(transfers[i].currencyvalue.amount);
        else
            totalamounts[uint160ToVAddress(transfers[i].currencyvalue.currency,IAddress)] = parseInt(transfers[i].currencyvalue.amount);
        //add fees to the total amounts
        if(uint160ToVAddress(transfers[i].feecurrencyid,IAddress) in totalamounts) 
            totalamounts[uint160ToVAddress(transfers[i].feecurrencyid,IAddress)] += parseInt(transfers[i].fees);
        else 
            totalamounts[uint160ToVAddress(transfers[i].feecurrencyid,IAddress)] = parseInt(transfers[i].fees);


        if(uint160ToVAddress(transfers[i].feecurrencyid,IAddress) in totalfees) 
            totalfees[uint160ToVAddress(transfers[i].feecurrencyid,IAddress)] += parseInt(transfers[i].fees);
        else 
            totalfees[uint160ToVAddress(transfers[i].feecurrencyid,IAddress)] = parseInt(transfers[i].fees);
    }
    for (var key in totalamounts) {
        cce.totalamounts.push({"currency":key,"amount": (jsonready? uint64ToVerusFloat(totalamounts[key]) : totalamounts[key])});
    }
    for (var key in totalfees) {
        cce.totalfees.push({"currency":key,"amount":(jsonready? uint64ToVerusFloat(totalfees[key]):totalfees[key])});
    }
    cce.hashtransfers = hash.toString('hex'); //hash the transfers
  //  console.log(JSON.stringify(cce.totalamounts));
    cce.totalburned = [{"currency":'0x0000000000000000000000000000000000000000',"amount":0}]; // TODO: serialiser doesnt like empty strings or non BIgints
    cce.rewardaddress = "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB"; //  TODO: what should this be?
    cce.firstinput = 1;
  //  console.log("cce",JSON.stringify(cce));
    return cce;
}

createCrossChainExportToETH = (transfers,blockHeight,jsonready = false) => {  //TODO: This may not be nessassary for the import into vETH
    let cce = {};
    let hash = keccak256(serializeCReserveTransfers(transfers).slice(1));
    //console.log("hash of transfers: ",hash.toString('Hex'));

    //console.log("Serialize: ",serializeCReserveTransfers(transfers).slice(1).toString('Hex'));
    cce.version = 1;
    cce.flags = 2;
    cce.sourceheightstart = 1; 
    cce.sourceheightend = 2;
    cce.sourcesystemid = convertVerusAddressToEthAddress(ETHSystemID);
    cce.destinationsystemid = convertVerusAddressToEthAddress(VerusSystemID);
    if(transfers[0].destcurrencyid.slice(0,2) == "0x" && transfers[0].destcurrencyid.length == 42)
    {
        cce.destinationcurrencyid = transfers[0].destcurrencyid;  //TODO:VERIFY
    }
    else
    {
        cce.destinationcurrencyid = convertVerusAddressToEthAddress(transfers[0].destcurrencyid);  //TODO:VERIFY
    }
    cce.numinputs = transfers.length;    
    cce.totalamounts = [];
    let totalamounts = [];
    cce.totalfees = [];
    let totalfees = [];

    for(let i = 0; i < transfers.length; i++){
        //sum up all the currencies
        
          
        if(transfers[i].currencyvalue.currency in totalamounts) 
            totalamounts[transfers[i].currencyvalue.currency] += transfers[i].currencyvalue.amount;
        else
            totalamounts[transfers[i].currencyvalue.currency] = transfers[i].currencyvalue.amount;
        //add fees to the total amounts
        if(transfers[i].feecurrencyid in totalamounts) 
            totalamounts[transfers[i].feecurrencyid] += transfers[i].fees;
        else 
            totalamounts[transfers[i].feecurrencyid] = transfers[i].fees;

        if(transfers[i].feecurrencyid in totalfees) 
            totalfees[transfers[i].feecurrencyid] += transfers[i].fees;
        else 
            totalfees[transfers[i].feecurrencyid] = transfers[i].fees;
    }
    for (var key in totalamounts) {
        cce.totalamounts.push({"currency":key,"amount": (jsonready? uint64ToVerusFloat(totalamounts[key]) : totalamounts[key])});
    }
    for (var key in totalfees) {
        cce.totalfees.push({"currency":key,"amount":(jsonready? uint64ToVerusFloat(totalfees[key]):totalfees[key])});
    }
  //  console.log(JSON.stringify(cce.totalamounts));
    cce.hashtransfers = "0x" +  hash.toString('hex'); //hash the transfers
    cce.totalburned = [{"currency":'0x0000000000000000000000000000000000000000',"amount":0}]; // TODO: serialiser doesnt like empty strings or non BIgints
    cce.rewardaddress = {destinationtype: 09,destinationaddress: convertVerusAddressToEthAddress("iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB")}; //  TODO: what should this be
    cce.firstinput = 1;
    return cce;
}

/** core functions */

exports.getInfo = async (input) => {
    //getinfo is just tested to see that its not null therefore we can just return the version
    //check that we can connect to Ethereum if not return null to kill the connection
    try{

        var d = new Date();
        var timenow = d.getTime();
        if (globaltimedelta + globallastinfo < timenow){
            globallastinfo = timenow;
            let info = await verusInfo.methods.getinfo().call();
            // TODO:clear out the unnecessary array elements
            //info = Object.fromEntries(info);
            //complete tiptime with the time of a block
            //let test = convertWeb3Response(info);
            globalgetinfo = {
                "version" : info.version,
                "name" : info.name,
                "VRSCversion" : info.VRSCversion,
                "blocks" : info.blocks,
                "tiptime" : info.tiptime,
                "testnet" : info.testnet
            }
           console.log("Command: getinfo");
        }
        return {"result":globalgetinfo};
    } catch(error){
        console.log("\x1b[41m%s\x1b[0m","Error getInfo:" + error);
        return {"result": {"error": true, "message" : error}};
    }


}

exports.getCurrency = async (input) => {

    try{
        let currency = input[0];
        //convert i address to an eth address
        var d = new Date();
        var timenow = d.getTime();

        if (globaltimedelta + globallastcurrency < timenow){
            globallastcurrency = timenow;
            let info = await verusInfo.methods.getcurrency(convertVerusAddressToEthAddress(currency)).call();
            //complete tiptime with the time of a block
            //convert the CTransferDestination
            //convert notary adddresses
            let notaries = [];
            for(let i = 0; i < info.notaries.length; i++){
                notaries[i] = ethAddressToVAddress(info.notaries[i],IAddress);
            }

            globalgetcurrency = {
                "version" : info.version,
                "name": info.name,
                "options": (info.name === "VETH") ? 172 : 96,
                //"name": "vETH",
                "currencyid": uint160ToVAddress(info.currencyid,IAddress),
                "parent": uint160ToVAddress(info.parent,IAddress),
                "systemid": uint160ToVAddress(info.systemid,IAddress),
                "notarizationprotocol": info.notarizationprotocol,
                "proofprotocol": info.proofprotocol,
                "nativecurrencyid" : {"address": '0x' + BigInt(info.nativecurrencyid.destinationaddress,IAddress).toString(16),"type": info.nativecurrencyid.destinationtype},
                "launchsystemid": uint160ToVAddress(info.launchsystemid,IAddress),
                "startblock": info.startblock,
                "endblock": info.endblock,
                "initialsupply": info.initialsupply,
                "prelaunchcarveout": info.prelaunchcarveout,
                "gatewayid": uint160ToVAddress(info.gatewayid,IAddress),
                "notaries": notaries,
                "minnotariesconfirm" : info.minnotariesconfirm,
                "gatewayid": ETHSystemID,
                "gatewayconvertername": (info.name === "VETH") ? "Bridge" : ""
            };
            console.log("Command: getcurrency");
        }
        
        return {"result": globalgetcurrency};
    }
    catch(error){
        console.log("\x1b[41m%s\x1b[0m","getCurrency:" + error);
        return {"result": {"error": true, "message" : error}};
    }
}

exports.getExports = async (input) => {
    
    let output = [];

    let chainname = input[0];
    let heightstart = input[1];
    let heightend = input[2];

    try{
        //input chainname should always be VETH
        let poolavailable = await verusNotarizer.methods.poolAvailable(BridgeIDHex).call();
        poolavailable = parseInt(poolavailable);
        if(chainname != VerusSystemID) throw "i-Address not VRSCTEST";
        if(heightstart > 0 && heightstart < verusBridgeStartBlock ||heightstart == 1 ) 
            heightstart = 0;

        //if undefined default to the last block available - 20 and last block available (this might break the node as too many queries)
        if(heightend == undefined) heightend = await web3.eth.getBlockNumber();
        if(heightstart == undefined) heightstart = heightend;

        //end block is after startblock
        if(heightstart > 0 && heightend > 0 && heightend < heightstart) throw {message:"Start/End Height out of range: "};
        //heightstart = heightend -200;
        let exportSets = await verusBridge.methods.getReadyExportsByRange(heightstart,heightend).call();
        //exportSets = parseContractExports(exportSets);
        console.log("Height end: ",heightend, "heightStart:", heightstart );

        for(let i = 0;i < exportSets.length; i++){
            //loop through and add in the proofs for each export set and the additional fields
            let exportSet = exportSets[i];
            let outputSet = {};
            outputSet.height = exportSet.blockHeight;
            outputSet.txid = removeHexLeader(exportSet.exportHash).match(/[a-fA-F0-9]{2}/g).reverse().join('');   //export hash used for txid
            outputSet.txoutnum = 0; //exportSet.position;
            outputSet.exportinfo = createCrossChainExport(exportSet.transfers,exportSet.blockHeight,true, poolavailable);
            outputSet.partialtransactionproof = await getProof(exportSet.position,heightend);
            //serialize the prooflet index 
            let nullObj = "0x0000000000000000000000000000000000000000000000000000000000000000"
            let previousExportTxid = exportSet.position == '0' ? nullObj : await verusBridge.methods.readyExportHashes(exportSet.position - 1).call()
            let components = createComponents(exportSet.transfers,parseInt(exportSet.blockHeight,10),previousExportTxid, poolavailable);
            outputSet.partialtransactionproof = serializeEthFullProof(outputSet.partialtransactionproof).toString('hex') + components.output;
           // outputSet.txid = components.txid;
            
            //build transfer list
            //get the transactions at the index
            outputSet.transfers = createOutboundTransfers(exportSet.transfers);
            console.log("ETH Send to Verus: ",outputSet.transfers[0].currencyvalues, " to ", outputSet.transfers[0].destination);
            //loop through the 
            output.push(outputSet);
        }
        
       // console.log(JSON.stringify(output));
        return {"result":output};
    }catch(error){
        console.log("\x1b[41m%s\x1b[0m","GetExports error:" + error);
        return {"result": {"error": true, "message" : error}};
    }

}

exports.getBestProofRoot = async (input) => {
    //loop through the proofroots and check each one
    //console.log(input);
    let proofroots = input[0].proofroots;
    let bestindex = 0;
    let validindexes = [];
    let latestproofroot = {};
   // block = await web3.eth.getBlock("latest");
   try{
        if(input.length && proofroots) {
            for(let i=0; i < proofroots.length; i++){
            // console.log(proofroots[i]);


                if(await checkProofRoot(proofroots[i].height, proofroots[i].stateroot, proofroots[i].blockhash, BigInt(addBytesIndicator(proofroots[i].power))))
                {
                    validindexes.push(i);
                    if(proofroots[bestindex].height < proofroots[i].height) bestindex = i;
                }
            }
        }
        
        
        latestproofroot = await getProofRoot();
        if(logging)
        console.log("getbestproofroot result:",{bestindex, validindexes, latestproofroot});
        return {"result": {bestindex, validindexes, latestproofroot}};
    }catch(error){
        console.log("\x1b[41m%s\x1b[0m","getBestProofRoot error:" + error);
        return {"result": {"error": true, "message" : error}};
    }
}

getProofRoot = async () => {
    try{
    block = await web3.eth.getBlock("latest");
    }catch(error){

        throw "web3.eth.getBlock error:"
    }
    let latestproofroot = {};
    latestproofroot.version = 1;
    latestproofroot.type = 2;
    latestproofroot.systemid = ETHSystemID;
    latestproofroot.height = block.number;
    latestproofroot.stateroot = removeHexLeader(block.stateRoot).match(/[a-fA-F0-9]{2}/g).reverse().join('');
    latestproofroot.blockhash = removeHexLeader(block.hash).match(/[a-fA-F0-9]{2}/g).reverse().join('');
    latestproofroot.power = BigInt(block.totalDifficulty).toString(16);
    return latestproofroot;

}

getLastProofRoot = async () => {
    let lastProof = {};
    try{
    lastProof = await  verusNotarizer.methods.getLastProofRoot().call();
    }catch(error){

        throw "web3.eth.getLastProofRoot error:"
    }
    let lastproofroot = {};
    lastproofroot.version = parseInt(lastProof.version,10);
    lastproofroot.type = parseInt(lastProof.cprtype,10);
    lastproofroot.systemid = VerusSystemID;
    lastproofroot.height = parseInt(lastProof.rootheight,10);
    lastproofroot.stateroot = removeHexLeader(lastProof.stateroot);
    lastproofroot.blockhash = removeHexLeader(lastProof.blockhash);
    lastproofroot.power = removeHexLeader(lastProof.compactpower);
    return lastproofroot;

}

checkProofRoot = async (height, stateroot, blockhash, power) => {
  //  console.log("height:", height);
    let block = {};

    try{
        block = await web3.eth.getBlock(height);

    }
    catch(error){
        console.log("\x1b[41m%s\x1b[0m","web3.eth.getBlock error:" + error);
        throw "web3.eth.getBlock error:"

    }
   // block.
  //  console.log("retrieved block at height ", height);
  //  console.log("block:", block.status, block.stateRoot, block.hash, block.totalDifficulty);
  //  console.log("params:", height, stateroot, blockhash, BigInt(power).toString(16));

    if (!block.stateRoot)
    {
        return false;

    }

    block.stateRoot = removeHexLeader(block.stateRoot).match(/[a-fA-F0-9]{2}/g).reverse().join('');
    block.hash = removeHexLeader(block.hash).match(/[a-fA-F0-9]{2}/g).reverse().join('');
  //  console.log(blockStateRoot, newBlockHash, BigInt(block.totalDifficulty).toString(16));
    if (block.stateRoot == stateroot && blockhash == block.hash && BigInt(block.totalDifficulty).toString(16) == BigInt(power).toString(16)) {
        return true;
    } else{
       return false;}
}

//return the data required for a notarisation to be made
exports.getNotarizationData = async () => {

    //create a CProofRoot from the block data
    let block;
    try{
        block = await web3.eth.getBlock("latest");
        let Notarization = {};
        Notarization.version  = 1;
        //possibly check the contract exists?
        Notarization.launchconfirmed = true;
        Notarization.launchcomplete = true;
        Notarization.mirror = true;
        //proposer should be set to something else this is just sample data
        Notarization.proposer = {
            "type" : 4,
            "address" : "iPveXFAHwModR7LrvgzxxHvdkKH84evYvT"
        };
        Notarization.currencyid = ETHSystemID; // this should actually be the last VRSC or VRSCTEST notarization as a mirror, but first is ignored
        Notarization.notarizationheight = block.number;
        Notarization.currencystate = {};
        Notarization.currencystate[ETHSystemID] = {
            "flags" : 0,
            "version" : 1,
            "launchcurrencies" : [{
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
            ETHSystemID : {
                "flags": 0,
                "version": 1,
                "currencyid": ETHSystemID ,
                "launchcurrencies": [
                    {
                        "currencyid": ETHSystemID ,
                        "weight": 0.00000000,
                        "reserves": 1.00000000,
                        "priceinreserve": 1.00000000
                    }
                ],
                "initialsupply": 0.00000000,
                "emitted": 0.00000000,
                "supply": 0.00000000,
                "currencies": {
                    ETHSystemID : {
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
        Notarization.forks = [[0]];
        Notarization.lastconfirmedheight = 0;
        Notarization.lastconfirmed = 0;
        Notarization.betchain = 0;
        
        return {"result":Notarization};

    }catch(error){
        console.log("\x1b[41m%s\x1b[0m","getNotarizationData:" + error);
        return {"result": {"error": true, "message" : error}};
    }
    }
    
    /** send transactions to ETH 
     * CTransferArray, an array of CTransfer
     * CTransferSet is a CTransferSet
     * proof is an array of bytes32
     * blockheight uint32
     * hashIndex uint32
     */
    
conditionSubmitImports = (CTransferArray) =>{

    for(let i = 0; i < CTransferArray.length; i++){

        CTransferArray[i].notarizationtxid = addHexPrefix(CTransferArray[i].notarizationtxid);
        CTransferArray[i].sourcesystemid = convertVerusAddressToEthAddress(CTransferArray[i].sourcesystemid);
        for(let j = 0; j < CTransferArray[i].exports.length; j++){
            CTransferArray[i].exports[j].partialtransactionproof = addHexPrefix(CTransferArray[i].exports[j].partialtransactionproof);
            CTransferArray[i].exports[j].txid = addHexPrefix(CTransferArray[i].exports[j].txid.match(/[a-fA-F0-9]{2}/g).reverse().join(''));
            for(let k = 0; k < CTransferArray[i].exports[j].transfers.length; k++){
                
                let keys = Object.keys(CTransferArray[i].exports[j].transfers[k].currencyvalues);
    
                for(const vals of keys){
                    CTransferArray[i].exports[j].transfers[k].currencyvalues[convertVerusAddressToEthAddress(vals)] =   
                        parseInt(convertToInt64(CTransferArray[i].exports[j].transfers[k].currencyvalues[vals]));
                    delete CTransferArray[i].exports[j].transfers[k].currencyvalues[vals];
                } 
                if(CTransferArray[i].exports[j].transfers[k].destination.type == 4 || 
                    CTransferArray[i].exports[j].transfers[k].destination.type == 2) //type PKH or ID
                    {
                        CTransferArray[i].exports[j].transfers[k].destination.address = 
                        convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].destination.address);
                    }
                CTransferArray[i].exports[j].transfers[k].destinationcurrencyid = 
                    convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].destinationcurrencyid);
                CTransferArray[i].exports[j].transfers[k].exportto = 
                    convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].exportto);                
                CTransferArray[i].exports[j].transfers[k].feecurrencyid = 
                    convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].feecurrencyid);  
                CTransferArray[i].exports[j].transfers[k].fees = 
                    parseInt(convertToInt64(CTransferArray[i].exports[j].transfers[k].fees));  
                CTransferArray[i].exports[j].transfers[k].secondreserveid = CTransferArray[i].exports[j].transfers[k].secondreserveid ?
                    convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].secondreserveid): 
                    "0x67460c2f56774ed27eeb8685f29f6cec0b090b00"; //dummy value never read if not set as flags will not read.
                if(CTransferArray[i].exports[j].transfers[k].via) {
                    CTransferArray[i].exports[j].transfers[k].via = 
                    convertVerusAddressToEthAddress(CTransferArray[i].exports[j].transfers[k].via); 
                }
            }
        }
    }
    return CTransferArray;
}

fixETHObjects = (inputArray) =>{

       
    for(let i = 0; i < inputArray.length; i++){
       
        let keys = Object.keys(inputArray[i].currencyvalues);

        for (var key of keys) {
            inputArray[i].currencyvalue = {"currency": key,"amount": inputArray[i].currencyvalues[key] };
        }
        delete inputArray[i].currencyvalues;
        
        inputArray[i].destination.destinationaddress = inputArray[i].destination.address
        inputArray[i].destination.destinationtype = inputArray[i].destination.type

        delete inputArray[i].destination.address;
        delete inputArray[i].destination.type;
        if((parseInt(inputArray[i].flags) & 1024) == 1024){ // RESERVETORESERVE FLAG
            inputArray[i].destcurrencyid = inputArray[i].via;
            inputArray[i].secondreserveid = inputArray[i].destinationcurrencyid;
        }else{
            inputArray[i].destcurrencyid = inputArray[i].destinationcurrencyid;
        }
        delete inputArray[i].destinationcurrencyid;

        inputArray[i].destsystemid = inputArray[i].exportto;
        delete inputArray[i].exportto;

    }
    return inputArray;
}

reshapeTransfers = (CTransferArray) =>{
    let CTempArray = [];
    
    for(let i = 0; i < CTransferArray.length; i++){
        for(let j = 0; j < CTransferArray[i].exports.length; j++){

        let exportinfo = createCrossChainExportToETH(fixETHObjects(CTransferArray[i].exports[j].transfers));
     

        let subarray = {height: 1,
                        txid: CTransferArray[i].exports[j].txid,
                        txoutnum: CTransferArray[i].exports[j].txoutnum,
                        exportinfo,
                        partialtransactionproof: [CTransferArray[i].exports[j].partialtransactionproof],
                        transfers: CTransferArray[i].exports[j].transfers,
                        };
        
        CTempArray.push(subarray);
        }
    }

    return CTempArray;
}

exports.submitImports = async (CTransferArray) => {
        //need to convert all the base64 encoded addresses back to uint160s to be correcly passed into solidity 
        //checks to 
        //    CTransferArray[0].height = 1;  // TODO: Remove Debug only
        //  console.log("Submitimports in :\n", JSON.stringify(CTransferArray));

        CTransferArray = conditionSubmitImports(CTransferArray);

        let CTempArray = reshapeTransfers(CTransferArray);
      
        CTempArray =  deSerializeMMR(CTempArray);

        CTempArray =  insertHeights(CTempArray);

        let txidArray =[];
        let resultTxidArray =[];
        if(logging){
        for (var i = 0, l = CTempArray.length; i < l; i++) {
            txidArray.push(CTempArray[i].txid)
                for(var j = 0; j < CTempArray[i].transfers.length; j++){
          //  console.log("Exports from Verus : ",JSON.stringify(CTempArray[i].transfers[j]));
        } 
            } 
        }
      //  console.log(JSON.stringify(CTempArray))
        let result = {};
        try {
                resultTxidArray =  await verusBridge.methods.checkImports(txidArray).call();
                if(resultTxidArray[0] != "0x0000000000000000000000000000000000000000000000000000000000000000"){
                    result = await verusBridge.methods.submitImports(CTempArray).send({from: account.address,gas: maxGas});
                return {result : result.transactionHash};
                }else{
                
                    return {result : "false"};

                }
           
            
        } catch(error){
            //console.log("Error in\n",JSON.stringify(CTempArray));
            lockexports = false;
            if(error.reason)
                console.log("\x1b[41m%s\x1b[0m","submitImports:" + error.reason);
            else{    
            if(error.receipt)
                console.log("\x1b[41m%s\x1b[0m","submitImports:" + error.reason);
            console.log("\x1b[41m%s\x1b[0m","submitImports:" + error);}
            return {result: {result: error.message}};
        }
        

    }
    
IsLaunchCleared = (pBaasNotarization) =>{
    return pBaasNotarization.launchcleared == true ? constants.FLAG_START_NOTARIZATION : 0;
}

IsLaunchConfirmed = (pBaasNotarization) =>{
    return pBaasNotarization.launchconfirmed == true ? constants.FLAG_LAUNCH_CONFIRMED : 0;

}
IsLaunchComplete = (pBaasNotarization) =>{
    return pBaasNotarization.launchcomplete == true ? constants.FLAG_LAUNCH_COMPLETE : 0;
}



exports.submitAcceptedNotarization = async (params) => {

      let pBaasNotarization = params[0]; 
      let signatures = params[1].signatures; //signatures are in notary key pairs e.g. "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq" : ["1232"]
    //  console.log(JSON.stringify(params));
      try{
  
          let lastNotarizationHeight = await verusNotarizer.methods.lastBlockHeight().call();
          if(pBaasNotarization.notarizationheight <= lastNotarizationHeight) return {"result":"0"};
  
      }catch(error){
          console.log("submitAcceptedNotarization Error:\n",error);
          return null;
      }
      
      let transactionHash = 0;
      pBaasNotarization.flags = IsLaunchCleared(pBaasNotarization) | IsLaunchConfirmed(pBaasNotarization) | IsLaunchComplete(pBaasNotarization);
      //change all iaddresses to ethAddress and add 0x to all hex
      pBaasNotarization.proposer.destinationtype = pBaasNotarization.proposer.type;
      pBaasNotarization.proposer.destinationaddress = convertVerusAddressToEthAddress(pBaasNotarization.proposer.address);
      delete pBaasNotarization.proposer.type;
      delete pBaasNotarization.proposer.address;
      pBaasNotarization.currencyid = convertVerusAddressToEthAddress(pBaasNotarization.currencyid);
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
      for(let i = 0; i < pBaasNotarization.currencystates.length; i++){
          let currencystate = {};
          let currencyids = Object.keys(pBaasNotarization.currencystates[i]);
          currencystate.currencyid = convertVerusAddressToEthAddress(currencyids[0]);
          currencystate.currencystate = completeCurrencyState(pBaasNotarization.currencystates[i][currencyids[0]]); 
          currencystates.push(currencystate);
      }
  
      pBaasNotarization.currencystates = currencystates;
      
      for(let i = 0; i < pBaasNotarization.proofroots.length; i++){
          let proofroot = {};
          pBaasNotarization.proofroots[i].cprtype = pBaasNotarization.proofroots[i].type;
          delete pBaasNotarization.proofroots[i].type;
          pBaasNotarization.proofroots[i].systemid = convertVerusAddressToEthAddress(pBaasNotarization.proofroots[i].systemid);
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
  
      if(signatures[sigKeys[0]].signatures.length == 0) throw "No Signatures present"; //what should i return if we get bad data
      let splitSigs = splitSignatures(signatures[sigKeys[0]].signatures);
      
      let vsVals = [];
      let rsVals = [];
      let ssVals = [];
      let blockheights = [];
      let notaryAddresses = [];
      for(let i=0; i< sigKeys.length; i++){
  
          splitSigs = splitSignature(signatures[sigKeys[i]].signatures[0]);
          vsVals.push(splitSigs.vVal);
          rsVals.push(splitSigs.rVal);
          ssVals.push(splitSigs.sVal);
          blockheights.push(signatures[sigKeys[i]].blockheight);
          notaryAddresses.push(convertVerusAddressToEthAddress(sigKeys[i]));
      }
  
      //process nodes
  
      for(let i=0; i< pBaasNotarization.nodes.length; i++){
          pBaasNotarization.nodes[i].nodeidentity = convertVerusAddressToEthAddress(pBaasNotarization.nodes[i].nodeidentity);
      }
        
      try{
            let txhash = {}
            let test4 =  await verusSerializer.methods.serializeCPBaaSNotarization(pBaasNotarization).call();
          
           //  console.log("result from serializeCPBaaSNotarization:\n", (test4));
            var firstNonce = await web3.eth.getTransactionCount(account.address);
            txhash = await verusNotarizer.methods.setLatestData(pBaasNotarization,vsVals,rsVals,ssVals,blockheights,notaryAddresses).call();
           // console.log(JSON.stringify(txhash));
            if(transactioncount != firstNonce){
            txhash = await verusNotarizer.methods.setLatestData(pBaasNotarization,vsVals,rsVals,ssVals,blockheights,notaryAddresses).send({from: account.address,gas: maxGas});
            transactioncount = firstNonce;
            }
            return {"result": txhash};

      } catch(error){
            console.log("\x1b[41m%s\x1b[0m" , error);
            locknotorization = false;
            return {"result":{"txid":error}};
      }
           
  }

  completeCurrencyState = (currencyState) => {

    //currencyState.systemid = convertVerusAddressToEthAddress(currencyState.systemid);
    currencyState.currencyid = convertVerusAddressToEthAddress(currencyState.currencyid);
    //currencyState.stateroot = addHexPrefix(currencyState.stateroot);
    //currencyState.blockhash = addHexPrefix(currencyState.blockhash);
    //currencyState.power = addHexPrefix(currencyState.power);

    if(currencyState.weights == undefined) currencyState.weights = [];
    if(currencyState.reserves == undefined) currencyState.reserves = [];
    if(currencyState.reservein == undefined) currencyState.reservein = [];
    if(currencyState.primarycurrencyin == undefined) currencyState.primarycurrencyin = [];
    if(currencyState.reserveout == undefined) currencyState.reserveout = [];
    if(currencyState.conversionprice == undefined) currencyState.conversionprice = [];
    if(currencyState.viaconversionprice == undefined) currencyState.viaconversionprice = [];
    if(currencyState.fees == undefined) currencyState.fees = [];
    if(currencyState.conversionfees == undefined) currencyState.conversionfees = [];
    if(currencyState.priorweights == undefined) currencyState.priorweights = [];
    //!! Because we are creating a matching hash of the import we need to just have a uint160[]
    if(currencyState.currencies !== undefined) {
        //loop through and convert from verusID to 0x address
        let currencies = [];
        let currencyids = Object.keys(currencyState.currencies);

        for(let i=0; i < currencyids.length; i++){
            if(currencyState.currencies[currencyids[i]].reservein != undefined) currencyState.reservein.push(amountFromValue(currencyState.currencies[currencyids[i]].reservein));
            else currencyState.reservein.push(0);
            if(currencyState.currencies[currencyids[i]].primarycurrencyin != undefined) currencyState.primarycurrencyin.push(amountFromValue(currencyState.currencies[currencyids[i]].primarycurrencyin));
            else currencyState.primarycurrencyin.push(0);
            if(currencyState.currencies[currencyids[i]].reserveout != undefined) currencyState.reserveout.push(amountFromValue(currencyState.currencies[currencyids[i]].reserveout));
            else currencyState.reserveout.push(0);
            if(currencyState.currencies[currencyids[i]].lastconversionprice != undefined) currencyState.conversionprice.push(amountFromValue(currencyState.currencies[currencyids[i]].lastconversionprice));
            else currencyState.conversionprice.push(0);
            if(currencyState.currencies[currencyids[i]].viaconversionprice != undefined) currencyState.viaconversionprice.push(amountFromValue(currencyState.currencies[currencyids[i]].viaconversionprice));
            else currencyState.viaconversionprice.push(0);
            if(currencyState.currencies[currencyids[i]].fees != undefined) currencyState.fees.push(amountFromValue(currencyState.currencies[currencyids[i]].fees));
            else currencyState.fees.push(0);
            if(currencyState.currencies[currencyids[i]].conversionfees != undefined) currencyState.conversionfees.push(amountFromValue(currencyState.currencies[currencyids[i]].conversionfees));
            else currencyState.conversionfees.push(0);
            if(currencyState.currencies[currencyids[i]].priorweights != undefined) currencyState.priorweights.push(amountFromValue(currencyState.currencies[currencyids[i]].priorweights));   
            else currencyState.priorweights.push(0);
        }
        
        //loop through the object keys
        for(let j =0;j < currencyids.length; j++){
            currencies.push(convertVerusAddressToEthAddress(currencyids[j]));
        }
        currencyState.currencies = currencies;
    } else currencyState.currencies = [];


    if(currencyState.launchcurrencies != undefined && currencyState.launchcurrencies.length>0) {
        for(let i=0; i < currencyState.launchcurrencies.length; i++){
            currencyState.weights.push(amountFromValue(currencyState.launchcurrencies[i].weight));
            currencyState.reserves.push(amountFromValue(currencyState.launchcurrencies[i].reserves));
        }
        
    } else if (currencyState.reservecurrencies != undefined && currencyState.reservecurrencies.length>0) {
        for(let i=0; i < currencyState.reservecurrencies.length; i++){
            currencyState.weights.push(amountFromValue(currencyState.reservecurrencies[i].weight));
            currencyState.reserves.push(amountFromValue(currencyState.reservecurrencies[i].reserves));
        }
    }

    if(currencyState.initialsupply > 0) currencyState.initialsupply = amountFromValue(currencyState.initialsupply);
    if(currencyState.supply > 0) currencyState.supply = amountFromValue(currencyState.supply);
    if(currencyState.emitted > 0) currencyState.emitted = amountFromValue(currencyState.emitted);
    if(currencyState.primarycurrencyout > 0) currencyState.primarycurrencyout = amountFromValue(currencyState.primarycurrencyout);
    if(currencyState.preconvertedout > 0) currencyState.preconvertedout = amountFromValue(currencyState.preconvertedout);
    if(currencyState.primarycurrencyfees > 0) currencyState.primarycurrencyfees = amountFromValue(currencyState.primarycurrencyfees);
    if(currencyState.primarycurrencyconversionfees > 0) currencyState.primarycurrencyconversionfees = amountFromValue(currencyState.primarycurrencyconversionfees);

    return currencyState;

}
//return the data required for a notarisation to be made
exports.getLastImportFrom = async () => {

    //create a CProofRoot from the block data
    let block;
    try{
        block = await web3.eth.getBlock("latest");
        let lastimportheight = await verusBridge.methods.getlastimportheight().call();

    let lastimport = {};

    lastimport.version = 1;
    lastimport.flags = 68;
    lastimport.sourcesystemid = ETHSystemID;
    lastimport.sourceheight  =parseInt(lastimportheight);
    lastimport.importcurrencyid = ETHSystemID;
    lastimport.valuein = {};
    lastimport.tokensout = {};
    lastimport.numoutputs = {};
    lastimport.hashtransfers = {};
    lastimport.exporttxid = {};
    lastimport.exporttxout = {};
    

    let lastconfirmednotarization = {};

    lastconfirmednotarization.version  = 1;

    //possibly check the contract exists?
    lastconfirmednotarization.launchconfirmed = true;
    lastconfirmednotarization.launchcomplete = true;
    lastconfirmednotarization.ismirror = true;

    //proposer should be set to something else this is just sample data
    lastconfirmednotarization.proposer = {
        "type" : 4,
        "address" : "iPveXFAHwModR7LrvgzxxHvdkKH84evYvT"    //TODO: [EB-6] Confirm the proposer address
    };

    lastconfirmednotarization.currencyid = ETHSystemID;
    lastconfirmednotarization.notarizationheight = block.number;
    lastconfirmednotarization.currencystate = {
        "flags" : 0,
        "version" : 1,
        "currencyid": ETHSystemID,
        "launchcurrencies" : [],
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

    let lastProof = await  getLastProofRoot();

    if(logging)
        console.log("latestProofRoot / lastProof:\n",latestProofRoot, lastProof);

    lastconfirmednotarization.proofroots = [latestProofRoot, lastProof];
    lastconfirmednotarization.lastconfirmedheight = 0;
    lastconfirmednotarization.lastconfirmed = 0;

    let lastconfirmedutxo = {
        "txid": "16736c05a8a28201a3680a4cc0bb7f1d8ac2ca878c358bcde52501328722ebb1",  // TODO: [EB-5] Confirm the UTXO to go here
        "voutnum": 0
        }

      return {"result":{lastimport,lastconfirmednotarization,lastconfirmedutxo }};
    }catch(error){
        console.log("\x1b[41m%s\x1b[0m","web3.eth.getBlock error:" + error);
        return {"result": {"error": true, "message" : error}};
    }

}

exports.invalid = async () => {
    console.log("\x1b[41m%s\x1b[0m","Invalid API call");
    return {"result": {"error": true, "message" : "Unrecognized API call"}}

}

