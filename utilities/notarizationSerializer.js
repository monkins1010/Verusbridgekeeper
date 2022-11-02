const util = require('../utils.js');
const bitGoUTXO = require('bitgo-utxo-lib');
var constants = require('../constants');
const deserializer = require('../deserializer.js')
const notarizer = require('../notarization.js')

const serializeNotarization = (notarization) => {

    let serializedBytes = Buffer.from(new Uint8Array(util.writeVarInt(notarization.version)));

    serializedBytes = Buffer.concat([serializedBytes, new Uint8Array(util.writeVarInt(notarizationFlags(notarization)))]); 

    serializedBytes = Buffer.concat([serializedBytes, serializeCTransferDestination(notarization.proposer)]); 

    serializedBytes = Buffer.concat([serializedBytes, bitGoUTXO.address.fromBase58Check((notarization.currencyid), 160).hash]); 

    serializedBytes = Buffer.concat([serializedBytes, serializeCoinbaseCurrencyState(notarization.currencystate)]); 

    serializedBytes = Buffer.concat([serializedBytes, util.writeUInt(notarization.notarizationheight, 32)]); 

    serializedBytes = Buffer.concat([serializedBytes, 
        Buffer.from(notarization.prevnotarizationtxid.match(/[a-fA-F0-9]{2}/g).reverse().join(''), 'hex')]); 

    serializedBytes = Buffer.concat([serializedBytes, util.writeUInt(notarization.prevnotarizationout, 32)]); 
    serializedBytes = Buffer.concat([serializedBytes, 
        Buffer.from(notarization.hashprevcrossnotarization.match(/[a-fA-F0-9]{2}/g).reverse().join(''), 'hex')]);

    serializedBytes = Buffer.concat([serializedBytes, util.writeUInt(notarization.prevheight, 32)]); 

    serializedBytes = Buffer.concat([serializedBytes, serializeCoinbaseCurrencyStates(notarization.currencystates)]); 
    serializedBytes = Buffer.concat([serializedBytes, serializeCProofRootArray(notarization.proofroots)]); 
    serializedBytes = Buffer.concat([serializedBytes, serializeNodes(notarization.nodes)]); 

    console.log(serializedBytes.toString("hex"))

    return serializedBytes;
}

function notarizationFlags(pBaasNotarization) {
     
    let flags = pBaasNotarization.launchcleared == true ? constants.FLAG_START_NOTARIZATION : 0;
    flags += pBaasNotarization.launchconfirmed == true ? constants.FLAG_LAUNCH_CONFIRMED : 0;
    flags += pBaasNotarization.launchcomplete == true ? constants.FLAG_LAUNCH_COMPLETE : 0;
    flags += pBaasNotarization.refunding  == true ? constants.FLAG_REFUNDING : 0;
    return flags;
}

function serializeCTransferDestination(ctd) {

    let encodedOutput = Buffer.alloc(1);
    encodedOutput.writeUInt8(ctd.type);
    let destination = Buffer.from(bitGoUTXO.address.fromBase58Check(util.removeHexLeader(ctd.address), 160).hash , 'hex');
    encodedOutput = Buffer.concat([encodedOutput, util.writeCompactSize(destination.length), destination]);

    return encodedOutput;
}

function serializeCoinbaseCurrencyState(currencyState) {

    let encodedOutput = serializeCurrencyState(currencyState); 
    
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(util.convertToInt64(currencyState.primarycurrencyout), 64)]);
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(util.convertToInt64(currencyState.preconvertedout), 64)]);
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(util.convertToInt64(currencyState.primarycurrencyfees), 64)]);
    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(util.convertToInt64(currencyState.primarycurrencyconversionfees), 64)]);
   
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "reservein", 64 )]);
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "primarycurrencyin", 64 )]);
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "reserveout", 64 )]);
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "lastconversionprice", 64 )]);
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "viaconversionprice", 64 )]);
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "fees", 64 )]);
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "priorweights", 32 )]);
    encodedOutput = Buffer.concat([encodedOutput, util.serializeIntArray(currencyState.currencies, "conversionfees", 64 )]);

    //encodedOutput.writeUInt16LE(currencyState.version);

    return encodedOutput;
}

