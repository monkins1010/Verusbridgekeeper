'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const util = require('../../utils.js');
const constants = require('../../constants.js');

test('addHexPrefix / removeHexLeader', () => {
    assert.equal(util.addHexPrefix('abcd'), '0xabcd');
    assert.equal(util.addHexPrefix('0xabcd'), '0xabcd');
    assert.equal(util.removeHexLeader('0xabcd'), 'abcd');
    assert.equal(util.removeHexLeader('abcd'), 'abcd');
    assert.equal(util.addBytesIndicator('ab'), '0xab');
});

test('uint64ToVerusFloat formats 8 decimals, including zero, large and negative values', () => {
    assert.equal(util.uint64ToVerusFloat(0), '0.00000000');
    assert.equal(util.uint64ToVerusFloat(1), '0.00000001');
    assert.equal(util.uint64ToVerusFloat(100000000), '1.00000000');
    assert.equal(util.uint64ToVerusFloat('1234567890123'), '12345.67890123');
    assert.equal(util.uint64ToVerusFloat(-150000000), '-1.50000000');
    assert.equal(util.uint64ToVerusFloat(18446744073709551615n), '184467440737.09551615');
});

test('weitoEther formats 18 decimals', () => {
    assert.equal(util.weitoEther('1000000000000000000'), '1.000000000000000000');
    assert.equal(util.weitoEther('1'), '0.000000000000000001');
    assert.equal(util.weitoEther('1003000000000000000'), '1.003000000000000000');
});

test('convertToInt64 converts to 8-decimal atomic units and rejects bad input', () => {
    assert.equal(util.convertToInt64('1'), '100000000');
    assert.equal(util.convertToInt64('0.00000001'), '1');
    assert.equal(util.convertToInt64(2.5), '250000000');
    assert.throws(() => util.convertToInt64(''), /required/);
    assert.throws(() => util.convertToInt64(undefined), /required/);
    assert.throws(() => util.convertToInt64(null), /required/);
    assert.throws(() => util.convertToInt64('abc'), /finite/);
    assert.throws(() => util.convertToInt64('0.000000001'), /8 decimal/);
    assert.throws(() => util.convertToInt64('92233720368.54775808'), /int64/);
    assert.equal(util.convertToInt64('92233720368.54775807'), '9223372036854775807');
});

test('writeVarInt / readVarInt round trip, and reject invalid values', () => {
    for (const n of [0, 1, 127, 128, 255, 256, 16383, 16384, 65535, 2 ** 32, 2 ** 40, '18446744073709551615']) {
        const encoded = util.writeVarInt(n);
        assert.equal(util.readVarInt(encoded.toString('hex')), BigInt(n), 'value ' + n);
    }
    assert.equal(util.writeVarInt(0).toString('hex'), '00');
    assert.equal(util.writeVarInt(127).toString('hex'), '7f');
    assert.equal(util.writeVarInt(128).toString('hex'), '8000');
    assert.throws(() => util.writeVarInt(-1), /non-negative/);
    assert.throws(() => util.writeVarInt(1.5), /non-negative/);
    assert.throws(() => util.writeVarInt(''), /non-negative/);
    assert.throws(() => util.writeVarInt(null), /non-negative/);
    assert.throws(() => util.writeVarInt('18446744073709551616'), /uint64/);
});

test('writeCompactSize uses the 1, 3, 5 and 9 byte forms', () => {
    assert.equal(util.writeCompactSize(0).toString('hex'), '00');
    assert.equal(util.writeCompactSize(252).toString('hex'), 'fc');
    assert.equal(util.writeCompactSize(253).toString('hex'), 'fdfd00');
    assert.equal(util.writeCompactSize(0xffff).toString('hex'), 'fdffff');
    assert.equal(util.writeCompactSize(0x10000).toString('hex'), 'fe00000100');
    assert.equal(util.writeCompactSize(0xffffffff).toString('hex'), 'feffffffff');
    assert.equal(util.writeCompactSize(0x100000000).toString('hex'), 'ff0000000001000000');
});

test('writeCompactSize output is read back by the deserializer', () => {
    const { readCompactInt } = require('../../deserializer.js');
    for (const n of [0, 1, 252, 253, 65535, 65536, 0xffffffff, 0x100000000]) {
        const { retval, memory } = readCompactInt({ stream: Buffer.concat([util.writeCompactSize(n), Buffer.from('aa', 'hex')]) });
        assert.equal(retval, n);
        assert.equal(memory.stream.toString('hex'), 'aa', 'consumed exactly the size bytes for ' + n);
    }
});

