const Web3 = require('web3');
const { addHexPrefix } = require('ethereumjs-util');
const confFile = require('../confFile.js')

//const VerusClient = require('./config.js')
const axios = require('axios');

axios.defaults.withCredentials = true;

const vrsctest = axios.create({
    baseURL: "http://localhost:25779/", //process.env.VRSCTEST_RPC_URL,
    auth: {
        username: "user3920459605", //process.env.VRSCTEST_RPC_USER || '',
        password: "pass", // process.env.VRSCTEST_RPC_PASSWORD || '',
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

const verusUpgrade = new web3.eth.Contract(verusUpgradeAbi, "0xb98445Ae9B774C99cc0bC57901bcdD8558A6FD13");

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



const testfunc1 = async() => {
    try {

        let contracts = [];
        for (let i = 0; i < 12; i++) {
            contracts.push(await verusUpgrade.methods.contracts(i).call());
        }

        let contractsHex = new Buffer('');
        for (let i = 0; i < 12; i++) {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].substr(2, 40), 'hex')]);
        }

        contracts[ContractType.VerusSerializer] = "0xa0DD2b973A0C0418ec65d68Bd6713e0Bb0Ae6FAB"; //new contract address from remixd

        for (let i = 0; i < 12; i++) {
            contractsHex = Buffer.concat([contractsHex, Buffer.from(contracts[i].substr(2, 40), 'hex')]);
        }

        // const signatureAddress = "RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i";

        //  const signature = await getSig([signatureAddress, contractsHex.toString('Hex')])

        // const signatureHex = "0x454545"; // TODO: Buffer.from(signature, 'base64');
        const vVal = "1"; // TODO: signatureHex[0];
        const rVal = "0x019303cdd05b16c507d64489d336b2f94e15b13fc84d9407d4580b37d622ac1f"; // TODO: addHexPrefix(signatureHex.slice(1, 33));
        const sVal = "0x019303cdd05b16c507d64489d336b2f94e15b13fc84d9407d4580b37d622ac1f"; // TODO: addHexPrefix(signatureHex.slice(33, 65));

        let submission = [];

        let NotartyID = "0xb26820ee0c9b1276aac834cf457026a575dfce84";
        for (let i = 0; i < 3; i++) {
            submission.push({ _vs: vVal, _rs: addHexPrefix(rVal.toString('Hex')), _ss: addHexPrefix(sVal.toString('Hex')), contracts, notaryAddress: NotartyID })

        }


        const revv2 = await verusUpgrade.methods.upgradeContracts(submission).send({ from: account.address, gas: maxGas });

        console.log("\nsignature: ", /* signature,*/ revv2);

    } catch (e) {
        console.log(e);

    }
    process.exit(0);
}

testfunc1();