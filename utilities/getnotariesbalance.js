const verusDelegatorAbi = require('../abi/VerusDelegator.json');
const confFile = require('../confFile.js')
const Web3 = require('web3');
const VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL = "0x00000000000000000000000039aDf7BA6E5c91eeef476Bb4aC9417549ba0d51a";
const ticker = process.argv.indexOf('-testnet') > -1 ? "VRSCTEST" : "VRSC";
const settings = confFile.loadConfFile(ticker);
const util = require('../utils.js');

const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode));

const delegatorContract = new web3.eth.Contract(verusDelegatorAbi, settings.delegatorcontractaddress);

const main = async () => {

    const test = await delegatorContract.methods.claimableFees(VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL).call();
    console.log(util.uint64ToVerusFloat(test));
}
main();

