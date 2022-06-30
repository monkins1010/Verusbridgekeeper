const Web3 = require('web3');
const { addHexPrefix } = require('ethereumjs-util');
const confFile = require('../confFile.js')
const { randomBytes } = require('crypto')
const upgradeContracts = (process.argv.indexOf('-contracts') > -1);
const revoke = (process.argv.indexOf('-revoke') > -1);
const recover = (process.argv.indexOf('-recover') > -1);

//const VerusClient = require('./config.js')
const axios = require('axios');
const TYPE_CONTRACT = 1;
const TYPE_REVOKE = 2;
const TYPE_RECOVER = 3;


axios.defaults.withCredentials = true;

const vrsctest = axios.create({
    baseURL: "http://localhost:43477/", //process.env.VRSCTEST_RPC_URL,
    auth: {
        username: "user3920459605", //process.env.VRSCTEST_RPC_USER || '',
        password: "pass7d37f4a970807bc7f65b511a04e6ff5d0763544283a253faecdeae6d522bdf6917", // process.env.VRSCTEST_RPC_PASSWORD || '',
    }
});

const verusClient = {
    vrsctest,
    // add more verus pbaas chain clients here
}

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

const ContractType = {
    TokenManager: 0,
    VerusSerializer: 1,
    VerusProof: 2,
    VerusCrossChainExport: 3,
    VerusNotarizer: 4,
    VerusBridge: 5,
    VerusInfo: 6,
    ExportManager: 7,
    VerusBridgeStorage: 8,
    VerusNotarizerStorage: 9,
    VerusBridgeMaster: 10,
    LastIndex: 11
}

const verusUpgradeAbi = require('../abi/VerusUpgrade.json');

const verusUpgrade = new web3.eth.Contract(verusUpgradeAbi, "0xB47ba516B0dF05b472Ab9d69f1dB64108E39c55A");

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;


const getSig = async(sigParams) => {
    return await verusClient["vrsctest"].post('', {
        jsonrpc: '2.0',
        method: 'signmessage',
        params: [
            sigParams[0],
            sigParams[1]
        ]
    }).then(result => {
        console.log(result.data.result);
        return result.data.result.signature;
    })

}

const updatecontract = async() => {
    try {

        let contracts = [];
        for (let i = 0; i < 12; i++) 
        {
            contracts.push(await verusUpgrade.methods.contracts(i).call());
        }

        let contractsHex = new Buffer('');
        for (let i = 0; i < 12; i++) 
        {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].substr(2, 40), 'hex')]);
        }

        contracts[ContractType.VerusNotarizer] = "0x2197B31f015Df511f0b0315d98EEE21Bd9dfc0c4"; //new contract address from remixd

        for (let i = 0; i < 12; i++) 
        {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].substr(2, 40), 'hex')]);
        }

        const signatureAddress = "RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i";
        const signature = await getSig([signatureAddress, contractsHex.toString('Hex')])
        const buffer = Buffer.from(signature, 'base64');
        const bufString = buffer.toString('hex');
        
        const signatureHex = "0x454545"; //  Buffer.from(signature, 'base64');
        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal =  addHexPrefix(buffer.slice(1, 33).toString('Hex')); //"0x019303cdd05b16c507d64489d336b2f94e15b13fc84d9407d4580b37d622ac1f"; 
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex')); //"0x019303cdd05b16c507d64489d336b2f94e15b13fc84d9407d4580b37d622ac1f"; 

        let submission = [];

        let NotartyID = "0xb26820ee0c9b1276aac834cf457026a575dfce84";
        for (let i = 0; i < 3; i++) 
        {
            submission.push({ _vs: vVal, _rs: addHexPrefix(rVal.toString('Hex')), _ss: addHexPrefix(sVal.toString('Hex')), contracts, notaryAddress: NotartyID })
        }

        const revv2 = await verusUpgrade.methods.upgradeContracts(submission).send({ from: account.address, gas: maxGas });

        console.log("\nsignature: ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const revokeContract = async() => {
    try {

        let contracts = [];
        for (let i = 0; i < 12; i++) 
        {
            contracts.push(await verusUpgrade.methods.contracts(i).call());
        }
        let randomBuf = randomBytes(32);
        let contractsHex = Buffer.from([TYPE_REVOKE]);
        contractsHex = Buffer.concat([contractsHex, randomBuf]);

        const signatureAddress = "RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i" //"RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i";//RLXCv2dQPB4NPqKUweFx4Ua5ZRPFfN2F6D "REXBEDfAz9eJMCxdexa5GnWQBAax8hwuiu"
        const signature = await getSig([signatureAddress, contractsHex.toString('Hex').toLowerCase()])
        const buffer = Buffer.from(signature, 'base64');
        const bufString = buffer.toString('hex');
        
        const signatureHex = "0x454545"; //  Buffer.from(signature, 'base64');
        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex')); //"0x019303cdd05b16c507d64489d336b2f94e15b13fc84d9407d4580b37d622ac1f"; 
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex')); //"0x019303cdd05b16c507d64489d336b2f94e15b13fc84d9407d4580b37d622ac1f"; 

        let submission = {};

        let NotartyID = "0xb26820ee0c9b1276aac834cf457026a575dfce84";
      //  randomBuf = randomBytes(32); //remove 

        submission = { _vs: vVal, _rs: rVal, _ss: sVal, contracts, upgradeType: TYPE_REVOKE , recoverHeight: 1 , salt: "0x" + randomBuf.toString('Hex') };

        const revv1 = await verusUpgrade.methods.revoke(submission).call();
        const revv2 = await verusUpgrade.methods.revoke(submission).send({ from: account.address, gas: maxGas });

        console.log("\nsignature: ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

if(upgradeContracts)
{
    updatecontract();
}
else if(revoke)
{
    revokeContract();
}
else if(recover)
{

}