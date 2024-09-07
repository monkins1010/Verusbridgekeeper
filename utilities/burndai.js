const log = console.log;
console.log = () => {};
const verusDelegatorAbi = require('../abi/VerusDelegator.json');
const daiPotAbi = require('../abi/DaiPot.json');
const confFile = require('../confFile.js')
const Web3 = require('web3');
const VDXF_SYSTEM_DAI_HOLDINGS = "0x000000000000000000000000334711b41Cf095C9D44d1a209f34bf3559eA7640";
const VDXFID_DAI_DSR_SUPPLY = "0x00000000000000000000000084206E821f7bB4c6F390299c1367600F608c28C8";
const VDXFID_TIMESTAMP = "0x0000000000000000000000007d6505549c434ef651d799ede5f0d3f698464fcf";
const DSR_POT_CONTRACT = "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7"
const ticker = process.argv.indexOf('-testnet') > -1 ? "VRSCTEST" : "VRSC";
const settings = confFile.loadConfFile(ticker);
const { exit } = require('process');
const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode));
const account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
const delegatorContract = new web3.eth.Contract(verusDelegatorAbi, settings.delegatorcontractaddress);
const daiPotContractInstance = new web3.eth.Contract(daiPotAbi, DSR_POT_CONTRACT);
const CoinGeckoETH = 'https://api.coingecko.com/api/v3/coins/ethereum'
const urls = [CoinGeckoETH]

const main = async () => {

    const verusDAIHoldings = await delegatorContract.methods.claimableFees(VDXF_SYSTEM_DAI_HOLDINGS).call();
    const verusDAIDSRSupply = await delegatorContract.methods.claimableFees(VDXFID_DAI_DSR_SUPPLY).call();
    const chi = await daiPotContractInstance.methods.chi().call();

    const ten = new web3.utils.BN(10);
    const RAY = ten.pow(new web3.utils.BN(27));

    const dsrmulbychi = new web3.utils.toBN(verusDAIDSRSupply).mul(new web3.utils.toBN(chi));

    const DAIPlusIntrest = dsrmulbychi.div(RAY);

    const totalfees = DAIPlusIntrest.sub(new web3.utils.toBN(verusDAIHoldings));

    const fees = web3.utils.fromWei(totalfees, "ether");

    log("Amount to Burn: ", fees, " DAI");
    let gasfee;
    try {
      gasfee = await delegatorContract.methods.burnFees("0x00").estimateGas({ from: account.address });
    } catch (error) {
      console.error("estimating gas error, probably to soon after last burn, try again later.")
      exit(0);

     }

    const gasPrice = await web3.eth.getGasPrice();
    
    const gasCost = web3.utils.toBN(gasfee).mul(web3.utils.toBN(gasPrice));
    log("The burn will cost: ", web3.utils.fromWei(gasCost), "ETH in GAS FEES, GAS is: ", web3.utils.fromWei(gasPrice, "gwei"), " gwei");
    let conversions;
    try {
        conversions = await Promise.all(
          urls.map(async (url) => fetch(url)
            .then((res) => res.json())
            .then((c) => ({
              symbol: c.symbol,
              price: c.market_data.current_price.usd
            })))
        )
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('%s: fetching prices %s', Date().toString(), error)
      }
      log("The burn will refund you approx: ", (conversions[0].price * web3.utils.fromWei(gasCost)), " DAI");

    if(parseFloat(fees) < 1000 ) {
        log("You need to have at least 1000 DAI in fees to burn");
        exit(0);
    }
    const lastBurnTimestamp = await delegatorContract.methods.claimableFees(VDXFID_TIMESTAMP).call();
    const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
    const lastBurnTimestampDate = new Date(parseInt(lastBurnTimestamp) * 1000).getTime();

    if (lastBurnTimestampDate > twentyFourHoursAgo) { 
        log("You can only burn once per day, last burn was: ", new Date(parseInt(lastBurnTimestamp) * 1000).toUTCString());
        exit(0);
    }

    if (process.argv.indexOf('-burn') > -1) {
        web3.eth.accounts.wallet.add(account);
        log("Please wait this can take a while...");
        await delegatorContract.methods.burnFees("0x00").send({ from: account.address, gas: (gasfee * 2) });
    } else {
        log("If you want to burnFees the DAI back to the Bridge.vETH, run the script with -burn");
    }
    exit(0);
}
main();

