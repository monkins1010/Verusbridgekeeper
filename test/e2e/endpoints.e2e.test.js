'use strict';
/**
 * End to end test of every bridgekeeper RPC endpoint against a real Ganache node with the real
 * Verus-Ethereum contracts deployed. The keeper is started through index.js and driven over HTTP exactly
 * like the Verus daemon drives it. Money (ETH, DAI, MKR) is sent into the Delegator with sendTransfer
 * and must show up in getexports.
 *
 * Run it with `npm run test:e2e` (test/e2e/run.sh starts Ganache, deploys the contracts and sets the
 * variables below), or point it at your own deployment:
 *
 *   E2E_DELEGATOR      Delegator address (required, otherwise the suite is skipped)
 *   E2E_ETHNODE        ws://127.0.0.1:8545
 *   E2E_CONTRACTS_DIR  ../Verus-Ethereum-contracts (build artifacts + notarization fixture)
 *
 * The chain must be a fresh `ganache-cli -d` deployment: accounts[1] is the keeper's notary.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const Web3 = require('web3');

const DELEGATOR = process.env.E2E_DELEGATOR;
const ETHNODE = process.env.E2E_ETHNODE || 'ws://127.0.0.1:8545';
const CONTRACTS_DIR = path.resolve(process.env.E2E_CONTRACTS_DIR || path.join(__dirname, '../../../Verus-Ethereum-contracts'));
const SKIP = DELEGATOR ? false : 'set E2E_DELEGATOR (or run `npm run test:e2e`) to run the end to end suite';

// ganache-cli -d private key of accounts[1], the first development notary
const NOTARY_KEY = '6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1';
const USER = 'e2euser';
const PASS = 'e2epass';

const VETH = '0x67460C2f56774eD27EeB8685f29f6CEC0B090B00';
const VRSC = '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d';
const DAI_IADDRESS = '0xcce5d18f305474f1e0e0ec1c507d8c85e7315fdf';
const MKR_IADDRESS = '0x005005b2b10a897fed36fbd71c878213a7a169bf';
const ZERO = '0x0000000000000000000000000000000000000000';
const ONE_COIN_SATS = 100000000;
const TX_FEE_WEI = '3000000000000000';
const SEEDED_TXID = '0x' + '00'.repeat(30) + '5eed';           // MockSeedImport.SEEDED_TXID
const SEEDED_TXID_DAEMON = 'ed5e' + '00'.repeat(30);            // the daemon hands over the byte-reversed txid

if (SKIP) {
    test('end to end suite', { skip: SKIP }, () => {});
    return;
}

process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'keeper-e2e-'));

const constants = require('../../constants.js');
const server = require('../../index.js');
const { freePort, post } = require('../helpers/rpc.js');
const { submitFixtureNotarizations } = require(path.join(CONTRACTS_DIR, 'testnet/fixture-notarization.js'));
const delegatorArtifact = require(path.join(CONTRACTS_DIR, 'build/contracts/Delegator.json'));
const tokenArtifact = require(path.join(CONTRACTS_DIR, 'build/contracts/Token.json'));
const seedArtifact = require(path.join(CONTRACTS_DIR, 'build/contracts/MockSeedImport.json'));

const web3 = new Web3(ETHNODE.replace(/^ws/, 'http'));
let port;
let accounts;
let delegator;
let dai;
let mkr;
let lastBlock;

const rpc = (method, params = []) => new Promise((resolve, reject) =>
    web3.currentProvider.send({ jsonrpc: '2.0', method, params, id: Date.now() },
        (err, res) => (err ? reject(err) : resolve(res.result))));
const mine = async (blocks = 1) => { for (let i = 0; i < blocks; i++) await rpc('evm_mine'); };
const keeper = (method, params = []) => post(port, `${USER}:${PASS}`, { jsonrpc: '1.0', id: 1, method, params });
const result = async (method, params) => {
    const reply = await keeper(method, params);
    assert.equal(reply.status, 200, `${method}: ${JSON.stringify(reply.body)}`);
    return reply.body.result;
};
const failure = async (method, params, status = 402) => {
    const reply = await keeper(method, params);
    assert.equal(reply.status, status, `${method}: ${JSON.stringify(reply.body)}`);
    assert.equal(reply.body.result.error, true);
    return reply.body.result;
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const waitFor = async (check, what, ms = 15000) => {
    const end = Date.now() + ms;
    for (;;) {
        const value = await check();
        if (value) return value;
        if (Date.now() > end) assert.fail('timed out waiting for ' + what);
        await sleep(200);
    }
};

const transferStruct = (currency, amountSats) => ({
    version: 1,
    currencyvalue: { currency, amount: amountSats },
    flags: 1,
    feecurrencyid: VRSC,
    fees: 2000000,
    destination: { destinationtype: 2, destinationaddress: '0x9bB2772Aa50ec96ce1305D926B9CC29b7c402bAD' },
    destcurrencyid: VRSC,
    destsystemid: ZERO,
    secondreserveid: ZERO,
});

const sendTransfer = (currency, amountSats, value) =>
    delegator.methods.sendTransfer(transferStruct(currency, amountSats)).send({ from: accounts[0], gas: 6000000, value });

const notaryState = async (index) =>
    Number((await delegator.methods.notaryAddressMapping(await delegator.methods.notaries(index).call()).call()).state);

test.before(async () => {
    accounts = await web3.eth.getAccounts();
    delegator = new web3.eth.Contract(delegatorArtifact.abi, DELEGATOR);

    const tokens = await delegator.methods.getTokenList(0, 0).call();
    const tokenAt = (iaddress) => new web3.eth.Contract(tokenArtifact.abi,
        tokens.find(t => t.iaddress.toLowerCase() === iaddress.toLowerCase()).erc20ContractAddress);
    dai = tokenAt(DAI_IADDRESS);
    mkr = tokenAt(MKR_IADDRESS);

    port = await freePort();
    await server.start({
        ticker: 'VRSCTEST',
        runtimeSettings: {
            ethnode: ETHNODE,
            delegatorcontractaddress: DELEGATOR,
            privatekey: NOTARY_KEY,
            rpcuser: USER,
            rpcpassword: PASS,
            rpcport: String(port),
            rpchost: '127.0.0.1',
            rpcallowip: '127.0.0.1',
            nowitnesssubmissions: 'false',
        },
    });
    await mine(2);
});

test.after(async () => {
    if (SKIP) return;
    server.stop();
    web3.currentProvider.disconnect && web3.currentProvider.disconnect();
    await sleep(200);
    process.exit(process.exitCode || 0);
});

// ── read endpoints on a bridge that has not seen a notarization yet ─────────────────────────────

test('getinfo returns the chain info once the first block header arrived', async () => {
    const info = await waitFor(async () => { await mine(); return (await keeper('getinfo')).body.result; }, 'getinfo to have data');
    assert.equal(info.name, 'vETH');
    assert.equal(info.chainid, constants.VETHCURRENCYID.VRSCTEST);
    assert.equal(info.VRSCversion, constants.VERSION);
    assert.equal(typeof info.blocks, 'number');
    assert.ok(info.tiptime > 1600000000);
    assert.equal(info.blocks, await web3.eth.getBlockNumber());
});

test('getcurrency describes vETH with the on chain notaries, and refuses other currencies', async () => {
    const currency = await result('getcurrency', [constants.VETHCURRENCYID.VRSCTEST]);
    assert.equal(currency.name, 'VETH');
    assert.equal(currency.currencyid, constants.VETHCURRENCYID.VRSCTEST);
    assert.equal(currency.notaries.length, 3);
    assert.equal(currency.minnotariesconfirm, 2);
    assert.equal(currency.parent, constants.VERUSSYSTEMID.VRSCTEST);

    const refused = await failure('getcurrency', [constants.VERUSSYSTEMID.VRSCTEST]);
    assert.match(refused.message, /Unsupported currency/);
    await failure('getcurrency', []);
});

test('getbridgestatus reports the notaries, thresholds and an empty queue', async () => {
    const status = await result('getbridgestatus');
    assert.equal(status.chain, 'VRSCTEST');
    assert.equal(status.delegatorcontract.toLowerCase(), DELEGATOR.toLowerCase());
    assert.equal(status.bridgeconverteractive, false);
    assert.equal(status.totalnotaries, 3);
    assert.equal(status.activenotaries, 3);
    assert.equal(status.votesrequired, 2);
    assert.equal(status.mynotaryindex, 0, 'the keeper key is the first notary');
    assert.match(status.mynotaryiaddress, /^i[1-9A-HJ-NP-Za-km-z]{33}$/);
    assert.equal(status.queuelength, 0);
    assert.equal(status.cooldownseconds, 3600);
    assert.equal(status.notaries.length, 3);
    assert.ok(status.notaries.every(n => n.state === 1));
    assert.equal(status.notaries[0].ethaddress.toLowerCase(), accounts[1].toLowerCase());
    assert.equal(status.spenddisabled, false);
    assert.equal(status.importsdisabled, false);
});

test('getclaimablefees returns the ETH balance of an address and rejects a bad address', async () => {
    const fees = await result('getclaimablefees', ['0x' + '11'.repeat(20)]);
    assert.deepEqual(fees, { ETH: { ['0x' + '11'.repeat(20)]: '0.00000000' } });
    const refused = await failure('getclaimablefees', ['not an address']);
    assert.match(refused.message, /valid ETH address/);
    await failure('getclaimablefees', []);
});

test('getpendingqueuestate rejects a malformed txid and an unknown import', async () => {
    assert.match((await failure('getpendingqueuestate', ['1234'])).message, /Invalid import txid/);
    assert.match((await failure('getpendingqueuestate', [])).message, /Invalid import txid/);
    assert.match((await failure('getpendingqueuestate', ['11'.repeat(32)])).message, /No pending import found/);
});

test('getlastimportfrom has nothing to report before the first notarization', async () => {
    const refused = await failure('getlastimportfrom');
    assert.equal(typeof refused.message, 'string');
});

// ── notarizations ────────────────────────────────────────────────────────────────────────────

test('getnotarizationdata before and after the notarizations are submitted', async () => {
    const before = await keeper('getnotarizationdata');
    assert.ok([200, 402].includes(before.status));

    await submitFixtureNotarizations(web3, DELEGATOR, accounts[0]);

    const data = await result('getnotarizationdata');
    assert.equal(data.version, constants.VERSION_NOTARIZATIONDATA_CURRENT);
    assert.deepEqual(data.forks, [[0, 1]]);
    assert.equal(data.bestchain, 0);
    assert.equal(data.lastconfirmed, 0);
    assert.equal(data.notarizations.length, 2);
    assert.deepEqual(data.notarizations.map(n => n.vout), [0, 1]);
    assert.match(data.notarizations[0].txid, /^[0-9a-f]{64}$/);
});

test('getlastimportfrom returns the last import and the confirmed notarization utxo', async () => {
    const last = await result('getlastimportfrom');
    assert.equal(last.lastimport.sourcesystemid, constants.VETHCURRENCYID.VRSCTEST);
    assert.equal(last.lastimport.sourceheight, 0);
    assert.equal(last.lastimport.hashtransfers, '00'.repeat(32));
    assert.match(last.lastconfirmedutxo.txid, /^[0-9a-f]{64}$/);
    assert.ok(Array.isArray(last.pendingimports) || last.pendingimports === undefined);
});

test('getbestproofroot validates the offered proof roots against the chain and always returns the latest and stable roots', async () => {
    const none = await result('getbestproofroot', [{ proofroots: [] }]);
    assert.equal(none.bestindex, -1);
    assert.deepEqual(none.validindexes, []);
    const stable = none.laststableproofroot;
    assert.equal(stable.systemid, constants.VETHCURRENCYID.VRSCTEST);
    assert.match(stable.stateroot, /^[0-9a-f]{64}$/);
    assert.match(stable.blockhash, /^[0-9a-f]{64}$/);
    assert.match(stable.gasprice, /^\d+\.\d{8}$/);
    assert.deepEqual(none.latestproofroot, stable, 'nothing newer was offered, so latest falls back to the stable root');

    // the keeper accepts a root that matches its own chain view ...
    const accepted = await result('getbestproofroot', [{ proofroots: [stable] }]);
    assert.equal(accepted.bestindex, 0);
    assert.deepEqual(accepted.validindexes, [0]);

    // ... rejects one with a wrong state root, and picks the valid one out of several
    const forged = { ...stable, stateroot: '11'.repeat(32) };
    const rejected = await result('getbestproofroot', [{ proofroots: [forged] }]);
    assert.equal(rejected.bestindex, -1);
    assert.deepEqual(rejected.validindexes, []);
    const mixed = await result('getbestproofroot', [{ proofroots: [forged, stable] }]);
    assert.equal(mixed.bestindex, 1);
    assert.deepEqual(mixed.validindexes, [1]);
});

test('submitacceptednotarization refuses unusable params without sending a transaction', async () => {
    const before = await web3.eth.getTransactionCount(accounts[1]);
    const reply = await keeper('submitacceptednotarization', [{ notarization: {} }, { output: { txid: '00'.repeat(32), voutnum: 0 } }]);
    assert.ok([402, 500].includes(reply.status), JSON.stringify(reply.body));
    assert.equal(reply.body.result.error, true);
    assert.equal(await web3.eth.getTransactionCount(accounts[1]), before, 'nothing was sent');
});

// ── money in: ETH, DAI and MKR must show up in getexports ───────────────────────────────────

test('ETH, DAI and MKR sent to the Delegator are exported and reported by getexports', async () => {
    const amount = web3.utils.toWei('10', 'ether');
    await dai.methods.approve(DELEGATOR, amount).send({ from: accounts[0], gas: 100000 });
    await mkr.methods.approve(DELEGATOR, amount).send({ from: accounts[0], gas: 100000 });

    await sendTransfer(VETH, ONE_COIN_SATS, web3.utils.toWei('1.003', 'ether'));
    await sendTransfer(DAI_IADDRESS, 10 * ONE_COIN_SATS, TX_FEE_WEI);
    await sendTransfer(MKR_IADDRESS, ONE_COIN_SATS, TX_FEE_WEI);
    await mine(3);
    lastBlock = await web3.eth.getBlockNumber();

    const exports = await result('getexports', [constants.VERUSSYSTEMID.VRSCTEST, 1, lastBlock]);
    assert.ok(Array.isArray(exports) && exports.length >= 1, JSON.stringify(exports));

    const transfers = exports.flatMap(e => e.transfers);
    assert.ok(transfers.length >= 3, 'all three transfers are exported, got ' + transfers.length);
    for (const exported of exports) {
        assert.match(exported.txid, /^[0-9a-f]{64}$/);
        assert.equal(exported.txoutnum, 0);
        assert.ok(exported.exportinfo);
        assert.match(exported.partialtransactionproof, /^[0-9a-f]+$/);
    }
    const sentCurrencies = JSON.stringify(transfers).toLowerCase();
    for (const iaddress of [VETH, DAI_IADDRESS, MKR_IADDRESS]) {
        const base58 = require('../../utils.js').uint160ToVAddress(iaddress, constants.IADDRESS).toLowerCase();
        assert.ok(sentCurrencies.includes(base58), 'export contains ' + iaddress);
    }
});

test('getexports serves a repeated request from its cache and validates the chain id', async () => {
    const again = await result('getexports', [constants.VERUSSYSTEMID.VRSCTEST, 1, lastBlock]);
    assert.ok(again.length >= 1);
    const wrongChain = await failure('getexports', [constants.VETHCURRENCYID.VRSCTEST, 1, lastBlock]);
    assert.match(wrongChain.message, /i-Address not/);
});

// ── pending imports: voting through the keeper ────────────────────────────────────────────────

test('approveorrejectacceptedimport validates its params and the import', async () => {
    assert.match((await failure('approveorrejectacceptedimport', ['zz', true])).message, /Invalid import txid/);
    assert.match((await failure('approveorrejectacceptedimport', [SEEDED_TXID_DAEMON, 'maybe'])).message, /Invalid approval decision/);
    // valid params, but nothing is pending for this txid: the contract call reverts and nothing is sent
    const before = await web3.eth.getTransactionCount(accounts[1]);
    await failure('approveorrejectacceptedimport', [SEEDED_TXID_DAEMON, true]);
    assert.equal(await web3.eth.getTransactionCount(accounts[1]), before);
});

test('a pending import goes through cooldown, a keeper vote and a notary quorum', async () => {
    const snapshot = await rpc('evm_snapshot');
    const originalImports = await delegator.methods.contracts(12).call();
    const seed = await new web3.eth.Contract(seedArtifact.abi).deploy({ data: seedArtifact.bytecode }).send({ from: accounts[0], gas: 3000000 });
    await delegator.methods.replacecontract(seed.options.address, 12).send({ from: accounts[0], gas: 6000000 });

    try {
        const queued = await result('getpendingqueuestate', [SEEDED_TXID_DAEMON]);
        assert.equal(queued.status, 'cooldown');
        assert.equal(queued.exporttxid, SEEDED_TXID_DAEMON);
        assert.equal(queued.votesrequired, 2);
        assert.equal(queued.ivoted, false);
        assert.ok(queued.cooldownremaining > 0);

        const bridge = await result('getbridgestatus');
        assert.equal(bridge.queuelength, 1);
        assert.equal(bridge.incooldown, 1);

        // an approval during the cooldown is refused by the contract
        await failure('approveorrejectacceptedimport', [SEEDED_TXID_DAEMON, true]);

        await rpc('evm_increaseTime', [3601]);
        await mine();
        assert.equal((await result('getpendingqueuestate', [SEEDED_TXID_DAEMON])).status, 'awaitingvotes');
        assert.equal((await result('getbridgestatus')).needsmyvote, 1);

        // the keeper votes: it returns the transaction hash as soon as it is broadcast
        const hash = await result('approveorrejectacceptedimport', [SEEDED_TXID_DAEMON, true]);
        assert.match(hash, /^0x[0-9a-f]{64}$/);
        const receipt = await waitFor(() => web3.eth.getTransactionReceipt(hash), 'the vote receipt');
        assert.equal(receipt.status, true);

        const voted = await result('getpendingqueuestate', [SEEDED_TXID_DAEMON]);
        assert.equal(voted.ivoted, true);
        assert.equal(voted.acceptancevotes, 1);
        assert.equal(voted.acceptancevotesneeded, 1);
        assert.equal(voted.acceptedby.length, 1);
        await failure('approveorrejectacceptedimport', [SEEDED_TXID_DAEMON, true]);   // a second vote is refused

        // a second notary completes the quorum directly on chain; the import executes and leaves the queue
        const routeData = web3.eth.abi.encodeParameters(['bytes32', 'bool'], [SEEDED_TXID, true]);
        await delegator.methods.setVerusData(routeData, 'approveOrRejectAcceptedImport').send({ from: accounts[2], gas: 6000000 });
        assert.match((await failure('getpendingqueuestate', [SEEDED_TXID_DAEMON])).message, /No pending import found/);
        assert.equal((await result('getbridgestatus')).queuelength, 0);
    } finally {
        await delegator.methods.replacecontract(originalImports, 12).send({ from: accounts[0], gas: 6000000 });
        await rpc('evm_revert', [snapshot]);
    }
});

test('a keeper reject vote is recorded; a reject quorum halts the bridge permanently', async () => {
    const snapshot = await rpc('evm_snapshot');
    const originalImports = await delegator.methods.contracts(12).call();
    const seed = await new web3.eth.Contract(seedArtifact.abi).deploy({ data: seedArtifact.bytecode }).send({ from: accounts[0], gas: 3000000 });
    await delegator.methods.replacecontract(seed.options.address, 12).send({ from: accounts[0], gas: 6000000 });

    try {
        // rejections are allowed during the cooldown
        const hash = await result('approveorrejectacceptedimport', [SEEDED_TXID_DAEMON, false]);
        await waitFor(() => web3.eth.getTransactionReceipt(hash), 'the reject receipt');
        const state = await result('getpendingqueuestate', [SEEDED_TXID_DAEMON]);
        assert.equal(state.rejectionvotes, 1);
        assert.equal(state.ivoted, true);

        const routeData = web3.eth.abi.encodeParameters(['bytes32', 'bool'], [SEEDED_TXID, false]);
        await delegator.methods.setVerusData(routeData, 'approveOrRejectAcceptedImport').send({ from: accounts[2], gas: 6000000 });

        const rejected = await result('getpendingqueuestate', [SEEDED_TXID_DAEMON]);
        assert.equal(rejected.status, 'rejected');
        assert.equal(rejected.rejected, true);
        assert.equal((await result('getbridgestatus')).rejected, 1);

        // permanently halted: new transfers and further votes are refused
        await assert.rejects(sendTransfer(VETH, ONE_COIN_SATS, web3.utils.toWei('1.003', 'ether')));
        await failure('approveorrejectacceptedimport', [SEEDED_TXID_DAEMON, false]);
    } finally {
        await delegator.methods.replacecontract(originalImports, 12).send({ from: accounts[0], gas: 6000000 });
        await rpc('evm_revert', [snapshot]);
    }
});

// ── submitimports ──────────────────────────────────────────────────────────────────────────────

test('submitimports with no usable import sends nothing', async () => {
    const before = await web3.eth.getTransactionCount(accounts[1]);
    const reply = await keeper('submitimports', [[]]);
    assert.ok([200, 402, 500].includes(reply.status), JSON.stringify(reply.body));
    assert.equal(await web3.eth.getTransactionCount(accounts[1]), before, 'no transaction was sent');
});

test('submitimports with a malformed import is refused without sending a transaction', async () => {
    const before = await web3.eth.getTransactionCount(accounts[1]);
    const reply = await keeper('submitimports', [[{ height: 1, txid: '11'.repeat(32), txoutnum: 0, partialtransactionproof: ['00'], transfers: [] }]]);
    assert.ok([402, 500].includes(reply.status), JSON.stringify(reply.body));
    assert.equal(await web3.eth.getTransactionCount(accounts[1]), before, 'no transaction was sent');
});

// ── invalid / revoke / stop ──────────────────────────────────────────────────────────────────

test('an unknown method is reported as unrecognized', async () => {
    const reply = await failure('nosuchmethod');
    assert.equal(reply.message, 'Unrecognized API call');
});

test('revokeidentity revokes the keeper notary and the keeper reports it', async () => {
    const snapshot = await rpc('evm_snapshot');
    try {
        assert.equal(await notaryState(0), 1);
        const hash = await result('revokeidentity');
        assert.match(hash, /^0x[0-9a-f]{64}$/);
        await waitFor(() => web3.eth.getTransactionReceipt(hash), 'the revoke receipt');
        assert.equal(await notaryState(0), 2, 'notary 0 is revoked on chain');

        const status = await result('getbridgestatus');
        assert.equal(status.notaries[0].state, 2);
        assert.equal(status.activenotaries, 2);
        assert.equal(status.votesrequired, 2);

        // a revoked notary cannot revoke again or vote
        await failure('revokeidentity');
    } finally {
        await rpc('evm_revert', [snapshot]);
    }
});

test('stop shuts the keeper down', async (t) => {
    const exit = t.mock.method(process, 'exit', () => {});
    const reply = await result('stop');
    assert.match(String(reply), /stopping/);
    await sleep(800);
    assert.equal(exit.mock.callCount(), 1, 'the keeper exits after answering');
});
