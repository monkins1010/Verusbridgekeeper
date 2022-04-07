const Web3 = require('web3');

const confFile = require('../confFile.js')
var constants = require('../constants');


const ticker = process.argv.indexOf('-production') > -1 ? "VRSC" : "VRSCTEST";

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

const verusBridgeAbi = require('../abi/VerusBridgeMaster.json');
const verusBridge = new web3.eth.Contract(verusBridgeAbi, "0xa5706789ceDcb7C884eE0c6fe593F0f83B9f8B5c");

const ERC20Abi = require('../abi/ERC20.json');
const erctoken = new web3.eth.Contract(ERC20Abi, "0x98339D8C260052B7ad81c28c16C0b98420f2B46a"); //goerli erc20 of usdc

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;

const transfers1 = {
   "version": 1,
   "currencyvalue": {
       "currency": "0xF0A1263056c30E221F0F851C36b767ffF2544f7F",
       "amount": 100000000
   },
   "flags": 1,
   "feecurrencyid": "0x67460C2f56774eD27EeB8685f29f6CEC0B090B00",
   "fees": 300000,
   "destination": {
       "destinationtype": 2,
       "destinationaddress": "0x55f51a22c79018a00ced41e758560f5df7d4d35d"
   },
   "destcurrencyid": "0xffece948b8a38bbcc813411d2597f7f8485a0689",
   "destsystemid": "0x0000000000000000000000000000000000000000",
   "secondreserveid": "0x0000000000000000000000000000000000000000"
};

const ETH_FEES = "0.003"

const testfunc1 = async() => {
    try {
    let USDCTOSEND = 100000000
      const approved = await erctoken.methods.approve("0xF354E111BA40Bb7a7d573c484E0E45D258620848","1000000000000").send({ from: account.address, gas: maxGas}); //approve bridgestorage 100000usd
      let nonce = await web3.eth.getTransactionCount(account.address); 
      const fee = web3.utils.toWei(ETH_FEES, 'ether');
      let promises =  [];
        for (let i = 0; i< 100; i++)
        {
            transfers1.currencyvalue.amount = (USDCTOSEND + (i*100000000)).toString();
            promises.push(verusBridge.methods.export(transfers1).send({ from: account.address, gas: maxGas, value:  fee, nonce: nonce++, }));
        }

       return  Promise.all(promises);

       // console.log("\nserializedtxs: ", submit);
        // console.log("\nprocessTransactions: ", revv5);

    } catch (e) {
        console.log(e);
    }
    
}

const run = async()  => {

    const ret = await testfunc1();
    console.log("fifnished",ret);

}

run();