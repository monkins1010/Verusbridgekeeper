const Web3 = require('web3');

const confFile = require('../confFile.js')


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

//const verusBridgeAbi = require('../abi/VerusBridge.json');
//const exportmanagerAbi = require('../abi/ExportManager.json');
const CrossChainAbi = require('../abi/VerusCrossChainExport.json');
const VerusSerializerAbi = require('../abi/VerusSerializer.json');


//const verusBridge = new web3.eth.Contract(verusBridgeAbi.abi, "0xaeC03f0DE4809b5EedFA4F0615068460f2EB4861");

//const ExportManager = new web3.eth.Contract(exportmanagerAbi.abi, "0x93968d1E8892E2dC9C7396040d04cD76D20099ba");

//const TokenManager = new web3.eth.Contract(tokenmanagerAbi.abi, "0xF7587c87Ed1b1183a3179228FB122e6116041f78");
const CrossChain = new web3.eth.Contract(CrossChainAbi.abi, "0x4436D404982825a52Ac284a8C5a718ed9045C172");
const VerusSerializer = new web3.eth.Contract(VerusSerializerAbi.abi, "0xCe3fD4653E8Ee16E4EF982005E1750cC34803a7d");

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;


const transaction = {
    "version": 1,
    "currencyvalue": {
        "currency": "0xf0a1263056c30e221f0f851c36b767fff2544f7f",
        "amount": "354100000000"
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

const cce1 = {
    version: '1',
    flags: '2',
    sourcesystemid: '0x67460C2f56774eD27EeB8685f29f6CEC0B090B00',
    hashtransfers: '0x73ac5b8950ccd56f7db9741c3fc83864af5a1ff8a6c711ca9c5af293f58d6cd4',
    sourceheightstart: '10418499',
    sourceheightend: '10418499',
    destinationsystemid: '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d',
    destinationcurrencyid: '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d',
    numinputs: '1',
    totalamounts: [{
            currency: '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d',
            amount: '2000000'
        },
        {
            currency: '0xF0A1263056c30E221F0F851C36b767ffF2544f7F',
            amount: '354100000000'
        }
    ],
    totalfees: [{
        currency: '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d',
        amount: '2000000'
    }],
    totalburned: [{
        currency: '0x0000000000000000000000000000000000000000',
        amount: '0'
    }],
    rewardaddress: {
        destinationtype: '4',
        destinationaddress: '0xb26820ee0c9b1276aac834cf457026a575dfce84'
    },
    firstinput: '1'
}

const VALID = 1
const CONVERT = 2
const PRECONVERT = 4
const CROSS_SYSTEM = 0x40 // if this is set there is a systemID serialized and deserialized as well for destination
const IMPORT_TO_SOURCE = 0x200 // set when the source currency not destination is the import currency
const RESERVE_TO_RESERVE = 0x400 // for arbitrage or transient conversion 2 stage solving (2nd from new fractional to reserves)
const ETH_FEE_SATS = 300000; //0.003 ETH FEE
const ETH_FEE = "0.003"; //0.003 ETH FEE

const testfunc1 = async() => {
    try {
        //  const INVALID_FLAGS = 0xffffffff - (VALID + CONVERT + CROSS_SYSTEM + RESERVE_TO_RESERVE + IMPORT_TO_SOURCE);
        //  const result = 1091 & INVALID_FLAGS;
        //  const revv = await ExportManager.methods.checkExport(transaction, "3000000000000000").call(); //send({from: account.address, gas: maxGas});
        //  const result2 = await TokenManager.methods.getTokenList().call();
        const res1 = await CrossChain.methods.generateCCE([transaction], false).call();
        const res2 = await VerusSerializer.methods.serializeCCrossChainExport(cce1).call();
        console.log("\n\n", res1);
        console.log("\n\n", res2);
    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

testfunc1();

/*
[1, "0xf0a1263056c30e221f0f851c36b767fff2544f7f", "1000000000", 1,
    "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d", 20000000, 2,
    "0x55f51a22c79018a00ced41e758560f5df7d4d35d",
    "0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d",
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000"
]*/