test('writeUInt writes little endian integers of each width', () => {
    assert.equal(util.writeUInt(1, 16).toString('hex'), '0100');
    assert.equal(util.writeUInt(1, 32).toString('hex'), '01000000');
    assert.equal(util.writeUInt(1, 64).toString('hex'), '0100000000000000');
    assert.equal(util.writeUInt(7, 8).toString('hex'), '07');
    assert.equal(util.writeUInt('0x' + 'ab'.repeat(32), 256).toString('hex'), 'ab'.repeat(32));
    assert.equal(util.writeUInt256LE('11'.repeat(32)).length, 32);
    assert.equal(util.writeUInt160LE('x').length, 20);
});

test('increaseHexByAmount', () => {
    assert.equal(util.increaseHexByAmount('0x10', 1), '0x11');
    assert.equal(util.increaseHexByAmount('0xff', 1), '0x100');
});

test('splitSignature / splitSignatures split v, r and s', () => {
    const r = '11'.repeat(32);
    const s = '22'.repeat(32);
    const sig = '1b' + r + s;
    assert.deepEqual(util.splitSignature(sig), { vVal: 0x1b, rVal: '0x' + r, sVal: '0x' + s });
    const many = util.splitSignatures([sig, '1c' + s + r]);
    assert.deepEqual(many.vsVals, [0x1b, 0x1c]);
    assert.deepEqual(many.rsVals, ['0x' + r, '0x' + s]);
    assert.deepEqual(many.ssVals, ['0x' + s, '0x' + r]);
});

test('i-address conversion round trips and matches the testnet vETH constants', () => {
    const veth = 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm';
    const hex = util.convertVerusAddressToEthAddress(veth);
    assert.equal(hex, '0x67460c2f56774ed27eeb8685f29f6cec0b090b00');
    assert.equal(util.uint160ToVAddress(hex, constants.IADDRESS), veth);
    assert.equal(util.ethAddressToVAddress, util.uint160ToVAddress);
    const hash = '0x' + '11'.repeat(20);
    assert.equal(util.convertToRAddress(util.uint160ToVAddress(hash, constants.RADDRESS)), hash);
});

test('hexAddressToBase58 picks the encoding from the destination type', () => {
    const hash = '0x' + '11'.repeat(20);
    assert.equal(util.hexAddressToBase58(constants.I_ADDRESS_TYPE, hash), util.uint160ToVAddress(hash, constants.IADDRESS));
    assert.equal(util.hexAddressToBase58(constants.R_ADDRESS_TYPE, hash), util.uint160ToVAddress(hash, constants.RADDRESS));
    assert.equal(util.hexAddressToBase58(constants.ETH_ADDRESS_TYPE, hash), hash);
});

test('randomPassAndUser returns a fresh long password and user', () => {
    const a = util.randomPassAndUser();
    const b = util.randomPassAndUser();
    assert.ok(a && b);
    assert.notDeepEqual(a, b);
    assert.ok(JSON.stringify(a).length > 32);
});

test('encodeSignatures and serializeCTransferDestination exist and are functions', () => {
    for (const name of ['encodeSignatures', 'serializeCTransferDestination', 'serializeCCurrencyValueMapArray',
        'serializeReservesArray', 'GetMMRProofIndex', 'convertToCurrencyValues', 'convertToUint256']) {
        assert.equal(typeof util[name], 'function', name);
    }
});

test('GetMMRProofIndex returns 0 for positions outside the tree', () => {
    assert.equal(util.GetMMRProofIndex(0, 5, 0), 0);
    assert.equal(util.GetMMRProofIndex(5, 5, 0), 0);
    assert.equal(util.GetMMRProofIndex(9, 5, 0), 0);
});

test('BigDecimal does 18 decimal fixed point arithmetic', () => {
    assert.equal(new util.BigDecimal('1.5').add('2.25').toString(), '3.75');
    assert.equal(new util.BigDecimal('5').subtract('0.5').toString(), '4.5');
    assert.equal(new util.BigDecimal('1.5').multiply('2').toString(), '3.');
    assert.equal(new util.BigDecimal('1').divide('4').toString(), '0.25');
});
