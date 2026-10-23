/*
 * Guided recovery from a PERMANENT bridge halt caused by a rejected pending import.
 *
 *   node utilities/clearrejectedtxid.js -testnet            (guided, asks before every on-chain action)
 *   node utilities/clearrejectedtxid.js -testnet -yes       (no confirmation prompts)
 *   node utilities/clearrejectedtxid.js -testnet -contractaddress 0x...   (skip the deploy, reuse a deployed contract)
 *   node utilities/clearrejectedtxid.js -testnet -salt 0x<64 hex>         (reuse a salt, otherwise a random one is made)
 *
 * What it does:
 *   1. Reads the delegator and shows the halt state + the blocked txid + the state of that import.
 *   2. Deploys PendingImportsRestoreRejected (built with `npx truffle compile` in Verus-Ethereum-contracts).
 *      Its initialize() puts the rejected import back to PENDING, deletes its reject votes, lifts the permanent
 *      halt and restarts the import clock. Nothing else changes.
 *   3. Verifies the deployed code and builds the upgrade hash (same formula as upgrade.js -getcontracthash,
 *      over ALL contracts of the delegator, with the PendingImports slot replaced).
 *   4. Prints the hash to put in vrsctest.conf and the command to execute the upgrade once voting has passed.
 */
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const confFile = require('../confFile.js');
const util = require('../utils.js');
const verusDelegatorAbi = require('../abi/VerusDelegator.json');

const TYPE_CONTRACT = 1;
const PENDING_IMPORTS_TYPE = 11;
const TESTNET_VETH = "0x67460C2f56774eD27EeB8685f29f6CEC0B090B00"; // constructor arg, not used by the contract logic
const ARTIFACT = path.join(__dirname, '../../Verus-Ethereum-contracts/build/contracts/PendingImportsRestoreRejected.json');

const hasFlag = (f) => process.argv.indexOf(f) > -1;
const getArg = (f) => { const i = process.argv.indexOf(f); return i > -1 && process.argv.length > i + 1 ? process.argv[i + 1] : null; };

const ticker = hasFlag('-testnet') ? "VRSCTEST" : "VRSC";
const autoYes = hasFlag('-yes');
const settings = confFile.loadConfFile(ticker);

const web3 = new Web3(new Web3.providers.WebsocketProvider(settings.ethnode, {
    clientConfig: { maxReceivedFrameSize: 100000000, maxReceivedMessageSize: 100000000, keepalive: true, keepaliveInterval: -1 },
    reconnect: { auto: true, delay: 5000, maxAttempts: 5, onTimeout: false }
}));
const delegator = new web3.eth.Contract(verusDelegatorAbi, settings.delegatorcontractaddress);
const account = web3.eth.accounts.privateKeyToAccount(settings.privatekey);
web3.eth.accounts.wallet.add(account);

const step = (n, text) => console.log(`\n=== Step ${n}: ${text} ===`);

