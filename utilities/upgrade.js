const Web3 = require('web3');
const { addHexPrefix } = require('../utils');
const confFile = require('../confFile.js')
const { randomBytes } = require('crypto')
const upgradeContracts = (process.argv.indexOf('-contracts') > -1);
const revoke = (process.argv.indexOf('-revoke') > -1);
const recover = (process.argv.indexOf('-recover') > -1);
const getContractHash = (process.argv.indexOf('-getcontracthash') > -1);
const util = require('../utils.js');
const axios = require('axios');
const TYPE_CONTRACT = 1;
const TYPE_REVOKE = 2;
const TYPE_RECOVER = 3;
const abi = new Web3().eth.abi

axios.defaults.withCredentials = true;

const vrsctest = axios.create({
    baseURL: "http://localhost:25779/", //process.env.VRSCTEST_RPC_URL,
    auth: {
        username: "user", //process.env.VRSCTEST_RPC_USER || '',
        password: "password", // process.env.VRSCTEST_RPC_PASSWORD || '',
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
    CreateExport: 5,
    VerusNotaryTools: 6,
    ExportManager: 7,
    SubmitImports: 8,
    NotarizationSerializer: 9,
    UpgradeManager: 10
}

const verusDelegatorAbi = require('../abi/VerusDelegator.json');

const { exit } = require('process');

const delegatorContract = new web3.eth.Contract(verusDelegatorAbi, "0x20818Abe8588862Fd10332AB12C4B2D4b3829c08");

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;

const getSig = async(sigParams) => {
    return await verusClient["vrsctest"].post("http://localhost:25779/", {
        jsonrpc: '2.0',
        method: 'signmessage',
        params: [
            sigParams[0],
            sigParams[1]
        ]
    }).then(result => {
        console.log(result.data.result);
        return result.data.result.signature;
    }).catch((e) => {
        console.log(e);
    })
}

function exitUpgradeError() {

    const key = Object.keys(ContractType);
    let list = "";
    for (const item of key) {
        list += item + " : " + ContractType[item] + "\n";
    }
    console.log("List of contractypes:\n" + list);
    exit(0);
}

function getContractAddress() {
    const flag = '-contractaddress';
    const index = process.argv.indexOf(flag);
  
    if (index !== -1 && process.argv.length > index + 1) {
      return process.argv[index + 1];
    } else {
        return null;
    }

}

function getContractType() {
    const flag = '-contracttype';
    const index = process.argv.indexOf(flag);
  
    if (index !== -1 && process.argv.length > index + 1) {
      return process.argv[index + 1];
    } else {
        return null;
    }

}


const createContractTuple = (contracts, salt) => {

    let package = ["0", "0x0000000000000000000000000000000000000000000000000000000000000000", 
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    contracts, TYPE_CONTRACT, salt, "0x0000000000000000000000000000000000000000", 0];
    
    let data = abi.encodeParameter(
        'tuple(uint8,bytes32,bytes32,address[],uint8,bytes32,address,uint32)',
        package);
    
    return data;
}

const updatecontract = async() => {
    try {
        let randomBuf = randomBytes(32);

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_CONTRACT);

        let contractsHex = Buffer.from('');

        let contracts = [];
        // Get the list of current active contracts
        for (let i = 0; i < 11; i++) 
        {
            contracts.push(await delegatorContract.methods.contracts(i).call());
        }

         //replace existing contract with new contract address
        contracts[ContractType.UpgradeManager] = "0xFe1B47e4cc3A424ff04E58A409Aea3189383a20C"; 

        for (let i = 0; i < 11; i++) 
        {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].slice(2), 'hex')]);
        }

        let serialized = Buffer.concat([contractsHex, outBuffer, randomBuf]);

        let hashedContractPackage =  web3.utils.keccak256(serialized);

        let contractTuple = createContractTuple(contracts, `0x${randomBuf.toString('hex')}`)

        const revv1 = await delegatorContract.methods.upgradeContracts(contractTuple).call();
        console.log("Call replied with: " + revv1 + "\n 1: Contract Upgrade complete. Please wait....");
        const revv2 = await delegatorContract.methods.upgradeContracts(contractTuple).send({ from: account.address, gas: maxGas });

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const createContractUpdateAddress = async() => {
    try {
        let randomBuf = randomBytes(32);

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_CONTRACT);

        let contractsHex = Buffer.from('');

        let contracts = [];
        // Get the list of current active contracts
        for (let i = 0; i < 11; i++) 
        {
            contracts.push(await delegatorContract.methods.contracts(i).call());
        }
        const newContract = getContractAddress();
        const newContractType = getContractType();

        if (!newContract || !newContractType) {
            return false;
        }
         //replace existing contract with new contract address
        contracts[newContractType] = newContract; 

        for (let i = 0; i < 11; i++) 
        {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].slice(2), 'hex')]);
        }

        let serialized = Buffer.concat([contractsHex, outBuffer, randomBuf]);

        let hashedContractPackage =  web3.utils.keccak256(serialized);
        const key = Object.keys(ContractType);
        console.log("\nNew Ethereum contract: " + newContract + " Type: " + key[newContractType] + "\nSalt used: 0x" + randomBuf.toString('hex') + "\nHash for upgrade: 0x" + hashedContractPackage.toString().slice(26,66))

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

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_REVOKE);

        randomBuf = Buffer.concat([outBuffer, randomBuf]);

        const signature = await getSig([signatureAddress, randomBuf.toString('Hex').toLowerCase()])
        const buffer = Buffer.from(signature, 'base64');

        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex'));
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex'));

        let submission = {};

        submission = { _vs: vVal, _rs: rVal, _ss: sVal, notaryID, salt: "0x" + randomBuf.toString('Hex') };

        const revv1 = await verusNotarizer.methods.revoke(submission).call();
        const revv2 = await verusNotarizer.methods.revoke(submission).send({ from: account.address, gas: maxGas });

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
        
        //ID being recovered spend address & cold storage address
        let recoverNotaryAddresses = ["0xD010dEBcBf4183188B00cafd8902e34a2C1E9f41","0xD010dEBcBf4183188B00cafd8902e34a2C1E9f41"];
        
        // Notarizer perfroming recover
        const signatureAddress = verusNotarizerIDs[0] 
        let notarizerID = verusNotariserIDSHEX[0]; 

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_RECOVER);

        let serialized = Buffer.from('');
        serialized = Buffer.concat([
            Buffer.from(util.removeHexLeader(recoverNotaryAddresses[0]), "Hex"), 
            Buffer.from(util.removeHexLeader(recoverNotaryAddresses[1]), "Hex"), 
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

        const revv1 = await verusNotarizer.methods.recover(submission).call();
        const revv2 = await verusNotarizer.methods.recover(submission).send({ from: account.address, gas: maxGas });

        console.log("\nsignature: ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const main = async ()=> {

    let success = false;
   if(revoke)
        {
            success = await revokeID();
        }
        else if(recover)
        {
            success = await recoverID();
        }
        else if(getContractHash){
            success = await createContractUpdateAddress();
        }

        if(!success) {
            console.log("Please use the flags -contracts, -revoke , -recover, or -getcontracthash");
            console.log("To get the contract hash run:\n\nnode upgrade.js -getcontracthash -contracttype 1 -contractaddress 0x1234567890\n");
            exitUpgradeError();
        }
}

main();