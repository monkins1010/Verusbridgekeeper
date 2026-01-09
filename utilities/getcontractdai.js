const confFile = require('../confFile.js')
const verusDelegatorAbi = require('../abi/VerusDelegator.json');
const Web3 = require('web3');
const ticker = process.argv.indexOf('-testnet') > -1 ? "VRSCTEST" : "VRSC";
const settings = confFile.loadConfFile(ticker);
const { exit } = require('process');
const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode));

const DSR_POT_CONTRACT = "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7";
const ADDRESS_TO_CHECK = "0x71518580f36FeCEFfE0721F06bA4703218cD7F63";
const VDXF_SYSTEM_DAI_HOLDINGS = "0x000000000000000000000000334711b41Cf095C9D44d1a209f34bf3559eA7640";
const VDXFID_DAI_DSR_SUPPLY = "0x00000000000000000000000084206E821f7bB4c6F390299c1367600F608c28C8";

// Add the pie function to your ABI
const potAbi = [
  { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "pie", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "chi", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "rho", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }
];

const potContract = new web3.eth.Contract(potAbi, DSR_POT_CONTRACT);
const delegatorContract = new web3.eth.Contract(verusDelegatorAbi, settings.delegatorcontractaddress);

// RAY = 10^27 (MakerDAO's precision unit)
const RAY = new web3.utils.BN(10).pow(new web3.utils.BN(27));

// rmul: x * y / RAY (rounds down)
function rmul(x, y) {
  return x.mul(y).div(RAY);
}

// rdivup: (x * RAY + y - 1) / y (rounds up)
function rdivup(x, y) {
  return x.mul(RAY).add(y).sub(new web3.utils.BN(1)).div(y);
}

async function getDSRBalance(address) {
  // Get the normalized balance (pie) for the address
  const pie = await potContract.methods.pie(address).call();
  
  // Get the current chi (rate accumulator)
  const chi = await potContract.methods.chi().call();
  
  // Actual DAI = pie * chi / RAY
  const daiBalance = new web3.utils.BN(pie).mul(new web3.utils.BN(chi)).div(RAY);
  
  console.log("DAI in DSR:", web3.utils.fromWei(daiBalance, "ether"), "DAI");
  return daiBalance;
}

/**
 * Check if the contract can exit a given amount of DAI from the DSR
 * Mirrors the contract's exit() function logic:
 *   - pie = rdivup(wad, chi)
 *   - requires claimableFees[VDXFID_DAI_DSR_SUPPLY] >= pie
 *   - amt = rmul(chi, pie)
 *   - requires claimableFees[VDXF_SYSTEM_DAI_HOLDINGS] >= amt
 * 
 * @param {string} wadToExit - The amount of DAI to exit in wei (string or BN)
 * @returns {object} - { canExit, pie, amt, dsrSupply, daiHoldings, dsrShortfall, holdingsShortfall }
 */