function ask(query) {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

async function confirm(question) {
    if (autoYes) { console.log(`${question} [y] (auto)`); return; }
    if ((await ask(`${question} [y/n]: `)).trim().toLowerCase() !== 'y') {
        console.log("Stopped by user, nothing further was done.");
        process.exit(0);
    }
}

const key = (name) => web3.utils.keccak256(name);
const readStorage = (name) => delegator.methods.storageGlobal(key(name)).call();

function normalizeSalt(salt) {
    const s = salt || '0x' + randomBytes(32).toString('hex');
    if (!/^0x[0-9a-fA-F]{64}$/.test(s)) throw new Error("Salt must be a 32-byte hex string");
    return s;
}

async function showHaltState() {
    step(1, "Reading the delegator " + settings.delegatorcontractaddress);

    const permanent = await readStorage("bridge.permanently.halted");
    const temporary = await readStorage("bridge.temporary.halted");
    console.log("Temporary halt : " + (temporary && temporary !== '0x' ? "YES" : "no"));
    if (!permanent || permanent === '0x') {
        console.log("Permanent halt : no");
        console.log("\nThe bridge is not permanently halted, there is nothing for this tool to clear.");
        process.exit(0);
    }

    const blocked = permanent.slice(0, 66);
    const reversed = '0x' + Buffer.from(blocked.slice(2), 'hex').reverse().toString('hex');
    console.log("Permanent halt : YES");
    console.log("Blocked txid (contract byte order) : " + blocked);
    console.log("Blocked txid (Verus explorer order): " + reversed.slice(2));

    const pendingKey = web3.utils.keccak256(web3.utils.encodePacked(
        { type: 'bytes32', value: key("pending.import") }, { type: 'bytes32', value: blocked }));
    const rejectKey = web3.utils.keccak256(web3.utils.encodePacked(
        { type: 'bytes32', value: key("pending.import.reject.vote.bitmap") }, { type: 'bytes32', value: blocked }));
    const pending = await delegator.methods.storageGlobal(pendingKey).call();
    const rejectVotes = await delegator.methods.storageGlobal(rejectKey).call();

    console.log("Import record in queue : " + (pending && pending !== '0x' ? "present (it stays queued as REJECTED)" : "MISSING"));
    console.log("Reject vote bitmap     : " + (rejectVotes && rejectVotes !== '0x' ? web3.eth.abi.decodeParameter('uint32', rejectVotes).toString(2).padStart(8, '0') + " (binary, one bit per notary)" : "empty"));
    if (!pending || pending === '0x') {
        console.log("\nThe import record no longer exists, it cannot be restored. Aborting.");
        process.exit(1);
    }
    return blocked;
}

async function deploy() {
    step(2, "Build + deploy PendingImportsRestoreRejected");

    const given = getArg('-contractaddress');
    if (given) {
        console.log("Using the already deployed contract " + given);
        return given;
    }

    if (!fs.existsSync(ARTIFACT)) {
        console.log("Build artifact missing. Build it first with:\n  cd Verus-Ethereum-contracts && npx truffle compile");
        process.exit(1);
    }
    const artifact = JSON.parse(fs.readFileSync(ARTIFACT, 'utf8'));
    const size = (artifact.deployedBytecode.length - 2) / 2;
    console.log(`Compiled artifact found (${size} bytes of runtime code, limit 24576).`);

    const contract = new web3.eth.Contract(artifact.abi);
    const deployTx = contract.deploy({ data: artifact.bytecode, arguments: [TESTNET_VETH] });
    const gas = await deployTx.estimateGas({ from: account.address });
    const balance = await web3.eth.getBalance(account.address);
    console.log(`Deploying from ${account.address} (balance ${web3.utils.fromWei(balance)} ETH), estimated gas ${gas}.`);
    await confirm("Deploy this contract to the network now?");

    const deployed = await deployTx.send({ from: account.address, gas: Math.ceil(gas * 1.2) });
    console.log("Deployed at " + deployed.options.address);
    return deployed.options.address;
}

async function verifyDeployment(address) {
    step(3, "Verifying the deployed code");
    const artifact = JSON.parse(fs.readFileSync(ARTIFACT, 'utf8'));
    const onchain = (await web3.eth.getCode(address)).toLowerCase();
    if (onchain === '0x') throw new Error("No code at " + address);

    // compare ignoring the metadata hash tail and the immutable constructor argument
    const strip = (c) => c.toLowerCase().slice(0, -106);
    const match = strip(onchain) === strip(artifact.deployedBytecode);
    console.log(match ? "On-chain code matches the compiled artifact." : "WARNING: on-chain code differs from the local artifact (different build?).");
    if (!match) await confirm("Continue anyway?");
}

async function makeHash(newContract) {
    step(4, "Building the upgrade hash");
    const salt = normalizeSalt(getArg('-salt'));
    if (await delegator.methods.saltsUsed(salt).call()) throw new Error("Salt already used");

    const contracts = [];
    for (let i = 0; ; i++) {
        try { contracts.push(await delegator.methods.contracts(i).call()); } catch (e) { break; }
    }
    console.log(`Delegator has ${contracts.length} contracts. Replacing slot ${PENDING_IMPORTS_TYPE} (PendingImports):`);
    console.log("  old: " + contracts[PENDING_IMPORTS_TYPE] + "\n  new: " + newContract);
    contracts[PENDING_IMPORTS_TYPE] = newContract;

    const packed = Buffer.concat([
        ...contracts.map(c => Buffer.from(util.removeHexLeader(c), 'hex')),
        Buffer.from([TYPE_CONTRACT]),
        Buffer.from(util.removeHexLeader(salt), 'hex')
    ]);
    const hash = "0x" + web3.utils.keccak256(packed).slice(26, 66);

    console.log("\n==================== RESULT ====================");
    console.log("Salt          : " + salt);
    console.log("Upgrade hash  : " + hash);
    console.log("================================================");
    console.log("\nNext steps:");
    console.log(" 1. Put the hash above in vrsctest.conf as the contract upgrade vote and start the notary voting.");
    console.log(" 2. Keep the salt - it is needed to execute the upgrade once the vote has passed:");
    console.log(`    node utilities/upgrade.js -upgradecontracts -contracttype ${PENDING_IMPORTS_TYPE} -contractaddress ${newContract} -salt ${salt}${ticker === "VRSCTEST" ? " -testnet" : ""}`);
    console.log(" 3. When the upgrade executes, initialize() restores the import to PENDING, clears its reject votes,");
    console.log("    lifts the permanent halt and restarts the review clock. Notaries can then vote on it again.");
}

(async () => {
    try {
        await showHaltState();
        const address = await deploy();
        await verifyDeployment(address);
        await makeHash(address);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
})();
