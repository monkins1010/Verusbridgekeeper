'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { APIs } = require('../../apiFunctions.js');

// Every RPC method the daemon (or an operator) can call, and the ethInteractor export it dispatches to.
const ROUTES = {
    getinfo: 'getInfo',
    getcurrency: 'getCurrency',
    getexports: 'getExports',
    getnotarizationdata: 'getNotarizationData',
    getbestproofroot: 'getBestProofRoot',
    getlastimportfrom: 'getLastImportFrom',
    getpendingqueuestate: 'getPendingQueueState',
    getbridgestatus: 'getBridgeStatus',
    getclaimablefees: 'getclaimablefees',
    submitimports: 'submitImports',
    submitacceptednotarization: 'submitAcceptedNotarization',
    approveorrejectacceptedimport: 'approveOrRejectAcceptedImport',
    revokeidentity: 'revokeidentity',
    stop: 'stop',
};

test('every RPC method maps to its interactor function', () => {
    for (const [method, target] of Object.entries(ROUTES)) {
        assert.equal(APIs(method), target, method);
    }
});

test('every mapped function exists on ethInteractor (no dead routes)', () => {
    const ethInteractor = require('../../ethInteractor.js');
    for (const target of Object.values(ROUTES)) {
        assert.equal(typeof ethInteractor[target], 'function', target + ' is not exported by ethInteractor');
    }
    assert.equal(typeof ethInteractor.invalid, 'function');
});

test('methods are case sensitive and unknown or removed methods resolve to "invalid"', () => {
    for (const method of ['GETINFO', 'getInfo', '', undefined, null, 'releasependingimport', 'submitacceptedimportvote',
        'submitHaltVote', 'haltbridge', '__proto__', 'constructor', 'toString']) {
        assert.equal(APIs(method), 'invalid', String(method));
    }
});
