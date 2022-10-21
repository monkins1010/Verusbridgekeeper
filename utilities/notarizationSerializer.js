const util = require('../utils.js');
const bitGoUTXO = require('bitgo-utxo-lib');
var constants = require('../constants');

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

    encodedOutput.writeUInt16LE(currencyState.version);

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

        encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check((keys[0]), 160).hash]);
        encodedOutput = Buffer.concat([encodedOutput, serializeCoinbaseCurrencyState(items[keys[0]])]);

    }
    return encodedOutput;
}

function serializeCProofRootArray (proof) {

    let encodedOutput = Buffer.from(util.writeCompactSize(proof.length));

    for (const item of proof) {
        encodedOutput = Buffer.concat([encodedOutput, bitGoUTXO.address.fromBase58Check((item.systemid), 160).hash]);
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

exports.serializeNotarization = serializeNotarization;

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


//serializeNotarization(test1);

//serializeNotarization(test2);