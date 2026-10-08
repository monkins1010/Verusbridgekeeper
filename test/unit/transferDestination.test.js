'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const util = require('../../utils.js');
const constants = require('../../constants.js');
const deserializer = require('../../deserializer.js');

const bytes = (fill, length = 20) => Buffer.alloc(length, fill);
const hex = (buffer) => '0x' + buffer.toString('hex');
const rAddress = (fill) => util.uint160ToVAddress(hex(bytes(fill)), constants.RADDRESS);
const iAddress = (fill) => util.uint160ToVAddress(hex(bytes(fill)), constants.IADDRESS);
const feesLE = (sats) => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(sats)); return b; };

const serialize = (ctd) => util.serializeCTransferDestination(ctd);
const deserialize = (buffer) => deserializer.readTranferdestination({ stream: buffer, output: {} }).retVal;

test('serializes a PKH destination from a base58 address', () => {
    const out = serialize({ type: constants.DEST_PKH, address: rAddress(1) });
    assert.equal(out.toString('hex'), '02' + '14' + '01'.repeat(20));
});

test('serializes an ID destination from a base58 address', () => {
    const out = serialize({ type: constants.DEST_ID, address: iAddress(2) });
    assert.equal(out.toString('hex'), '04' + '14' + '02'.repeat(20));
});

test('accepts PKH/ID addresses already converted to hex by the contracts', () => {
    const out = serialize({ type: constants.DEST_PKH, address: hex(bytes(3)) });
    assert.equal(out.toString('hex'), '02' + '14' + '03'.repeat(20));
});

test('serializes ETH and PK destinations from hex', () => {
    assert.equal(serialize({ type: constants.DEST_ETH, address: hex(bytes(4)) }).toString('hex'), '09' + '14' + '04'.repeat(20));
    assert.equal(serialize({ type: constants.DEST_PK, address: hex(bytes(2, 33)) }).toString('hex'), '01' + '21' + '02'.repeat(33));
});

test('serializes DEST_RAW, ETHNFT, FULLID and REGISTERCURRENCY payloads', () => {
    assert.equal(serialize({ type: constants.DEST_RAW, address: '0xaabbcc' }).toString('hex'), '0b' + '03' + 'aabbcc');
    assert.equal(
        serialize({ type: constants.DEST_ETHNFT, contract: hex(bytes(5)), tokenid: hex(bytes(6, 32)) }).toString('hex'),
        '0a' + '34' + '05'.repeat(20) + '06'.repeat(32));
    assert.equal(serialize({ type: constants.DEST_FULLID, serializeddata: 'aabbccdd' }).toString('hex'), '05' + '04' + 'aabbccdd');
    assert.equal(serialize({ type: constants.DEST_REGISTERCURRENCY, serializeddata: 'aabb' }).toString('hex'), '06' + '02' + 'aabb');
});

test('DEST_INVALID serializes as type byte and an empty destination, like C++', () => {
    assert.equal(serialize({ type: constants.DEST_INVALID }).toString('hex'), '0000');
});

test('writes the gateway leg: gatewayID, gatewayCode and signed int64 little endian fees', () => {
    const out = serialize({
        type: constants.DEST_PKH | constants.FLAG_DEST_GATEWAY,
        address: rAddress(1),
        gateway: iAddress(7),
        fees: '1.00000001'
    });
    assert.equal(out.toString('hex'),
        '82' + '14' + '01'.repeat(20) + '07'.repeat(20) + '00'.repeat(20) + '01e1f50500000000');
});

test('gateway leg accepts gatewayid / gatewaycode and hex gateway ids', () => {
    const out = serialize({
        type: constants.DEST_ID | constants.FLAG_DEST_GATEWAY,
        address: iAddress(1),
        gatewayid: hex(bytes(7)),
        gatewaycode: iAddress(8),
        fees: '0.5'
    });
    assert.equal(out.toString('hex'),
        '84' + '14' + '01'.repeat(20) + '07'.repeat(20) + '08'.repeat(20) + feesLE(50000000).toString('hex'));
});

test('gateway flag without a gateway id is rejected', () => {
    assert.throws(() => serialize({ type: constants.DEST_ETH | constants.FLAG_DEST_GATEWAY, address: hex(bytes(1)) }), /Gateway/);
});

test('serializes auxiliary destinations as length prefixed serialized destinations', () => {
    const out = serialize({
        type: constants.DEST_ETH | constants.FLAG_DEST_AUX,
        address: hex(bytes(1)),
        auxdests: [{ type: constants.DEST_PKH, address: rAddress(2) }, { type: constants.DEST_ETH, address: hex(bytes(3)) }]
    });
    assert.equal(out.toString('hex'),
        '49' + '14' + '01'.repeat(20) +
        '02' +
        '16' + '02' + '14' + '02'.repeat(20) +
        '16' + '09' + '14' + '03'.repeat(20));
});

