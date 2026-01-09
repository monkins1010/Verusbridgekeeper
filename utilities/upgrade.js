const Web3 = require('web3');
const { addHexPrefix } = require('../utils');
const confFile = require('../confFile.js')
const { randomBytes } = require('crypto')
const bitGoUTXO = require('bitgo-utxo-lib');
const upgradeContracts = (process.argv.indexOf('-upgradecontracts') > -1);
const revoke = (process.argv.indexOf('-revoke') > -1);
const recover = (process.argv.indexOf('-recover') > -1);
const recovermultisig = (process.argv.indexOf('-recovermultisig') > -1);
const revokemultisig = (process.argv.indexOf('-revokemultisig') > -1);
const getContractHash = (process.argv.indexOf('-getcontracthash') > -1);
const createrevokemultisigpacket = (process.argv.indexOf('-createmultisigrevoke') > -1);
const createrecovermultisigpacket = (process.argv.indexOf('-createmultisigrecover') > -1);
const countVotes = (process.argv.indexOf('-countvotes') > -1);
const util = require('../utils.js');
const axios = require('axios');
const TYPE_CONTRACT = 1;
const TYPE_REVOKE = 2;
const TYPE_RECOVER = 3;
const abi = new Web3().eth.abi
const ticker = process.argv.indexOf('-testnet') > -1 ? "VRSCTEST" : "VRSC";
const settings = confFile.loadConfFile(ticker);

function Ask(query) {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    })
  
    return  new Promise(resolve => readline.question(query, ans => {
    readline.close();
    resolve(ans);
  }))
  }
  

axios.defaults.withCredentials = true;

const daemonData = confFile.getVerusConf(ticker);

const vrsctest = axios.create({
    baseURL: daemonData ? `http://127.0.0.1:${daemonData.rpcport}` : 'http://127.0.0.1:25779',
    auth: {
        username: daemonData ? daemonData.rpcuser:  "user",
        password: daemonData ? daemonData.rpcpassword:  "password",
    }
});

const verusClient = {
    vrsctest,
    // add more verus pbaas chain clients here
}



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

const delegatorContract = new web3.eth.Contract(verusDelegatorAbi, settings.delegatorcontractaddress);

let account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);
web3.eth.handleRevert = true
const maxGas = 6000000;