async function canExitDAI(wadToExit) {
  const wad = new web3.utils.BN(wadToExit);
  
  // Get current chi (in real exit, it would drip first if needed, but chi is close enough for checking)
  const chi = new web3.utils.BN(await potContract.methods.chi().call());
  const rho = await potContract.methods.rho().call();
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  // Note: If block.timestamp > rho, the contract calls drip() which updates chi
  // For this check, we use current chi (slightly underestimated if drip is pending)
  const dripPending = currentTimestamp > parseInt(rho);
  
  // Calculate pie = rdivup(wad, chi) - normalized amount needed
  const pie = rdivup(wad, chi);
  
  // Calculate amt = rmul(chi, pie) - actual DAI amount after rounding
  const amt = rmul(chi, pie);
  
  // Get current claimableFees values from the delegator contract (internal accounting)
  const dsrSupply = new web3.utils.BN(await delegatorContract.methods.claimableFees(VDXFID_DAI_DSR_SUPPLY).call());
  const daiHoldings = new web3.utils.BN(await delegatorContract.methods.claimableFees(VDXF_SYSTEM_DAI_HOLDINGS).call());
  
  // VERIFICATION: Get actual pie from DSR Pot contract for the delegator address
  const actualPieInPot = new web3.utils.BN(await potContract.methods.pie(settings.delegatorcontractaddress).call());
  const actualDaiInDSR = rmul(chi, actualPieInPot); // Actual DAI value in DSR
  const recordedDaiInDSR = rmul(chi, dsrSupply); // What the contract thinks it has
  
  // Check for discrepancy between internal accounting and actual DSR balance
  const pieDiscrepancy = actualPieInPot.sub(dsrSupply);
  const hasPieDiscrepancy = !pieDiscrepancy.isZero();
  const pieDiscrepancyAbs = pieDiscrepancy.isNeg() ? pieDiscrepancy.neg() : pieDiscrepancy;
  
  // Check if there's enough in each
  const hasSufficientDSR = dsrSupply.gte(pie);
  const hasSufficientHoldings = daiHoldings.gte(amt);
  
  // Also check against actual pot balance (in case internal accounting is wrong)
  const hasSufficientActualDSR = actualPieInPot.gte(pie);
  
  const canExit = hasSufficientDSR && hasSufficientHoldings;
  const canActuallyExit = hasSufficientActualDSR && hasSufficientHoldings;
  
  // Calculate shortfalls if any
  const dsrShortfall = hasSufficientDSR ? new web3.utils.BN(0) : pie.sub(dsrSupply);
  const holdingsShortfall = hasSufficientHoldings ? new web3.utils.BN(0) : amt.sub(daiHoldings);
  
  // Calculate max exit amounts based on internal accounting
  const maxExitByDSR = rmul(chi, dsrSupply); // max DAI based on recorded DSR supply
  const maxExitByActualDSR = rmul(chi, actualPieInPot); // max DAI based on actual DSR
  const maxExitByHoldings = daiHoldings; // max DAI based on holdings
  const maxExitable = maxExitByDSR.lt(maxExitByHoldings) ? maxExitByDSR : maxExitByHoldings;
  const maxActuallyExitable = maxExitByActualDSR.lt(maxExitByHoldings) ? maxExitByActualDSR : maxExitByHoldings;
  
  console.log("\n=== Exit DAI Check ===");
  console.log("Amount requested to exit:", web3.utils.fromWei(wad, "ether"), "DAI");
  console.log("Pie (normalized) needed:", web3.utils.fromWei(pie, "ether"));
  console.log("Amt (actual DAI) to transfer:", web3.utils.fromWei(amt, "ether"), "DAI");
  console.log("\n--- Internal Accounting (claimableFees) ---");
  console.log("claimableFees[VDXFID_DAI_DSR_SUPPLY]:", web3.utils.fromWei(dsrSupply, "ether"), "(pie)");
  console.log("claimableFees[VDXF_SYSTEM_DAI_HOLDINGS]:", web3.utils.fromWei(daiHoldings, "ether"), "DAI");
  console.log("Recorded DAI value in DSR:", web3.utils.fromWei(recordedDaiInDSR, "ether"), "DAI");
  console.log("\n--- Actual DSR Pot Balance (Verification) ---");
  console.log("Actual pie in Pot for delegator:", web3.utils.fromWei(actualPieInPot, "ether"));
  console.log("Actual DAI value in DSR:", web3.utils.fromWei(actualDaiInDSR, "ether"), "DAI");
  if (hasPieDiscrepancy) {
    const discrepancySign = pieDiscrepancy.isNeg() ? "UNDER-REPORTED" : "OVER-REPORTED";
    console.log("⚠️  DISCREPANCY DETECTED:", discrepancySign);
    console.log("    Difference (pie):", web3.utils.fromWei(pieDiscrepancy, "ether"));
    console.log("    Difference (DAI):", web3.utils.fromWei(rmul(chi, pieDiscrepancyAbs), "ether"), "DAI");
  } else {
    console.log("✓ Internal accounting matches actual DSR balance");
  }
  console.log("\nDrip pending (chi may increase):", dripPending);
  console.log("\n--- Result (Based on Internal Accounting) ---");
  console.log("Has sufficient DSR supply:", hasSufficientDSR);
  console.log("Has sufficient DAI holdings:", hasSufficientHoldings);
  console.log("CAN EXIT (per contract logic):", canExit ? "YES ✓" : "NO ✗");
  console.log("\n--- Result (Based on Actual DSR Balance) ---");
  console.log("Has sufficient actual DSR:", hasSufficientActualDSR);
  console.log("CAN ACTUALLY EXIT:", canActuallyExit ? "YES ✓" : "NO ✗");
  
  if (!hasSufficientDSR) {
    console.log("\nDSR supply shortfall (internal):", web3.utils.fromWei(dsrShortfall, "ether"));
  }
  if (!hasSufficientHoldings) {
    console.log("DAI holdings shortfall:", web3.utils.fromWei(holdingsShortfall, "ether"), "DAI");
  }
  console.log("\nMax exitable DAI (per internal accounting):", web3.utils.fromWei(maxExitable, "ether"), "DAI");
  console.log("Max exitable DAI (per actual DSR balance):", web3.utils.fromWei(maxActuallyExitable, "ether"), "DAI");
  
  return {
    canExit,
    pie,
    amt,
    dsrSupply,
    daiHoldings,
    dsrShortfall,
    holdingsShortfall,
    maxExitable,
    dripPending
  };
}

async function main() {
  console.log("=== DSR Balance Check ===");
  await getDSRBalance(ADDRESS_TO_CHECK);
  
  // Example: Check if we can exit 1000 DAI
  const amountToExit = web3.utils.toWei("1000", "ether");
  await canExitDAI(amountToExit);
  
  exit(0);
}

main();