test('auxiliary destinations may be any simple type, and an empty aux vector writes a zero count', () => {
    const out = serialize({
        type: constants.DEST_PKH | constants.FLAG_DEST_AUX,
        address: rAddress(1),
        auxdests: [{ type: constants.DEST_PK, address: hex(bytes(2, 33)) }, { type: constants.DEST_ID, address: iAddress(3) }]
    });
    assert.equal(out.toString('hex'),
        '42' + '14' + '01'.repeat(20) + '02' + '23' + '01' + '21' + '02'.repeat(33) + '16' + '04' + '14' + '03'.repeat(20));
    assert.equal(
        serialize({ type: constants.DEST_PKH | constants.FLAG_DEST_AUX, address: rAddress(1), auxdests: [] }).toString('hex'),
        '42' + '14' + '01'.repeat(20) + '00');
});

test('gateway leg is written before the aux vector', () => {
    const out = serialize({
        type: constants.DEST_PKH | constants.FLAG_DEST_GATEWAY | constants.FLAG_DEST_AUX,
        address: rAddress(1),
        gateway: iAddress(7),
        fees: '0',
        auxdests: [{ type: constants.DEST_ETH, address: hex(bytes(3)) }]
    });
    assert.equal(out.toString('hex'),
        'c2' + '14' + '01'.repeat(20) + '07'.repeat(20) + '00'.repeat(20) + '00'.repeat(8) +
        '01' + '16' + '09' + '14' + '03'.repeat(20));
});

test('nested auxiliary destinations and nested transfers are rejected', () => {
    assert.throws(() => serialize({
        type: constants.DEST_ETH | constants.FLAG_DEST_AUX,
        address: hex(bytes(1)),
        auxdests: [{ type: constants.DEST_ETH | constants.FLAG_DEST_AUX, address: hex(bytes(2)), auxdests: [] }]
    }), /Nested auxiliary/);
    assert.throws(() => serialize({ type: constants.DEST_NESTEDTRANSFER, address: '0x00' }), /Nested transfers/);
});

test('rejects invalid types and malformed addresses', () => {
    assert.throws(() => serialize({ type: 12, address: hex(bytes(1)) }), /Unsupported destination type/);
    assert.throws(() => serialize({ type: 300, address: hex(bytes(1)) }), /Invalid destination type/);
    assert.throws(() => serialize({ type: constants.DEST_ETH, address: '0x1234' }), /20 bytes/);
    assert.throws(() => serialize({ type: constants.DEST_PK, address: hex(bytes(1, 20)) }), /33 bytes/);
    assert.throws(() => serialize({ type: constants.DEST_RAW, address: '0xzz' }), /hex/);
    assert.throws(() => serialize({ type: constants.DEST_PKH, address: 'not-an-address' }));
});

test('uses a multi byte CompactSize for large payloads', () => {
    const out = serialize({ type: constants.DEST_RAW, address: '0x' + 'ab'.repeat(300) });
    assert.equal(out.subarray(0, 4).toString('hex'), '0bfd2c01');
    assert.equal(out.length, 4 + 300);
});

// Contract style bytes: type, 20, then destinationaddress which already holds gateway, code, fees and aux
const contractBytes = (type, tail) => Buffer.concat([Buffer.from([type, 20]), ...tail]);
const auxVector = (type, address) => Buffer.concat([Buffer.from([1, 22, type, 20]), address]);

const roundTrips = {
    'plain ETH': contractBytes(constants.DEST_ETH, [bytes(1)]),
    'plain PKH': contractBytes(constants.DEST_PKH, [bytes(1)]),
    'plain ID': contractBytes(constants.DEST_ID, [bytes(1)]),
    'ETH + gateway': contractBytes(constants.DEST_ETH | constants.FLAG_DEST_GATEWAY, [bytes(1), bytes(7), bytes(0), feesLE(100000001)]),
    'ETH + gateway code': contractBytes(constants.DEST_ETH | constants.FLAG_DEST_GATEWAY, [bytes(1), bytes(7), bytes(8), feesLE(5)]),
    'ETH + aux ETH': contractBytes(constants.DEST_ETH | constants.FLAG_DEST_AUX, [bytes(1), auxVector(constants.DEST_ETH, bytes(2))]),
    'PKH + aux ID': contractBytes(constants.DEST_PKH | constants.FLAG_DEST_AUX, [bytes(1), auxVector(constants.DEST_ID, bytes(2))]),
    'ETH + gateway + aux (bridge return transfer)': contractBytes(
        constants.DEST_ETH | constants.FLAG_DEST_GATEWAY | constants.FLAG_DEST_AUX,
        [bytes(1), bytes(7), bytes(0), feesLE(1000000), auxVector(constants.DEST_PKH, bytes(2))]),
    'PK': Buffer.concat([Buffer.from([constants.DEST_PK, 33]), bytes(2, 33)]),
    'RAW': Buffer.concat([Buffer.from([constants.DEST_RAW, 3]), Buffer.from('aabbcc', 'hex')]),
    'ETHNFT': Buffer.concat([Buffer.from([constants.DEST_ETHNFT, 52]), bytes(5), bytes(6, 32)])
};