const getSig = async(sigParams) => {
    return await verusClient["vrsctest"].post(daemonData ? `http://127.0.0.1:${daemonData.rpcport}` : 'http://127.0.0.1:25779', {
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

function getSalt() {
    const flag = '-salt';
    const index = process.argv.indexOf(flag);
  
    if (index !== -1 && process.argv.length > index + 1) {
      return process.argv[index + 1];
    } else {
        return null;
    }

}

async function getRecoverAddresses() {

    let upgradeData = []
    for (let i = 3; i < 7; i++) 
    {
        upgradeData.push(process.argv[i]);
    }

    const addressTypes = ["Notaries iaddress", "Notaries main spend ETH address", "Notaries recovery ETH address", "R-address of current recovery"]
      
    for (let i = 0; i < 4; i++) 
    {
        if (i == 0) {
        const mainiaddress = addHexPrefix(bitGoUTXO.address.fromBase58Check(upgradeData[i], 160).hash.toString('hex'));
        console.log(addressTypes[i] + ": " + upgradeData[0] + " -> " + mainiaddress);
        upgradeData[0] = mainiaddress;
        } else {
            console.log(addressTypes[i] + ": " + upgradeData[i]);
        }
    }
    
    var answer = await Ask('Please check the above details carefully, do you agree [y] or [n] then Enter: ');

    if (answer != "y") {
        process.exit(0);
    }

    return upgradeData;

}

const getRevokeWithMultisigAddresses = async() => { 

    let notaryRevoking = process.argv[3];
    let notaryToRevoke = process.argv[4];
    let signingRAddress = process.argv[5];

    const yourMainRevokingNotaryHexAddress = addHexPrefix(bitGoUTXO.address.fromBase58Check(notaryRevoking).hash.toString('hex'));
    const notaryToRevokeHexAddress = addHexPrefix(bitGoUTXO.address.fromBase58Check(notaryToRevoke).hash.toString('hex'));

    console.log("Your notary address: " + notaryRevoking + " -> " + yourMainRevokingNotaryHexAddress);
    console.log("Notary to revoke: " + notaryToRevoke + " -> " + notaryToRevokeHexAddress);
    console.log("Your notarizing primary address: " + signingRAddress);

    var answer = await Ask('Please check the above details carefully, do you agree [y] or [n] then Enter: ');

    if (answer != "y") {
        process.exit(0);
    }

    return [yourMainRevokingNotaryHexAddress, notaryToRevokeHexAddress, signingRAddress];
} 

const getRecoverWithMultisigAddresses = async() => { 

    let notaryrecovering = process.argv[3];
    let notaryTorecover = process.argv[4];
    let signingRAddress = process.argv[5];
    let notarymain = process.argv[6];
    let notaryrecover = process.argv[7];

    const yourMainrecoveringNotaryHexAddress = addHexPrefix(bitGoUTXO.address.fromBase58Check(notaryrecovering).hash.toString('hex'));
    const notaryTorecoverHexAddress = addHexPrefix(bitGoUTXO.address.fromBase58Check(notaryTorecover).hash.toString('hex'));

    console.log("Your notary address: " + notaryrecovering + " -> " + yourMainrecoveringNotaryHexAddress);
    console.log("Notary to recover: " + notaryTorecover + " -> " + notaryTorecoverHexAddress);
    console.log("Your notarizing recovery address: " + signingRAddress);
    console.log("New notaries main signing ETH address: " + notarymain);
    console.log("New notaries recover ETH address: " + notaryrecover);

    var answer = await Ask('Please check the above details carefully, do you agree [y] or [n] then Enter: ');

    if (answer != "y") {
        process.exit(0);
    }

    return [yourMainrecoveringNotaryHexAddress, notaryTorecoverHexAddress, signingRAddress, notarymain, notaryrecover];
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

const createRevokeMultisigTuple = (revokeData) => {

    let sigs = []

    for (let i = 0; i < revokeData.signatures.length; i++) {
        let sigstemp = []
        sigstemp.push(revokeData.signatures[i]._vs);
        sigstemp.push(revokeData.signatures[i]._rs);
        sigstemp.push(revokeData.signatures[i]._ss);
        sigstemp.push(revokeData.signatures[i].salt);
        sigstemp.push(revokeData.signatures[i].notarizerID);
        sigs.push(sigstemp);

    }

    let package = [sigs, revokeData.notarytorevoke];
    
    let data = abi.encodeParameters(
        ['tuple(uint8,bytes32,bytes32,bytes32,address)[]','address'],
        package);
    
    return data;
}

const createRecoverMultisigTuple = (revokeData) => {

    let sigs = []

    for (let i = 0; i < revokeData.signatures.length; i++) {
        let sigstemp = []
        sigstemp.push(revokeData.signatures[i]._vs);
        sigstemp.push(revokeData.signatures[i]._rs);
        sigstemp.push(revokeData.signatures[i]._ss);
        sigstemp.push(revokeData.signatures[i].salt);
        sigstemp.push(revokeData.signatures[i].notarizerID);
        sigs.push(sigstemp);

    }

    let package = [sigs, revokeData.notarytorecover, revokeData.notarynewmain, revokeData.notarynewrecover];
    
    let data = abi.encodeParameters(
        ['tuple(uint8,bytes32,bytes32,bytes32,address)[]','address','address','address'],
        package);
    
    return data;
}

const createRevokeTuple = (addresses, salt, signature) => {

    let package = [signature._vs, signature._rs, signature._ss,
                    [addresses[1],addresses[2]], TYPE_RECOVER, salt, addresses[0], 0];
    
    let data = abi.encodeParameter(
        'tuple(uint8,bytes32,bytes32,address[],uint8,bytes32,address,uint32)',
        package);
    
    return data;
}

const createUpgradeTuple = (addresses, salt, upgradetype) => {

    let package = [0, "0x00", "0x00",
                    addresses, upgradetype, salt, "0x0000000000000000000000000000000000000000", 0];
    
    let data = abi.encodeParameter(
        'tuple(uint8,bytes32,bytes32,address[],uint8,bytes32,address,uint32)',
        package);
    
    return data;
}

const createContractUpdateAddress = async() => {
    try {
        let randomBuf = Buffer.from("3cad78662d9223a011f414fcc2562d4b6ded2f84f4bf823d4de2d3ca44d525fa", 'hex');//randomBytes(32);

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

        //const revv1 = await delegatorContract.methods.revokeWithMainAddress("0xff").call();
        const revv2 = await delegatorContract.methods.revokeWithMainAddress("0xff").send({ from: account.address, gas: maxGas });

        console.log("\n Notary transaction succeeded please check on etherscan for confirmation");

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const recoverID = async() => {
    try {

        let randomBuf = randomBytes(32);
        let addresses = await getRecoverAddresses();
        // Notarizer perfroming recover
        const signatureAddress = addresses[3]; 

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_RECOVER);

        let serialized = Buffer.from('');
        serialized = Buffer.concat([
            Buffer.from(util.removeHexLeader(addresses[1]), "Hex"), 
            Buffer.from(util.removeHexLeader(addresses[2]), "Hex"), 
            outBuffer,
            randomBuf ])

        const signature = await getSig([signatureAddress, serialized.toString('Hex').toLowerCase()])
        const buffer = Buffer.from(signature, 'base64');
        
        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex'));
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex')); 

        let submission = {};

        submission = { _vs: vVal, _rs: rVal, _ss: sVal, contracts: [addresses[1], addresses[2]], upgradeType: TYPE_RECOVER, salt: "0x" + randomBuf.toString('Hex'), notarizerID: addresses[0] };
        var answer = await Ask('Here is the revoke information: \n' + JSON.stringify(submission, null, 2) + '\n press [y] or [n] to confirm then Enter: ');
        if (answer != "y") {
            process.exit(0);
        }

        const revokeTupleSerialized = createRevokeTuple(addresses, util.addHexPrefix(randomBuf.toString('Hex')), { _vs: vVal, _rs: rVal, _ss: sVal});

        const revv1 = await delegatorContract.methods.recoverWithRecoveryAddress(revokeTupleSerialized).call();
        const revv2 = await delegatorContract.methods.recoverWithRecoveryAddress(revokeTupleSerialized).send({ from: account.address, gas: maxGas });

        console.log("\nTransaction Details below, please check with etherscan : ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const createrevokeIDWithMultisigPacket = async() => {
    try {

        let randomBuf = randomBytes(32);
        let addresses = await getRevokeWithMultisigAddresses();
        // Notarizer perfroming recover
        const signatureAddress = addresses[2]; 

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_REVOKE);

        let serialized = Buffer.from('');
        serialized = Buffer.concat([
            outBuffer,
            Buffer.from(util.removeHexLeader(addresses[1]), "Hex"), 
            randomBuf ])

        const signature = await getSig([signatureAddress, serialized.toString('Hex').toLowerCase()])
        const buffer = Buffer.from(signature, 'base64');
        
        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex'));
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex')); 

        let submission = {};

        submission = { _vs: vVal, _rs: rVal, _ss: sVal, salt: "0x" + randomBuf.toString('Hex'), notarizerID: addresses[0] };
        console.log("Notary to revoke: " , addresses[1]);

        console.log("revoke packet: " , JSON.stringify(submission, null, 2));



    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const createrecoverIDWithMultisigPacket = async() => {
    try {

        let randomBuf = randomBytes(32);
        let addresses = await getRecoverWithMultisigAddresses();
        // Notarizer performing recover
        const signatureAddress = addresses[2]; 

        let outBuffer = Buffer.alloc(1);
        outBuffer.writeUInt8(TYPE_RECOVER);

        let serialized = Buffer.from('');
        serialized = Buffer.concat([
            outBuffer,
            Buffer.from(util.removeHexLeader(addresses[1]), "Hex"), 
            Buffer.from(util.removeHexLeader(addresses[3]), "Hex"),
                Buffer.from(util.removeHexLeader(addresses[4]), "Hex"),
            randomBuf ])

        const signature = await getSig([signatureAddress, serialized.toString('Hex').toLowerCase()])
        const buffer = Buffer.from(signature, 'base64');
        
        const vVal = parseInt(buffer.readUIntBE(0, 1));
        const rVal = addHexPrefix(buffer.slice(1, 33).toString('Hex'));
        const sVal = addHexPrefix(buffer.slice(33, 65).toString('Hex')); 

        let submission = {};

        submission = { _vs: vVal, _rs: rVal, _ss: sVal, salt: "0x" + randomBuf.toString('Hex'), notarizerID: addresses[0] };
        console.log("Notary to recover: " , {notarytorecover: addresses[1]});
        console.log("Notaries new main ETH address: " , {notarynewmain: addresses[3]});
        console.log("Notaries new recover ETH address: " , {notarynewrecover: addresses[4]});


        console.log("recover packet: " , submission);



    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const revokeIDWithMultisig = async() => {
    try {
        const packet = require('./revokemultisig.json')

        var answer = await Ask('Here is the revoke information: \n' + JSON.stringify(packet, null, 2) + '\n press [y] or [n] to confirm then Enter: ');
        if (answer != "y") {
            process.exit(0);
        }

        const revokeTupleSerialized = createRevokeMultisigTuple(packet);

        const revv1 = await delegatorContract.methods.revokeWithMultiSig(revokeTupleSerialized).call();
        const revv2 = await delegatorContract.methods.revokeWithMultiSig(revokeTupleSerialized).send({ from: account.address, gas: maxGas });

        console.log("\nTransaction Details below, please check with etherscan : ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const recoverIDWithMultisig = async() => {
    try {
        const packet = require('./recovermultisig.json')

        var answer = await Ask('Here is the recover information: \n' + JSON.stringify(packet, null, 2) + '\n press [y] or [n] to confirm then Enter: ');
        if (answer != "y") {
            process.exit(0);
        }

        const recoverTupleSerialized = createRecoverMultisigTuple(packet);

        const revv1 = await delegatorContract.methods.recoverWithMultiSig(recoverTupleSerialized).call();
        const revv2 = await delegatorContract.methods.recoverWithMultiSig(recoverTupleSerialized).send({ from: account.address, gas: maxGas });

        console.log("\nTransaction Details below, please check with etherscan : ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

const upgradeContractSend = async() => {
    try {
       
        let contracts = [];
        // Get the list of current active contracts
        for (let i = 0; i < 11; i++) 
        {
            contracts.push(await delegatorContract.methods.contracts(i).call());
        }
        const newContract = getContractAddress();
        const newContractType = getContractType();
        const salt = getSalt();

        if (!newContract || !newContractType || !salt) {
            console.log("Missing parameters");
            process.exit(0);

        }
         //replace existing contract with new contract address
        contracts[newContractType] = newContract; 

        const key = Object.keys(ContractType);
        console.log("\nNew Ethereum contract: " + newContract + " Type: " + key[newContractType] + "\nSalt used: 0x" + salt)

        const upgradeTupleSerialized = createUpgradeTuple(contracts, salt, TYPE_CONTRACT);
        //console.log("Upgrade data: " + upgradeTupleSerialized);

        const revv1 = await delegatorContract.methods.upgradeContracts(upgradeTupleSerialized).call();
        const revv2 = await delegatorContract.methods.upgradeContracts(upgradeTupleSerialized).send({ from: account.address, gas: maxGas });
        console.log("Upgrade completed, please check with etherscan : ", revv2);
    } catch (e) {
        console.log(e);

    }
    process.exit(0);


}

const countRollingUpgradeVotes = async() => {
    try {
        let votes = [];
        
        // Get the first 50 entries from rollingUpgradeVotes array (indices 0-49)
        for (let i = 0; i < 50; i++) {
            const vote = await delegatorContract.methods.rollingUpgradeVotes(i).call();
            votes.push(vote.toLowerCase());
        }
        
        // Count occurrences of each address
        const voteCounts = {};
        for (const vote of votes) {
            if (voteCounts[vote]) {
                voteCounts[vote]++;
            } else {
                voteCounts[vote] = 1;
            }
        }
        
        // Sort by count descending
        const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
        
        console.log("\n*** Vote counts ***");
        for (const [address, count] of sortedVotes) {
            console.log(` ${address} = ${count}`);
        }
        
       
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
        else if(revokemultisig){
            success = await revokeIDWithMultisig();
        }
        else if(recovermultisig){
            success = await recoverIDWithMultisig();
        }        
        else if(createrevokemultisigpacket){
            success = await createrevokeIDWithMultisigPacket();
        }
        else if(createrecovermultisigpacket){
            success = await createrecoverIDWithMultisigPacket();
        }
        else if(upgradeContracts){
            success = upgradeContractSend();
        }
        else if(countVotes){
            success = await countRollingUpgradeVotes();
        }
        if(!success) {
            console.log("Please use the flags -contractupgrade, -revoke , -recover, -countvotes, or -getcontracthash");
            console.log("To get the contract hash run:\n\nnode upgrade.js -getcontracthash -contracttype 1 -contractaddress 0x1234567890\n");
            exitUpgradeError();
        }
}

main();