function isFractional(flags)
{
    return (parseInt(flags) & constants.FLAG_FRACTIONAL) == constants.FLAG_FRACTIONAL;
}

function serializeCurrencyState(currencyState) {

    let encodedOutput = util.writeUInt(currencyState.version, 16);

    encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(currencyState.flags, 16)]);

    encodedOutput = Buffer.concat([encodedOutput, Buffer.from(bitGoUTXO.address.fromBase58Check(util.removeHexLeader(currencyState.currencyid), 160).hash , 'hex')]);
    
    if (isFractional(currencyState.flags)) {
        encodedOutput = Buffer.concat([encodedOutput, util.serializeReserveCurrenciesArray(currencyState.reservecurrencies)]);
        encodedOutput = Buffer.concat([encodedOutput, util.serializeReserveWeightsArray(currencyState.reservecurrencies)]);
        encodedOutput = Buffer.concat([encodedOutput, util.serializeReservesArray(currencyState.reservecurrencies)]);
    } else {
        encodedOutput = Buffer.concat([encodedOutput, util.serializeReserveCurrenciesArray(currencyState.launchcurrencies)]);
        encodedOutput = Buffer.concat([encodedOutput, util.serializeReserveWeightsArray(currencyState.launchcurrencies)]);
        encodedOutput = Buffer.concat([encodedOutput, util.serializeReservesArray(currencyState.launchcurrencies)]);
    }
    
    let initialsupply = Buffer.from(new Uint8Array(util.writeVarInt(util.convertToInt64(currencyState.initialsupply))));
    encodedOutput = Buffer.concat([encodedOutput, initialsupply]);

    let emitted = Buffer.from(new Uint8Array(util.writeVarInt(util.convertToInt64(currencyState.emitted))));
    encodedOutput = Buffer.concat([encodedOutput, emitted]);

    let supply = Buffer.from(new Uint8Array(util.writeVarInt(util.convertToInt64(currencyState.supply))));
    encodedOutput = Buffer.concat([encodedOutput, supply]);

    return encodedOutput;
}

function serializeCoinbaseCurrencyStates(currencyState) {

    let encodedOutput = Buffer.from(util.writeCompactSize(currencyState.length));
    
    for (const items of currencyState) {
        let keys = Object.keys(items);

        //encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check((keys[0]), 160).hash]);
        encodedOutput = Buffer.concat([encodedOutput, serializeCoinbaseCurrencyState(items[keys[0]])]);

    }
    return encodedOutput;
}

function serializeCProofRootArray (proof) {

    let encodedOutput = Buffer.from(util.writeCompactSize(proof.length));

    for (const item of proof) {
       // encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check((item.systemid), 160).hash]);
        encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(item.version, 16)]);
        encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(item.type, 16)]);
        encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check((item.systemid), 160).hash]);
        encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(item.height, 32)]);
        encodedOutput = Buffer.concat([encodedOutput, 
            Buffer.from(item.stateroot.match(/[a-fA-F0-9]{2}/g).reverse().join(''), 'hex')]); 
        encodedOutput = Buffer.concat([encodedOutput, 
            Buffer.from(item.blockhash.match(/[a-fA-F0-9]{2}/g).reverse().join(''), 'hex')]); 
        encodedOutput = Buffer.concat([encodedOutput, 
            Buffer.from(item.power.match(/[a-fA-F0-9]{2}/g).reverse().join(''), 'hex')]);
        if (item.type == 2) // type ethereum
        {
          encodedOutput = Buffer.concat([encodedOutput, util.writeUInt(item.gasprice, 64)]);
        }
    }

    return encodedOutput;
}

function serializeNodes (nodes) {

    let encodedOutput = Buffer.from(util.writeCompactSize(nodes.length));

    for (const item of nodes){
        encodedOutput = Buffer.concat([encodedOutput, util.writeCompactSize(item.networkaddress.length)]);
        encodedOutput = Buffer.concat([encodedOutput, Buffer.from(item.networkaddress, 'utf-8')]);
        encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check((item.nodeidentity), 160).hash]);
    }

    return encodedOutput;
}