for (const [name, original] of Object.entries(roundTrips)) {
    test(`deserialize then serialize reproduces the original bytes: ${name}`, () => {
        const parsed = deserialize(original);
        assert.equal(serialize(parsed).toString('hex'), original.toString('hex'));
    });
}

test('deserialized output uses the daemon JSON shape', () => {
    const parsed = deserialize(roundTrips['ETH + gateway + aux (bridge return transfer)']);
    assert.equal(parsed.type, constants.DEST_ETH | constants.FLAG_DEST_GATEWAY | constants.FLAG_DEST_AUX);
    assert.equal(parsed.address, hex(bytes(1)));
    assert.equal(parsed.gateway, iAddress(7));
    assert.equal(parsed.fees, '0.01000000');
    assert.deepEqual(parsed.auxdests, [{ type: constants.DEST_PKH, address: rAddress(2) }]);
});

test('daemon notarization proposer shapes serialize', () => {
    assert.equal(serialize({ type: constants.DEST_ETH, address: hex(bytes(1)) }).toString('hex'), '09' + '14' + '01'.repeat(20));
    assert.equal(serialize({
        type: constants.DEST_ETH | constants.FLAG_DEST_AUX,
        address: hex(bytes(1)),
        auxdests: [{ type: constants.DEST_ETH, address: hex(bytes(2)) }]
    }).toString('hex'), '49' + '14' + '01'.repeat(20) + '01' + '16' + '09' + '14' + '02'.repeat(20));
    assert.equal(serialize({
        type: constants.DEST_ID | constants.FLAG_DEST_GATEWAY,
        address: iAddress(1),
        gateway: iAddress(7),
        fees: '1.00000001'
    }).toString('hex'), '84' + '14' + '01'.repeat(20) + '07'.repeat(20) + '00'.repeat(20) + '01e1f50500000000');
});

// The contract serializes a destination as type, CompactSize(20), destinationaddress
const contractSerialization = (destinationtype, destinationaddress) =>
    Buffer.concat([Buffer.from([destinationtype, 20]), Buffer.from(destinationaddress.slice(2), 'hex')]).toString('hex');

test('fixEthTransferDestinations converts contract destinations and re-serializes to the contract bytes', () => {
    const { fixEthTransferDestinations } = require('../../ethInteractor.js');

    const cases = [
        { destinationtype: constants.DEST_PKH, destinationaddress: hex(bytes(1)) },
        { destinationtype: constants.DEST_ID, destinationaddress: hex(bytes(1)) },
        { destinationtype: constants.DEST_ETH, destinationaddress: hex(bytes(1)) },
        {
            destinationtype: constants.DEST_ETH | constants.FLAG_DEST_GATEWAY | constants.FLAG_DEST_AUX,
            destinationaddress: hex(Buffer.concat([bytes(1), bytes(7), bytes(0), feesLE(1000000), auxVector(constants.DEST_PKH, bytes(2))]))
        }
    ];

    const transfers = cases.map((destination) => ({ flags: 1, destination }));
    const fixed = fixEthTransferDestinations(transfers);

    assert.equal(fixed.length, cases.length);
    fixed.forEach((transfer, i) => {
        assert.notEqual(transfer, transfers[i]);
        assert.equal(transfers[i].destination.destinationtype, cases[i].destinationtype, 'input is not mutated');
        assert.equal(transfer.flags, 1);
        assert.equal(serialize(transfer.destination).toString('hex'),
            contractSerialization(cases[i].destinationtype, cases[i].destinationaddress));
    });

    assert.equal(fixed[0].destination.address, rAddress(1));
    assert.equal(fixed[1].destination.address, iAddress(1));
    assert.equal(fixed[2].destination.address, hex(bytes(1)));
    assert.equal(fixed[3].destination.gateway, iAddress(7));
    assert.equal(fixed[3].destination.fees, '0.01000000');
    assert.deepEqual(fixed[3].destination.auxdests, [{ type: constants.DEST_PKH, address: rAddress(2) }]);
});
