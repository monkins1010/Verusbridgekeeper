'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Subscription = require('web3-core-subscriptions/lib/subscription.js');
const formatter = require('web3-core-helpers').formatters;
const ethers = require('ethers');
const { _internal } = require('../../ethInteractor.js');

// Delivers notifications through web3's own Subscription dispatch, as the websocket provider would.
function subscribeWithFakeProvider(definition, callback, ...params) {
    let deliver;
    const requestManager = {
        provider: { on: () => {} },
        send: (payload, cb) => cb(null, '0x1'),
        addSubscription: (sub, cb) => { deliver = cb; },
        removeSubscription: () => {},
    };
    const subscription = new Subscription({ subscription: definition, type: 'eth', requestManager });
    subscription.subscribe(definition.subscriptionName, ...params, callback);
    _internal.guardSubscription(subscription, 'test');
    return (result) => deliver(null, result);
}

const goodHeader = {
    number: '0x10', hash: '0x' + 'ab'.repeat(32), parentHash: '0x' + 'cd'.repeat(32), timestamp: '0x5',
    gasLimit: '0x1c9c380', gasUsed: '0x0', miner: '0x' + '11'.repeat(20), difficulty: '0x0', totalDifficulty: '0x0',
};

test('a malformed newHeads notification is dropped instead of throwing out of the provider', () => {
    const received = [];
    const deliver = subscribeWithFakeProvider(
        { subscriptionName: 'newHeads', params: 0, outputFormatter: formatter.outputBlockFormatter },
        (error, header) => received.push(header));

    for (const bad of [{ ...goodHeader, gasLimit: '123' }, { ...goodHeader, miner: '0x12' }, { ...goodHeader, miner: 5 }]) {
        assert.doesNotThrow(() => deliver(bad));
    }
    assert.ok(received.every(header => header == null), 'malformed headers reach the callback as null');

    deliver(goodHeader);
    assert.equal(received[received.length - 1].number, 16);
});

test('isValidBlockHeader refuses null and malformed headers', () => {
    assert.equal(_internal.isValidBlockHeader(null), false);
    assert.equal(_internal.isValidBlockHeader({ number: '16', hash: goodHeader.hash, timestamp: 5 }), false);
    assert.equal(_internal.isValidBlockHeader({ number: 16, hash: '0x12', timestamp: 5 }), false);
    assert.equal(_internal.isValidBlockHeader({ number: 16, hash: goodHeader.hash, timestamp: 5 }), true);
});

test('a logs handler that throws on a dropped notification is skipped', () => {
    let handled = 0;
    const deliver = subscribeWithFakeProvider({
        subscriptionName: 'logs', params: 1,
        outputFormatter: () => { throw new Error('bad log'); },
        subscriptionHandler: function (output) { handled++; return output.removed; },
    }, () => {}, { address: '0x' + '11'.repeat(20) });
    assert.doesNotThrow(() => deliver({}));
    assert.equal(handled, 0);
});

test('readPendingImportState reads the state field from an encoded pending import', () => {
    const send = 'tuple(address currency,uint64 amount,address destination,uint176 refundAddress,uint32 launchTxIndexPlusOne)';
    const launch = 'tuple(uint256 tokenID,address ERCContract,address iaddress,address parent,uint8 flags,string name)';
    const pending = `tuple(bytes32 importTxid,uint32 nout,bytes32 confirmedNotarizationTxid,uint32 confirmedNotarizationN,${send}[] transfers,${launch}[] launchTxs,uint64 fees,uint128 cceHeightsAndIndex,uint176[3] exporters,uint64 nonce,uint64 submittedAt,uint8 state)`;
    const zero = '0x' + '00'.repeat(20);
    for (const state of [1, 2, 3]) {
        const encoded = ethers.utils.defaultAbiCoder.encode([pending], [{
            importTxid: '0x' + '11'.repeat(32), nout: 1, confirmedNotarizationTxid: '0x' + '22'.repeat(32), confirmedNotarizationN: 2,
            transfers: [{ currency: zero, amount: 5, destination: zero, refundAddress: 7, launchTxIndexPlusOne: 1 }],
            launchTxs: [{ tokenID: 9, ERCContract: zero, iaddress: zero, parent: zero, flags: 34, name: 'abc' }],
            fees: 3, cceHeightsAndIndex: 4, exporters: [1, 2, 3], nonce: 5, submittedAt: 6, state,
        }]);
        assert.equal(_internal.readPendingImportState(encoded), state);
    }
    assert.equal(_internal.readPendingImportState('0x1234'), null);
});
