const Web3 = require('web3');

const confFile = require('./confFile.js')
var constants = require('./constants');
const { keccak256, addHexPrefix } = require('ethereumjs-util');
require('./utils.js')();
require('./deserializer.js')();

const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST" ;



let maxGas = 6000000;

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws/v3/46789909a2fe4985bbb866f2878f940c", {
    clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
  }
}));

const verusCCEAbi = require('./abi/VerusCCE.json');

const verusCCE= new web3.eth.Contract(verusCCEAbi, "0x17Bf6Ee022863f8B56b6Facd215dFcf107F2f9CA");
let account = web3.eth.accounts.privateKeyToAccount("0x4d1c89a63e8134fcbb1c8622d24ddd77029f28ae99357e2b25ed4fd839208ba5");
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true

testSerializer = async () => {
    
  let test = [{"version":"1","currencyvalue":{"currency":"0xF0A1263056c30E221F0F851C36b767ffF2544f7F","amount":"2000000000"},"flags":"65","feecurrencyid":"0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d","fees":"2000000","destination":{"destinationtype":"4","destinationaddress":"0xB26820ee0C9b1276Aac834Cf457026a575dfCe84"},"destcurrencyid":"0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d","destsystemid":"0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d","secondreserveid":"0x0000000000000000000000000000000000000000"}];

  let testSerializer = await verusCCE.methods.generateCCE(test).send({from: account.address,gas: maxGas});;
  


  console.log(testSerializer.events.test1.returnValues.ted);
   
}

testSerializer();