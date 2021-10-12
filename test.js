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
const verusSerializerAbi = require('./abi/VerusSerializer.json');

const verusCCE= new web3.eth.Contract(verusCCEAbi, "0x17Bf6Ee022863f8B56b6Facd215dFcf107F2f9CA");
const verusSerialiser= new web3.eth.Contract(verusSerializerAbi.abi, "0x86cA0e322d402124F8efD4dE76af5D44eeF4206d");
let account = web3.eth.accounts.privateKeyToAccount("0x4d1c89a63e8134fcbb1c8622d24ddd77029f28ae99357e2b25ed4fd839208ba5");
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true

testSerializer = async () => {
    
  let test = [{"version":"1","currencyvalue":{"currency":"0x67460C2f56774eD27EeB8685f29f6CEC0B090B00","amount":"89990000"},"flags":"65","feecurrencyid":"0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d","fees":"20000000","destination":{"destinationtype":"4","destinationaddress":"0xb26820ee0c9b1276aac834cf457026a575dfce84"},"destcurrencyid":"0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d","destsystemid":"0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d","secondreserveid":"0x0000000000000000000000000000000000000000"}];

  let testSerializer = await verusCCE.methods.generateCCE(test).send({from: account.address,gas: maxGas});;
  
  let testSerializer2 = await verusSerialiser.methods.serializeCCrossChainExport(testSerializer.events.test1.returnValues.ted).call();

  console.log(testSerializer.events.test1.returnValues.ted);
   
}

testSerializer();

const test = async () => {
  let exportcce = await verusBridge.methods.SerializedCCEs(0).call(); //
  let txid1 = await verusBridge.methods.readyExportHashes(0).call();
  let txid2 = await verusBridge.methods._readyExports(0,0).call();
  let txid3 = await verusBridge.methods._readyExports(0,1).call();
  //let txid2 = await verusBridge.methods.readyExportHashes(1).call();
  console.log(exportcce)
  let constantbuf = Buffer.from("0100020067460c2f56774ed27eeb8685f29f6cec0b090b0083bf9f0383bf9f03a6ef9ea235635e328124ff3429db9f9e91b64e2da6ef9ea235635e328124ff3429db9f9e91b64e2d010000000267460c2f56774ed27eeb8685f29f6cec0b090b0070235d0500000000a6ef9ea235635e328124ff3429db9f9e91b64e2d002d31010000000001a6ef9ea235635e328124ff3429db9f9e91b64e2d002d3101000000001002165e540d3a2c64d6228a52300555d8f27f74085f5e67d9d6188739e3334d01000000000000000000000000000000000000000000000000000000000414b26820ee0c9b1276aac834cf457026a575dfce8401000000000000000000000000000000000000000000000000000000000000000000000000",'hex');
  let hash2 = keccak256(constantbuf);
  let blankbuffer = Buffer.alloc(32);
  let buff = Buffer.from(exportcce.slice(2),'hex')
  let hash = keccak256(Buffer.concat([buff,blankbuffer]));
}
test();