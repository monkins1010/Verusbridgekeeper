'use strict';
/**
 * HTTP layer of the bridgekeeper (index.js) with a stubbed ethInteractor: authentication, IP gate,
 * request parsing, dispatch of every RPC method with its params, status code mapping and the request queue.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'keeper-home-'));

const ethInteractor = require('../../ethInteractor.js');
const server = require('../../index.js');

const USER = 'rpcuser';
const PASS = 'rpcpass';
const METHODS = {
    getinfo: 'getInfo', getcurrency: 'getCurrency', getexports: 'getExports', getnotarizationdata: 'getNotarizationData',
    getbestproofroot: 'getBestProofRoot', getlastimportfrom: 'getLastImportFrom', getpendingqueuestate: 'getPendingQueueState',
    getbridgestatus: 'getBridgeStatus', getclaimablefees: 'getclaimablefees', submitimports: 'submitImports',
    submitacceptednotarization: 'submitAcceptedNotarization', approveorrejectacceptedimport: 'approveOrRejectAcceptedImport',
    revokeidentity: 'revokeidentity',
};

const calls = [];
const behaviours = {};
let port;

const { freePort, post: rawPost } = require('../helpers/rpc.js');
const post = (body, options) => rawPost(port, `${USER}:${PASS}`, body, options);

function request(method, auth = `${USER}:${PASS}`) {
    return new Promise((resolve, reject) => {
        const headers = auth === null ? {} : { Authorization: 'Basic ' + Buffer.from(auth).toString('base64') };
        const req = http.request({ host: '127.0.0.1', port, method, headers }, (res) => {
            res.resume();
            res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', reject);
        req.end();
    });
}

test.before(async () => {
    port = await freePort();
    // Replace the interactor with recording stubs; the server resolves the functions at call time.
    for (const fn of Object.values(METHODS)) {
        ethInteractor[fn] = async (params) => {
            calls.push({ fn, params });
            return behaviours[fn] ? behaviours[fn](params) : { result: { handled: fn } };
        };
    }
    ethInteractor.invalid = async () => { calls.push({ fn: 'invalid' }); return { result: { error: true, message: 'Unrecognized API call' } }; };
    ethInteractor.stop = async () => { calls.push({ fn: 'stop' }); return { result: 'Bridgekeeper server stopping' }; };
    ethInteractor.web3status = async () => true;
    ethInteractor.end = async () => {};
    ethInteractor.init = async () => port;
    Object.assign(ethInteractor.InteractorConfig, {
        _userpass: `${USER}:${PASS}`, _rpchost: '127.0.0.1', _rpcallowip: '127.0.0.1', _consolelog: false,
    });
    await server.start({ ticker: 'VRSCTEST' });
});

test.after(() => { server.stop(); });
test.beforeEach(() => { calls.length = 0; for (const k of Object.keys(behaviours)) delete behaviours[k]; });

test('rejects missing and wrong credentials with 401', async () => {
    assert.equal((await post({ method: 'getinfo' }, { auth: null })).status, 401);
    assert.equal((await post({ method: 'getinfo' }, { auth: `${USER}:wrong` })).status, 401);
    assert.equal((await post({ method: 'getinfo' }, { auth: `wrong:${PASS}` })).status, 401);
    assert.equal((await post({ method: 'getinfo' }, { auth: '' })).status, 401);
    assert.equal(calls.length, 0, 'unauthenticated requests never reach the interactor');
});

test('GET answers 200 for an authenticated client (health check) and never dispatches', async () => {
    assert.equal(await request('GET'), 200);
    assert.equal(await request('GET', null), 401);
    assert.equal(calls.length, 0);
});

test('an empty body is a 400 and invalid JSON is a 500 with an error result', async () => {
    const empty = await post('', { raw: true });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.result.error, true);
    const bad = await post('{not json', { raw: true });
    assert.equal(bad.status, 500);
    assert.equal(bad.body.result.error, true);
    assert.equal(calls.length, 0);
});

for (const [method, fn] of Object.entries(METHODS)) {
    test(`RPC ${method} dispatches to ${fn} with its params and returns 200`, async () => {
        const params = [method, 1, { nested: ['x'] }];
        const reply = await post({ jsonrpc: '1.0', id: 7, method, params });
        assert.equal(reply.status, 200);
        assert.deepEqual(reply.body, { result: { handled: fn } });
        assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ fn, params }]);
    });

    test(`RPC ${method} maps an error result to HTTP 402`, async () => {
        behaviours[fn] = () => ({ result: { error: true, message: 'boom' } });
        const reply = await post({ method, params: [] });
        assert.equal(reply.status, 402);
        assert.deepEqual(reply.body, { result: { error: true, message: 'boom' } });
    });

    test(`RPC ${method} maps a thrown exception to HTTP 500`, async () => {
        behaviours[fn] = () => { throw new Error('exploded'); };
        const reply = await post({ method, params: [] });
        assert.equal(reply.status, 500);
        assert.deepEqual(reply.body, { result: { error: true, message: 'exploded' } });
    });
}

test('stop is dispatched', async () => {
    const reply = await post({ method: 'stop', params: [] });
    assert.equal(reply.status, 200);
    assert.deepEqual(calls.map(c => c.fn), ['stop']);
});

test('an unknown method reaches the interactor as "invalid" and is a 402', async () => {
    for (const method of ['nosuchmethod', 'releasependingimport', 'submitacceptedimportvote']) {
        calls.length = 0;
        const reply = await post({ method, params: [] });
        assert.equal(reply.status, 402, method);
        assert.equal(reply.body.result.message, 'Unrecognized API call');
        assert.deepEqual(calls.map(c => c.fn), ['invalid']);
    }
});

test('a request without a method is answered with an error, not a crash', async () => {
    const reply = await post({ params: [] });
    assert.ok([402, 500].includes(reply.status));
    assert.equal(reply.body.result.error, true);
    assert.equal((await post({ method: 'getinfo' })).status, 200, 'server still serves afterwards');
});

test('requests are processed one at a time, in order', async () => {
    const order = [];
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    behaviours.getInfo = async () => { order.push('getInfo:start'); await gate; order.push('getInfo:end'); return { result: 1 }; };
    behaviours.getNotarizationData = async () => { order.push('getNotarizationData'); return { result: 2 }; };

    const first = post({ method: 'getinfo' });
    await new Promise(r => setTimeout(r, 100));
    const second = post({ method: 'getnotarizationdata' });
    await new Promise(r => setTimeout(r, 100));
    assert.deepEqual(order, ['getInfo:start'], 'the second request waits behind the first');
    release();
    const replies = await Promise.all([first, second]);
    assert.deepEqual(replies.map(r => r.status), [200, 200]);
    assert.deepEqual(order, ['getInfo:start', 'getInfo:end', 'getNotarizationData']);
});

test('server.status reports the server running with the websocket ok', async () => {
    const status = await server.status();
    assert.equal(status.serverrunning, 1);
    assert.ok(Array.isArray(status.logs));
    assert.ok(status.logs.length <= 20, 'rolling log is capped');
});

test('server.status reports a websocket fault when the provider is down', async () => {
    const original = ethInteractor.web3status;
    ethInteractor.web3status = async () => false;
    try {
        assert.equal((await server.status()).serverrunning, 3);
    } finally {
        ethInteractor.web3status = original;
    }
});
