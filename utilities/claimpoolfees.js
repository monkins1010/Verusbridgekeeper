const log = console.log;
console.log = () => {};
const verusDelegatorAbi = require('../abi/VerusDelegator.json');
const confFile = require('../confFile.js')
const Web3 = require('web3');
const VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL = "0x00000000000000000000000039aDf7BA6E5c91eeef476Bb4aC9417549ba0d51a";
const emptyLocation = "0x0100000000000000000000000000000000000000000000000000000000000000";
const ticker = process.argv.indexOf('-testnet') > -1 ? "VRSCTEST" : "VRSC";
const settings = confFile.loadConfFile(ticker);
const util = require('../utils.js');
const { exit } = require('process');
const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode));
const account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
const delegatorContract = new web3.eth.Contract(verusDelegatorAbi, settings.delegatorcontractaddress);

const main = async () => {

    const fees = await delegatorContract.methods.claimableFees(VDXF_SYSTEM_NOTARIZATION_NOTARYFEEPOOL).call();
    const fees2 = await delegatorContract.methods.claimableFees(emptyLocation).call();

    log("claiming:    ", util.uint64ToVerusFloat(parseInt(fees) + parseInt(fees2)), "ETH");
    
    const gasfee = await delegatorContract.methods.claimfees().estimateGas({ from: account.address });
    
    const gasPrice = await web3.eth.getGasPrice();
    
    const gasCost = web3.utils.toBN(gasfee).mul(web3.utils.toBN(gasPrice));
    log("The claim will cost: ", web3.utils.fromWei(gasCost), "ETH in GAS FEES, GAS is: ", web3.utils.fromWei(gasPrice, "gwei"), " gwei");
    
    if (process.argv.indexOf('-claim') > -1) {
        log("Please wait this can take a while...");
        await delegatorContract.methods.claimfees().send({ from: account.address, gas: 500000 });
    } else {
        log("If you want to claim the fees, run the script with -claim");
    }
    exit(0);
}
main();

