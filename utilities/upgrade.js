const Web3 = require('web3');
const { addHexPrefix } = require('ethereumjs-util');
const confFile = require('../confFile.js')
const { randomBytes } = require('crypto')
const upgradeContracts = (process.argv.indexOf('-contracts') > -1);
const revoke = (process.argv.indexOf('-revoke') > -1);
const recover = (process.argv.indexOf('-recover') > -1);

const util = require('../utils.js');
const axios = require('axios');
const TYPE_CONTRACT = 1;
const TYPE_REVOKE = 2;
const TYPE_RECOVER = 3;


axios.defaults.withCredentials = true;

const vrsctest = axios.create({
    baseURL: "http://localhost:25779/", //process.env.VRSCTEST_RPC_URL,
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
const { exit } = require('process');

const verusUpgrade = new web3.eth.Contract(verusUpgradeAbi, "0xA9c4A0615b5E0Ed9F18933bcB7d9efcE11befB25");

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
        let randomBuf = randomBytes(32);
        const verusNotariserIDSHEX = ["0xb26820ee0c9b1276aac834cf457026a575dfce84", "0x51f9f5f053ce16cb7ca070f5c68a1cb0616ba624", "0x65374d6a8b853a5f61070ad7d774ee54621f9638"];
        const verusNotarizerIDs = ["RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i", "RLXCv2dQPB4NPqKUweFx4Ua5ZRPFfN2F6D" ,"REXBEDfAz9eJMCxdexa5GnWQBAax8hwuiu"]
        
        // Choose notarizer to sign upgrade
        let notarizerID = verusNotariserIDSHEX[0];
        const signatureAddress = verusNotarizerIDs[0];

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_CONTRACT);

        let contractsHex = Buffer.from('');

        let contracts = [];
        // Get the list of current active contracts
        for (let i = 0; i < 12; i++) 
        {
            contracts.push(await verusUpgrade.methods.contracts(i).call());
        }

         //replace existing contract with new contract address
        contracts[ContractType.VerusNotarizer] = "0x7b8a6b1394eFFB11E97b656358235EEF8A417252"; 

        for (let i = 0; i < 12; i++) 
        {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].substr(2, 40), 'hex')]);
        }

        let serialized = Buffer.concat([contractsHex, outBuffer, randomBuf]);

        const signature = await getSig([signatureAddress, serialized.toString('Hex')])
        const buffer = Buffer.from(signature, 'base64');

        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex')); 
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex')); 

        let submission = { _vs: vVal, _rs: rVal, _ss: sVal, contracts, upgradeType: TYPE_CONTRACT , salt: "0x" + randomBuf.toString('Hex'), notarizerID };
        
        const revv1 = await verusUpgrade.methods.upgradeContracts(submission).call();
        const revv2 = await verusUpgrade.methods.upgradeContracts(submission).send({ from: account.address, gas: maxGas });

        console.log("\nsignature: ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const revokeID = async() => {
    try {

        let randomBuf = randomBytes(32);
        const verusNotariserIDSHEX = ["0xb26820ee0c9b1276aac834cf457026a575dfce84", "0x51f9f5f053ce16cb7ca070f5c68a1cb0616ba624", "0x65374d6a8b853a5f61070ad7d774ee54621f9638"];
        const verusNotarizerIDs = ["RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i", "RLXCv2dQPB4NPqKUweFx4Ua5ZRPFfN2F6D" ,"REXBEDfAz9eJMCxdexa5GnWQBAax8hwuiu"]
        
        // Notary to revoke
        const signatureAddress = verusNotarizerIDs[0]; 
        let notaryID = verusNotariserIDSHEX[0];

        const signature = await getSig([signatureAddress, randomBuf.toString('Hex').toLowerCase()])
        const buffer = Buffer.from(signature, 'base64');

        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex'));
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex'));

        let submission = {};

        submission = { _vs: vVal, _rs: rVal, _ss: sVal, notaryID, salt: "0x" + randomBuf.toString('Hex') };

        const revv1 = await verusUpgrade.methods.revoke(submission).call();
        const revv2 = await verusUpgrade.methods.revoke(submission).send({ from: account.address, gas: maxGas });

        console.log("\nsignature: ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const recoverID = async() => {
    try {

        let randomBuf = randomBytes(32);
        const verusNotariserIDSHEX = ["0xb26820ee0c9b1276aac834cf457026a575dfce84", "0x51f9f5f053ce16cb7ca070f5c68a1cb0616ba624", "0x65374d6a8b853a5f61070ad7d774ee54621f9638"];
        const verusNotarizerIDs = ["RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i", "RLXCv2dQPB4NPqKUweFx4Ua5ZRPFfN2F6D" ,"REXBEDfAz9eJMCxdexa5GnWQBAax8hwuiu"]
        
        //ID being recovered id, spend address & cold storage address
        let recoverNotaryAddresses = ["0xb26820ee0c9b1276aac834cf457026a575dfce84","0xD010dEBcBf4183188B00cafd8902e34a2C1E9f41","0xD010dEBcBf4183188B00cafd8902e34a2C1E9f41"];
        
        // Notarizer perfroming recover
        const signatureAddress = verusNotarizerIDs[2] 
        let notarizerID = verusNotariserIDSHEX[2]; 

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_RECOVER);

        let serialized = Buffer.from('');
        serialized = Buffer.concat([Buffer.from(util.removeHexLeader(recoverNotaryAddresses[0]), "Hex"),
            Buffer.from(util.removeHexLeader(recoverNotaryAddresses[1]), "Hex"), 
            Buffer.from(util.removeHexLeader(recoverNotaryAddresses[2]), "Hex"), 
            outBuffer,
            randomBuf ])

        const signature = await getSig([signatureAddress, serialized.toString('Hex').toLowerCase()])
        const buffer = Buffer.from(signature, 'base64');
        const bufString = buffer.toString('hex');
        
        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex'));
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex')); 

        let submission = {};

        submission = { _vs: vVal, _rs: rVal, _ss: sVal, contracts: recoverNotaryAddresses, upgradeType: TYPE_RECOVER, salt: "0x" + randomBuf.toString('Hex'), notarizerID };

        const revv1 = await verusUpgrade.methods.recover(submission).call();
        const revv2 = await verusUpgrade.methods.recover(submission).send({ from: account.address, gas: maxGas });

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
    revokeID();
}
else if(recover)
{
    recoverID();
}
else
{
    console.log("Please use the flags -contacts, -revoke or -recover");
    exit(0);
}