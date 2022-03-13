const Web3 = require('web3');

const confFile = require('../confFile.js')
var constants = require('../constants');

require('../utils.js')();
require('../deserializer.js')();
const util = require('util');

const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST" ;

const settings = confFile.loadConfFile(ticker);

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

const verusBridgeAbi = require('../abi/VerusBridge.json');
const exportmanagerAbi = require('../abi/ExportManager.json');
const tokenmanagerAbi = require('../abi/TokenManager.json');

const verusBridge = new web3.eth.Contract(verusBridgeAbi.abi, "0xaeC03f0DE4809b5EedFA4F0615068460f2EB4861");

const ExportManager = new web3.eth.Contract(exportmanagerAbi.abi, "0x93968d1E8892E2dC9C7396040d04cD76D20099ba");

const TokenManager = new web3.eth.Contract(tokenmanagerAbi.abi, "0xF7587c87Ed1b1183a3179228FB122e6116041f78");

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;


const transaction = {
  "version": 1,
  "currencyvalue": {
    "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
    "amount": "100000000000"
  },
  "flags": 1,
  "feecurrencyid": "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d",
  "fees": 2000000,
  "destination": {
    "destinationtype": 2,
    "destinationaddress": "0x55f51a22c79018a00ced41e758560f5df7d4d35d"
  },
  "destcurrencyid": "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d",
  "destsystemid": "0x0000000000000000000000000000000000000000",
  "secondreserveid": "0x0000000000000000000000000000000000000000"
}
const  VALID = 1
const  CONVERT = 2
const  PRECONVERT = 4
const  CROSS_SYSTEM = 0x40                // if this is set there is a systemID serialized and deserialized as well for destination
const  IMPORT_TO_SOURCE = 0x200           // set when the source currency not destination is the import currency
const  RESERVE_TO_RESERVE = 0x400         // for arbitrage or transient conversion 2 stage solving (2nd from new fractional to reserves)
const  ETH_FEE_SATS = 300000; //0.003 ETH FEE
const  ETH_FEE = "0.003"; //0.003 ETH FEE

  const testfunc1 = async () =>{
      try{
    const INVALID_FLAGS = 0xffffffff - (VALID + CONVERT + CROSS_SYSTEM + RESERVE_TO_RESERVE + IMPORT_TO_SOURCE);
    const result = 1091 & INVALID_FLAGS;
    const revv = await ExportManager.methods.checkExport(transaction, "3000000000000000").call(); //send({from: account.address, gas: maxGas});
    const result2 = await TokenManager.methods.getTokenList().call();
    console.log("\n\n",revv);
    console.log("\n\n",result2);
      }catch(e){
        console.log(e);

      }
    process.exit(0);
    }
    
    testfunc1();

    [1 ,"0xf0a1263056c30e221f0f851c36b767fff2544f7f", "1000000000", 1,
    "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d", 20000000, 2,
    "0x55f51a22c79018a00ced41e758560f5df7d4d35d",
     "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000"
  ]