const deserializeNotarization = (notarization) => {

    let serValue = {}
    let returnVal = {};
    serValue.stream = Buffer.from(util.removeHexLeader(notarization), 'hex');

    let temp = deserializer.readVarIntPos(serValue);
    returnVal.version = temp.retval 

    temp = deserializer.readVarIntPos(serValue);
    returnVal.flags = temp.retval;

    notarizer.notarizationFlags(returnVal);
    delete returnVal.flags;

    temp = deserializer.readTranferdestination(serValue);
    returnVal.proposer = temp.retVal;

    temp = deserializer.readtype(serValue,"uint", 160)

    returnVal.currencyid = util.hexAddressToBase58(constants.I_ADDRESS_TYPE, temp.retval);


    returnVal.currencystate = deserializeCoinbaseCurrencyState(serValue);
    
    temp = deserializer.readtype(serValue,"uint", 32)
    returnVal.notarizationheight = temp.retval;

    temp = deserializer.readtype(serValue,"uint", 256)
    returnVal.prevnotarizationtxid = util.removeHexLeader(temp.retval).match(/[a-fA-F0-9]{2}/g).reverse().join('')

    temp = deserializer.readtype(serValue,"uint", 32)
    returnVal.prevnotarizationout = temp.retval;

    temp = deserializer.readtype(serValue,"uint", 256)
    returnVal.hashprevcrossnotarization = util.removeHexLeader(temp.retval).match(/[a-fA-F0-9]{2}/g).reverse().join('')

    temp = deserializer.readtype(serValue,"uint", 32)
    returnVal.prevheight = temp.retval;

    returnVal.currencystates = deserializeCoinbaseCurrencyStates(serValue);

    returnVal.proofroots = deserializeProofRoots(serValue);

    returnVal.nodes = deserializeProofNodes(serValue);

    //console.log(JSON.stringify(returnVal, null, 2));
    return returnVal;
}

const deserializeCoinbaseCurrencyStates = (memory) => {

  let stateSize = deserializer.readCompactInt(memory);
  let currencies = {}

  for (let i = 0; i < stateSize.retval; i++){

    temp = deserializer.readtype(memory,"uint", 160)
    let currencyid = util.hexAddressToBase58(constants.I_ADDRESS_TYPE, temp.retval);

    currencies[currencyid] = deserializeCoinbaseCurrencyState(memory)

  }

  let retval = []

  let keys = Object.keys(currencies)

  for (const items of keys)
  {
    retval.push({[items] : currencies[items]})
  }

  return retval;

}

