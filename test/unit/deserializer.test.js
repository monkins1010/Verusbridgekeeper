'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const d = require('../../deserializer.js');
const util = require('../../utils.js');
const constants = require('../../constants.js');

const mem = (hex) => ({ stream: Buffer.from(hex, 'hex'), output: {} });

test('readCompactInt reads the 1, 3, 5 and 9 byte forms and advances the stream', () => {
    const cases = [
        ['05' + 'ee', 5, 1], ['fc' + 'ee', 252, 1],
        ['fd0001' + 'ee', 256, 3], ['fdffff' + 'ee', 65535, 3],
        ['fe00000100' + 'ee', 65536, 5], ['feffffffff' + 'ee', 0xffffffff, 5],
        ['ff0000000001000000' + 'ee', 0x100000000, 9],
    ];
    for (const [hex, value, consumed] of cases) {
        const { retval, memory } = d.readCompactInt(mem(hex));
        assert.equal(retval, value, hex);
        assert.equal(memory.stream.length, 1, 'bytes left for ' + hex + ' after consuming ' + consumed);
    }
});

test('readCompactInt rejects a 64 bit size beyond the safe integer range', () => {
    assert.throws(() => d.readCompactInt(mem('ffffffffffffffffff')), /too large/);
});

test('readVarIntPos reads a varint and advances the stream', () => {
    for (const n of [0, 1, 127, 128, 300, 16384, 2 ** 32]) {
        const bytes = Buffer.concat([util.writeVarInt(n), Buffer.from('ee', 'hex')]);
        const { retval, memory } = d.readVarIntPos({ stream: bytes });
        assert.equal(retval, String(n));
        assert.equal(memory.stream.toString('hex'), 'ee');
    }
});

test('readtype reads fixed width little endian values', () => {
    assert.equal(d.readtype(mem('ff'), 'uint', 8).retval, 255);
    assert.equal(d.readtype(mem('0100'), 'uint', 16).retval, 1);
    assert.equal(d.readtype(mem('01000000'), 'uint', 32).retval, 1);
    assert.equal(d.readtype(mem('0100000000000000'), 'uint', 64).retval, 1n);
    assert.equal(d.readtype(mem('11'.repeat(20)), 'uint', 160).retval, '0x' + '11'.repeat(20));
    assert.equal(d.readtype(mem('22'.repeat(32)), 'uint', 256).retval, '0x' + '22'.repeat(32));
    const arr = d.readtype(mem('aabbcc'), 'array', 2);
    assert.equal(arr.retval, '0xaabb');
    assert.equal(arr.memory.stream.toString('hex'), 'cc');
});

test('readTranferdestination reads a plain R address destination', () => {
    const hash = '11'.repeat(20);
    const { retVal, memory } = d.readTranferdestination(mem('02' + '14' + hash + 'ee'));
    assert.equal(retVal.type, 2);
    assert.equal(retVal.address, util.uint160ToVAddress('0x' + hash, constants.RADDRESS));
    assert.equal(memory.stream.toString('hex'), 'ee');
});

test('readTranferdestination reads an ETH destination as the raw address', () => {
    const hash = '22'.repeat(20);
    const { retVal } = d.readTranferdestination(mem(constants.ETH_ADDRESS_TYPE.toString(16).padStart(2, '0') + '14' + hash));
    assert.equal(retVal.address, '0x' + hash);
});

test('readTranferdestination reads gateway fields and aux destinations', () => {
    const dest = '33'.repeat(20);
    const gateway = '44'.repeat(20);
    const code = '00'.repeat(20);
    const fees = '0100000000000000';
    const inner = '02' + '14' + '55'.repeat(20);
    const type = (2 | 128 | 64).toString(16).padStart(2, '0');
    const hex = type + '14' + dest + gateway + code + fees + '01' + (inner.length / 2).toString(16).padStart(2, '0') + inner + 'ee';
    const { retVal, memory } = d.readTranferdestination(mem(hex));
    assert.equal(retVal.fees, '0.00000001');
    assert.equal(retVal.gateway, util.uint160ToVAddress('0x' + gateway, constants.IADDRESS));
    assert.equal(retVal.gatewaycode, undefined);
    assert.deepEqual(retVal.auxdests, [{ type: 2, address: util.uint160ToVAddress('0x' + '55'.repeat(20), constants.RADDRESS) }]);
    assert.equal(memory.stream.toString('hex'), 'ee');
});

test('deserializeIntArray / ReservesArray / WeightsArray / ReserveCurrenciesArray', () => {
    const le64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b.toString('hex'); };
    const le32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b.toString('hex'); };

    assert.deepEqual(d.deserializeIntArray(mem('02' + le64(100000000) + le64(1)), 64), ['1.00000000', '0.00000001']);
    assert.deepEqual(d.deserializeReservesArray(mem('01' + le64(250000000))), ['2.50000000']);
    assert.deepEqual(d.deserializeReserveWeightsArray(mem('01' + le32(50000000))), ['0.50000000']);
    assert.deepEqual(d.deserializeIntArray(mem('00'), 64), []);

    const currency = '67460c2f56774ed27eeb8685f29f6cec0b090b00';
    assert.deepEqual(d.deserializeReserveCurrenciesArray(mem('01' + currency)),
        [util.uint160ToVAddress('0x' + currency, constants.IADDRESS)]);
});

test('deserializeCurrenciesArray maps the eight arrays onto the currency ids', () => {
    const le64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b.toString('hex'); };
    const le32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b.toString('hex'); };
    const sixtyFour = '01' + le64(100000000);
    const hex = sixtyFour.repeat(6) + '01' + le32(10000000) + sixtyFour;
    const result = d.deserializeCurrenciesArray(mem(hex), [{ currencyid: 'iA' }]);
    assert.equal(result.iA.reservein, '1.00000000');
    assert.equal(result.iA.priorweights, '0.10000000');
    assert.equal(result.iA.conversionfees, '1.00000000');
});

test('readCompactInt and readtype throw on truncated input rather than returning garbage', () => {
    assert.throws(() => d.readCompactInt(mem('fd01')));
    assert.throws(() => d.readtype(mem('01'), 'uint', 32));
});
