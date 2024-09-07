const confFile = require('../confFile.js')
const Web3 = require('web3');

const ticker = process.argv.indexOf('-testnet') > -1 ? "VRSCTEST" : "VRSC";
const settings = confFile.loadConfFile(ticker);
const { exit } = require('process');
const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode));
const account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
const { ethers } = require("ethers");

const main = async () => {

  const ETHaddress = process.argv[process.argv.indexOf('-address') + 1];
  const amount = process.argv[process.argv.indexOf('-amount') + 1];

  if (process.argv.indexOf('-pk') > -1) {
    settings.privatekey = process.argv[process.argv.indexOf('-pk') + 1];
    if (settings.privatekey.length != 64) {
      console.log("Invalid private key, must be withouth 0x prefix and 64 characters long");
      exit(1);
    }
  }

  let parts = settings.ethnode.split("/");
  let lastPart = parts[parts.length - 1];
  const network = 'mainnet';
  const provider = new ethers.providers.InfuraProvider(
    network,
    lastPart
  );

  // Creating a signing account from a private key
  const signer = new ethers.Wallet(settings.privatekey, provider);
  console.log("sending ", amount, "from: ", signer.address, "ETH to ", ETHaddress);

  if (process.argv.indexOf('-exe') > -1) {
    // Creating and sending the transaction object
    try {
      const tx = await signer.sendTransaction({
        to: ETHaddress,
        value: ethers.utils.parseUnits(amount, "ether"),
      });
      console.log("Mining transaction...");
      console.log(`https://${network}.etherscan.io/tx/${tx.hash}`);
      // Waiting for the transaction to be mined
      const receipt = await tx.wait();
      // The transaction is now on chain!
      console.log(`Mined in block ${receipt.blockNumber}`);
      exit(0);
    } catch (e) {
      console.log("Error: ", e?.reason);
      console.log(JSON.stringify(e?.transaction, null, 2));
      exit(1);

    }
  }
  else {
    console.log("Wallet setup ok, use -exe to send eth.");
    exit(0);
  }
}
main();