const deserializeCoinbaseCurrencyState = function (memory)
{
    let retVal = {};
    let temp = {};

    temp = deserializer.readtype(memory,"uint", 16);
    retVal.version = temp.retval;

    temp = deserializer.readtype(memory,"uint", 16)
    retVal.flags = temp.retval;

    temp = deserializer.readtype(memory,"uint", 160);
    retVal.currencyid = util.hexAddressToBase58(constants.I_ADDRESS_TYPE, temp.retval);

    
    if (isFractional(retVal.flags))
    {
      let reservecurrencies = {};

      reservecurrencies.currencyids = deserializer.deserializeReserveCurrenciesArray(memory);
      reservecurrencies.currencyweights = deserializer.deserializeReserveWeightsArray(memory);
      reservecurrencies.currencyreserves = deserializer.deserializeReservesArray(memory);

      retVal.reservecurrencies = [];
      for (const [i, subItem] of reservecurrencies.currencyids.entries())
      {
        let reserve = {}
        
        reserve.currencyid = reservecurrencies.currencyids[i];
        reserve.weight = reservecurrencies.currencyweights[i];
        reserve.reserves = reservecurrencies.currencyreserves[i];

        retVal.reservecurrencies.push(reserve);
      }

    }
    else
    {
      let launchcurrencies = {};

      launchcurrencies.currencyids = deserializer.deserializeReserveCurrenciesArray(memory);
      launchcurrencies.currencyweights = deserializer.deserializeReserveWeightsArray(memory);
      launchcurrencies.currencyreserves = deserializer.deserializeReservesArray(memory);

      retVal.launchcurrencies = [];
      for (const [i, subItem] of launchcurrencies.currencyids.entries())
      {
        let launch = {}
        
        launch.currencyid = launchcurrencies.currencyids[i];
        launch.weight = launchcurrencies.currencyweights[i];
        launch.reserves = launchcurrencies.currencyreserves[i];

        retVal.launchcurrencies.push(launch);
      }
    }

    temp = deserializer.readVarIntPos(memory);
    retVal.initialsupply = util.uint64ToVerusFloat(temp.retval);
    temp = deserializer.readVarIntPos(memory);
    retVal.emitted = util.uint64ToVerusFloat(temp.retval);
    temp = deserializer.readVarIntPos(memory);
    retVal.supply = util.uint64ToVerusFloat(temp.retval);

    temp = deserializer.readtype(memory,"uint", 64);
    retVal.primarycurrencyout = util.uint64ToVerusFloat(temp.retval);
    temp = deserializer.readtype(memory,"uint", 64);
    retVal.preconvertedout = util.uint64ToVerusFloat(temp.retval);
    temp = deserializer.readtype(memory,"uint", 64);
    retVal.primarycurrencyfees = util.uint64ToVerusFloat(temp.retval);
    temp = deserializer.readtype(memory,"uint", 64);
    retVal.primarycurrencyconversionfees = util.uint64ToVerusFloat(temp.retval);
    
    retVal.currencies = deserializer.deserializeCurrenciesArray
                  (memory, isFractional(retVal.flags) ? retVal.reservecurrencies : retVal.launchcurrencies);

    return retVal;

}

const deserializeProofRoots = (memory) => {
  
  let rootSize = deserializer.readCompactInt(memory);
  let roots = []

  for (let i = 0; i < rootSize.retval; i++){

    temp = deserializer.readtype(memory,"uint", 160)
    let systemid = util.hexAddressToBase58(constants.I_ADDRESS_TYPE, temp.retval);

    let rootObject = {}

    temp = deserializer.readtype(memory,"uint", 16);
    rootObject.version = temp.retval;

    temp = deserializer.readtype(memory,"uint", 16);
    rootObject.type = temp.retval;

    temp = deserializer.readtype(memory,"uint", 160)
    rootObject.systemid = util.hexAddressToBase58(constants.I_ADDRESS_TYPE, temp.retval);

    temp = deserializer.readtype(memory,"uint", 32);
    rootObject.height = temp.retval;

    temp = deserializer.readtype(memory,"uint", 256)
    rootObject.stateroot = util.removeHexLeader(temp.retval).match(/[a-fA-F0-9]{2}/g).reverse().join('')

    temp = deserializer.readtype(memory,"uint", 256)
    rootObject.blockhash = util.removeHexLeader(temp.retval).match(/[a-fA-F0-9]{2}/g).reverse().join('')

    temp = deserializer.readtype(memory,"uint", 256)
    rootObject.power = util.removeHexLeader(temp.retval).match(/[a-fA-F0-9]{2}/g).reverse().join('')

    if (rootObject.type == 2)  //type ethereum
    {
      temp = deserializer.readtype(memory,"uint", 64);
      rootObject.gasprice = util.uint64ToVerusFloat(temp.retval);
    }

    roots.push(rootObject);
  }

  return roots;

}

const deserializeProofNodes = (memory) => {

  let nodeSize = deserializer.readCompactInt(memory);
  let nodes = []

  for (let i = 0; i < nodeSize.retval; i++){
    let nodeItem = {}

    let stringSize = deserializer.readCompactInt(memory);

    nodeItem.networkaddress = memory.stream.slice(0, stringSize.retval).toString('utf8');
    memory.stream = memory.stream.slice(stringSize.retval);

    let temp = null;
    temp = deserializer.readtype(memory,"uint", 160)
    nodeItem.nodeidentity = util.hexAddressToBase58(constants.I_ADDRESS_TYPE, temp.retval);

    nodes.push(nodeItem);
  }
  return nodes
  
}

exports.serializeNotarization = serializeNotarization;
exports.deserializeNotarization = deserializeNotarization;

