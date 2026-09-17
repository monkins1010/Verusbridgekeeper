const confFile = require('../confFile.js')
const { ethers } = require("ethers");

const ticker = process.argv.indexOf('-testnet') > -1 ? "VRSCTEST" : "VRSC";
const settings = confFile.loadConfFile(ticker);
const { exit } = require('process');

const NETWORKS = {
  VRSC: { name: 'Ethereum mainnet', chainId: 1, explorer: 'https://etherscan.io' },
  VRSCTEST: { name: 'Ethereum Sepolia', chainId: 11155111, explorer: 'https://sepolia.etherscan.io' }
};

function configuredProvider(endpoint) {
  if (typeof endpoint !== 'string' || !/^(https?|wss?):\/\//i.test(endpoint)) {
    throw new Error('Invalid ethnode endpoint in configuration');
  }

  return /^wss?:\/\//i.test(endpoint)
    ? new ethers.providers.WebSocketProvider(endpoint)
    : new ethers.providers.JsonRpcProvider(endpoint);
}

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

  const intendedNetwork = NETWORKS[ticker];
  const provider = configuredProvider(settings.ethnode);
  const connectedNetwork = await provider.getNetwork();
  if (connectedNetwork.chainId !== intendedNetwork.chainId) {
    throw new Error(
      `Configured ethnode is chain ID ${connectedNetwork.chainId}; expected ${intendedNetwork.chainId} for ${intendedNetwork.name}`
    );
  }

  // Creating a signing account from a private key
  const signer = new ethers.Wallet(settings.privatekey, provider);
  console.log(`Network: ${intendedNetwork.name} (chain ID ${connectedNetwork.chainId})`);
  console.log("sending ", amount, "from: ", signer.address, "ETH to ", ETHaddress);

  if (process.argv.indexOf('-exe') > -1) {
    // Creating and sending the transaction object
    try {
      const tx = await signer.sendTransaction({
        to: ETHaddress,
        value: ethers.utils.parseUnits(amount, "ether"),
      });
      console.log("Mining transaction...");
      console.log(`${intendedNetwork.explorer}/tx/${tx.hash}`);
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
main().catch(e => {
  console.error("Error: ", e.message || e);
  exit(1);
});