// TEST TXID on testnet :  ./verus -chain=vrsctest getrawtransaction b92f52087bbd461706169d72fc633a7d1864208c316f9d0b0631cfdd4292f1f3 1 
const test2 = {
    "version": 1,
    "launchcleared": true,
    "launchconfirmed": true,
    "launchcomplete": true,
    "proposer": {
      "address": "i9YjMdFN1Dd24dDJuVbYUm4j8tuzvgHD9G",
      "type": 4
    },
    "currencyid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
    "notarizationheight": 7710322,
    "currencystate": {
      "flags": 48,
      "version": 1,
      "currencyid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
      "launchcurrencies": [
      ],
      "initialsupply": 0.00000000,
      "emitted": 0.00000000,
      "supply": 0.00000000,
      "primarycurrencyfees": 0.00000000,
      "primarycurrencyconversionfees": 0.00000000,
      "primarycurrencyout": 0.00000000,
      "preconvertedout": 0.00000000
    },
    "prevnotarizationtxid": "7ac720c5a44698883f99e3b1f3608afb922d1f8de6895e0d2984722e5458cf21",
    "prevnotarizationout": 1,
    "prevheight": 7710297,
    "hashprevcrossnotarization": "fbea207652ddfed17094d3e058b3c1ae39c008e4c36cea8e226e0e09e6fb206d",
    "currencystates": [
      {
        "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": {
          "flags": 16,
          "version": 1,
          "currencyid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
          "launchcurrencies": [
          ],
          "initialsupply": 0.00000000,
          "emitted": 0.00000000,
          "supply": 0.00000000,
          "primarycurrencyfees": 0.00000000,
          "primarycurrencyconversionfees": 0.00000000,
          "primarycurrencyout": 0.00000000,
          "preconvertedout": 0.00000000
        }
      },
      {
        "iSojYsotVzXz4wh2eJriASGo6UidJDDhL2": {
          "flags": 49,
          "version": 1,
          "currencyid": "iSojYsotVzXz4wh2eJriASGo6UidJDDhL2",
          "reservecurrencies": [
            {
              "currencyid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
              "weight": 0.33333334,
              "reserves": 137570.26031047,
              "priceinreserve": 5.18039578
            },
            {
              "currencyid": "iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD",
              "weight": 0.33333333,
              "reserves": 15776.63582845,
              "priceinreserve": 0.59409075
            },
            {
              "currencyid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
              "weight": 0.33333333,
              "reserves": 15.01347886,
              "priceinreserve": 0.00056535
            }
          ],
          "initialsupply": 50000.00000000,
          "emitted": 0.00000000,
          "supply": 79667.80722075,
          "currencies": {
            "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": {
              "reservein": 0.00000000,
              "primarycurrencyin": 0.00000000,
              "reserveout": 27.49521939,
              "lastconversionprice": 5.18143115,
              "viaconversionprice": 5.18074089,
              "fees": 0.00000000,
              "conversionfees": 0.00000000,
              "priorweights": 0.33333334
            },
            "iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD": {
              "reservein": 0.00000000,
              "primarycurrencyin": 0.00000000,
              "reserveout": 0.00000000,
              "lastconversionprice": 0.59409075,
              "viaconversionprice": 0.59405118,
              "fees": 0.00000000,
              "conversionfees": 0.00000000,
              "priorweights": 0.33333333
            },
            "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm": {
              "reservein": 0.74494977,
              "primarycurrencyin": 0.00000000,
              "reserveout": 0.00000000,
              "lastconversionprice": 0.00056527,
              "viaconversionprice": 0.00056531,
              "fees": 0.00300000,
              "conversionfees": 0.00000000,
              "priorweights": 0.33333333
            }
          },
          "primarycurrencyfees": 0.00000000,
          "primarycurrencyconversionfees": 0.00000000,
          "primarycurrencyout": 0.00000000,
          "preconvertedout": 0.00000000
        }
      }
    ],
    "proofroots": [
      {
        "version": 1,
        "type": 2,
        "systemid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
        "height": 7710322,
        "stateroot": "e5eb891e9a549140b86c3aa3d1a21f78dd764fa496d3b6595b06382963f1cdb8",
        "blockhash": "8475d507211b8cb73979738da3064edb625477765e5e22b2e4fc31717fe572a1",
        "power": "0000000000000000000000000000000000000000000000000000000000a4a470",
        "gasprice": 1233213
      },
      {
        "version": 1,
        "type": 1,
        "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        "height": 52420,
        "stateroot": "1cf57f00d2e910eab3957f70467875fdaf55bd45f81fb0a327a3faa6476aa2e4",
        "blockhash": "00000000c7e8a823d06002b1104de683c91b2f7c1de1dfa166fd51468ef55db1",
        "power": "0000000000000004a8cf05a106ccd0b200000000000000000000b4789cd14e80"
      }
    ],
    "nodes": [
      {
        "networkaddress": "[2600:3c00::f03c:92ff:fe44:95b3]:29764",
        "nodeidentity": "i3UXS5QPRQGNRDDqVnyWTnmFCTHDbzmsYk"
      }
    ]
  }

const check2 = {
  "version": 1,
  "launchcleared": true,
  "launchconfirmed": true,
  "launchcomplete": true,
  "proposer": {
    "address": "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB",
    "type": 4
  },
  "currencyid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
  "notarizationheight": 7808047,
  "currencystate": {
    "flags": 48,
    "version": 1,
    "currencyid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
    "launchcurrencies": [
      {
        "currencyid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        "weight": 0.00000000,
        "reserves": 0.00010000,
        "priceinreserve": 0.00010000
      }
    ],
    "initialsupply": 0.00000000,
    "emitted": 0.00000000,
    "supply": 0.00000000,
    "currencies": {
      "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": {
        "reservein": 0.00000000,
        "primarycurrencyin": 0.00000000,
        "reserveout": 0.00000000,
        "lastconversionprice": 0.00000000,
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
  },
  "prevnotarizationtxid": "7de670c91caca95fe2a3d0c6eeae27e4a2b49db73d04d881253b8433371e4037",
  "prevnotarizationout": 1,
  "prevheight": 7808031,
  "hashprevcrossnotarization": "0000000000000000000000000000000000000000000000000000000000000000",
  "currencystates": [
    {
      "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": {
        "flags": 16,
        "version": 1,
        "currencyid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        "launchcurrencies": [
        ],
        "initialsupply": 0.00000000,
        "emitted": 0.00000000,
        "supply": 0.00000000,
        "primarycurrencyfees": 0.00000000,
        "primarycurrencyconversionfees": 0.00000000,
        "primarycurrencyout": 0.00000000,
        "preconvertedout": 0.00000000
      }
    },
    {
      "iSojYsotVzXz4wh2eJriASGo6UidJDDhL2": {
        "flags": 3,
        "version": 1,
        "currencyid": "iSojYsotVzXz4wh2eJriASGo6UidJDDhL2",
        "reservecurrencies": [
          {
            "currencyid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
            "weight": 0.33333334,
            "reserves": 0.00000000,
            "priceinreserve": 0.00000299
          },
          {
            "currencyid": "iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD",
            "weight": 0.33333333,
            "reserves": 0.00000000,
            "priceinreserve": 0.00000300
          },
          {
            "currencyid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
            "weight": 0.33333333,
            "reserves": 0.00000000,
            "priceinreserve": 0.00000300
          }
        ],
        "initialsupply": 1000000.00000000,
        "emitted": 0.00000000,
        "supply": 1000000.00000000,
        "currencies": {
          "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": {
            "reservein": 0.00000000,
            "primarycurrencyin": 0.00000000,
            "reserveout": 0.00000000,
            "lastconversionprice": 0.00000299,
            "viaconversionprice": 0.00000000,
            "fees": 0.00000000,
            "conversionfees": 0.00000000,
            "priorweights": 0.00000000
          },
          "iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD": {
            "reservein": 0.00000000,
            "primarycurrencyin": 0.00000000,
            "reserveout": 0.00000000,
            "lastconversionprice": 0.00000300,
            "viaconversionprice": 0.00000000,
            "fees": 0.00000000,
            "conversionfees": 0.00000000,
            "priorweights": 0.00000000
          },
          "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm": {
            "reservein": 0.00000000,
            "primarycurrencyin": 0.00000000,
            "reserveout": 0.00000000,
            "lastconversionprice": 0.00000300,
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
    }
  ],
  "proofroots": [
    {
      "version": 1,
      "type": 2,
      "systemid": "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
      "height": 7808047,
      "stateroot": "96be998ace7773889f648c1ea5a54429b443286f916517ff3977d22781af8107",
      "blockhash": "b3b2b2a2604dbe42cb8cb7dcabd7483afec391c51be114b0bb8efff8b7b25a8e",
      "power": "0000000000000000000000000000000000000000000000000000000000a4a470",
      "gasprice": 0
    },
    {
      "version": 1,
      "type": 1,
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "height": 310,
      "stateroot": "2fbd5be03b09b9095306ba5d01029e5fc748b590517af1417f897fa5400b65f1",
      "blockhash": "fbf80ddc6ac20a2755393fa4be0d7218275afea0bcba944d75333353ab7ca99c",
      "power": "00000000000000000146fde3db3e8b63000000000000000000000001ce72bcf5"
    }
  ],
  "nodes": [
  ]
}

const check4 = 
{
  version: "1",
  launchcleared: true,
  launchconfirmed: true,
  launchcomplete: true,
  proposer: {
    type: 4,
    address: "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB",
  },
  currencyid: "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
  currencystate: {
    version: 1,
    flags: 48,
    currencyid: "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
    launchcurrencies: [
      {
        currencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        weight: "0.00000000",
        reserves: "0.00010000",
      },
    ],
    initialsupply: "0.00000000",
    emitted: "0.00000000",
    supply: "0.00000000",
    primarycurrencyout: "0.00000000",
    preconvertedout: "0.00000000",
    primarycurrencyfees: "0.00000000",
    primarycurrencyconversionfees: "0.00000000",
    currencies: {
      iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
        reservein: "0.00000000",
        primarycurrencyin: "0.00000000",
        reserveout: "0.00000000",
        lastconversionprice: "0.00000000",
        viaconversionprice: "0.00000000",
        fees: "0.00000000",
        priorweights: "0.00000000",
        conversionfees: "0.00000000",
      },
    },
  },
  notarizationheight: 7833571,
  prevnotarizationtxid: "5155c25781a4b3723909187b1e13d0dd04143e5d66a0aabc6d6455eb8150df32",
  prevnotarizationout: 3,
  hashprevcrossnotarization: "0000000000000000000000000000000000000000000000000000000000000000",
  prevheight: 285,
  currencystates: {
    iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
      version: 1,
      flags: 16,
      currencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      launchcurrencies: [
      ],
      initialsupply: "0.00000000",
      emitted: "0.00000000",
      supply: "0.00000000",
      primarycurrencyout: "0.00000000",
      preconvertedout: "0.00000000",
      primarycurrencyfees: "0.00000000",
      primarycurrencyconversionfees: "0.00000000",
      currencies: {
      },
    },
    iSojYsotVzXz4wh2eJriASGo6UidJDDhL2: {
      version: 1,
      flags: 3,
      currencyid: "iSojYsotVzXz4wh2eJriASGo6UidJDDhL2",
      reservecurrencies: [
        {
          currencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
          weight: "0.33333334",
          reserves: "0.00000000",
        },
        {
          currencyid: "iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD",
          weight: "0.33333333",
          reserves: "0.00000000",
        },
        {
          currencyid: "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
          weight: "0.33333333",
          reserves: "0.00000000",
        },
      ],
      initialsupply: "1000000.00000000",
      emitted: "0.00000000",
      supply: "1000000.00000000",
      primarycurrencyout: "0.00000000",
      preconvertedout: "0.00000000",
      primarycurrencyfees: "0.00000000",
      primarycurrencyconversionfees: "0.00000000",
      currencies: {
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
          reservein: "0.00000000",
          primarycurrencyin: "0.00000000",
          reserveout: "0.00000000",
          lastconversionprice: "0.00000299",
          viaconversionprice: "0.00000000",
          fees: "0.00000000",
          priorweights: "0.00000000",
          conversionfees: "0.00000000",
        },
        iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD: {
          reservein: "0.00000000",
          primarycurrencyin: "0.00000000",
          reserveout: "0.00000000",
          lastconversionprice: "0.00000300",
          viaconversionprice: "0.00000000",
          fees: "0.00000000",
          priorweights: "0.00000000",
          conversionfees: "0.00000000",
        },
        iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm: {
          reservein: "0.00000000",
          primarycurrencyin: "0.00000000",
          reserveout: "0.00000000",
          lastconversionprice: "0.00000300",
          viaconversionprice: "0.00000000",
          fees: "0.00000000",
          priorweights: "0.00000000",
          conversionfees: "0.00000000",
        },
      },
    },
  },
  proofroots: [
    {
      version: 1,
      type: 2,
      systemid: "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm",
      height: 7833571,
      stateroot: "b8c826d3b5bee9f92320c8f4e9bdf8bf69c4a26e1df19d044e3ac235b907663b",
      blockhash: "0ce90083129fadab7466e7d0d03f4422cad0e3d3242ab8a498cb72e38be7add1",
      power: "0000000000000000000000000000000000000000000000000000000000a4a470",
      gasprice: "0.00000000",
    },
    {
      version: 1,
      type: 1,
      systemid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      height: 289,
      stateroot: "af073e925d82fdc8a9a7755e44f32bf2a400319da31ddae45e53f58c2ada1a43",
      blockhash: "7f3b6216d314de700e11d9889ecf9952ccd124e62f54941e0d10b280f17fff34",
      power: "000000000000000000b207df7b8d4893000000000000000000000001b95ee556",
    },
  ],
  nodes: [
  ],
}

//serializeNotarization(test2);

//serializeNotarization(check4);

const check3 = "0x01810c0414b26820ee0c9b1276aac834cf457026a575dfce8467460c2f56774ed27eeb8685f29f6cec0b090b000100300067460c2f56774ed27eeb8685f29f6cec0b090b0001a6ef9ea235635e328124ff3429db9f9e91b64e2d0100000000011027000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000001000000000000000001000000000000000001000000000000000001000000000000000001000000000000000001000000000100000000000000002f24770037401e3733843b2581d8043db79db4a2e427aeeec6d0a3e25fa9ac1cc970e67d0100000000000000000000000000000000000000000000000000000000000000000000001f24770002a6ef9ea235635e328124ff3429db9f9e91b64e2d01001000a6ef9ea235635e328124ff3429db9f9e91b64e2d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffece948b8a38bbcc813411d2597f7f8485a068901000300ffece948b8a38bbcc813411d2597f7f8485a068903a6ef9ea235635e328124ff3429db9f9e91b64e2df0a1263056c30e221f0f851c36b767fff2544f7f67460c2f56774ed27eeb8685f29f6cec0b090b000356a0fc0155a0fc0155a0fc010300000000000000000000000000000000000000000000000095ddb082e7ff000095ddb082e7ff000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000032b010000000000002c010000000000002c01000000000000030000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000003000000000000000000000000030000000000000000000000000000000000000000000000000267460c2f56774ed27eeb8685f29f6cec0b090b000100020067460c2f56774ed27eeb8685f29f6cec0b090b002f2477000781af8127d27739ff1765916f2843b42944a5a51e8c649f887377ce8a99be968e5ab2b7f8ff8ebbb014e11bc591c3fe3a48d7abdcb78ccb42be4d60a2b2b2b370a4a400000000000000000000000000000000000000000000000000000000000000000000000000a6ef9ea235635e328124ff3429db9f9e91b64e2d01000100a6ef9ea235635e328124ff3429db9f9e91b64e2d36010000f1650b40a57f897f41f17a5190b548c75f9e02015dba065309b9093be05bbd2f9ca97cab533333754d94babca0fe5a2718720dbea43f3955270ac26adc0df8fbf5bc72ce010000000000000000000000638b3edbe3fd4601000000000000000000"

//deserializeNotarization(check3);