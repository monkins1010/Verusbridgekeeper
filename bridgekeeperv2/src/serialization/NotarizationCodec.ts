/**
 * NotarizationCodec — serialize/deserialize notarization data.
 *
 * Implements the Verus binary notarization format used by `setLatestData`.
 * Port of `utilities/notarizationSerializer.js`.
 *
 * Binary layout (serialize):
 *   varint(version) | varint(flags) | CTransferDestination(proposer)
 *   | uint160(currencyid) | CoinbaseCurrencyState
 *   | uint32(notarizationheight) | uint256(prevnotarizationtxid reversed)
 *   | uint32(prevnotarizationout) | uint256(hashprevcrossnotarization reversed)
 *   | uint32(prevheight) | CoinbaseCurrencyStates[] | ProofRoots[] | Nodes[]
 */

import {
    fromBase58Check,
    toBase58Check,
} from 'verus-typescript-primitives';
import {
    I_ADDR_VERSION,
    R_ADDR_VERSION,
} from 'verus-typescript-primitives/dist/constants/vdxf';
import {
    FLAG_START_NOTARIZATION,
    FLAG_LAUNCH_CONFIRMED,
    FLAG_LAUNCH_COMPLETE,
    FLAG_REFUNDING,
    FLAG_CONTRACT_UPGRADE,
    FLAG_FRACTIONAL,
} from '../config/constants';

// ── Helpers ──────────────────────────────────────────────────

/** Reverse bytes in a hex string (pair-wise). */
function reverseBytes(hex: string): string {
    const m = hex.match(/.{2}/g);
    return m ? m.reverse().join('') : hex;
}

function removeHex(h: string): string {
    return h.startsWith('0x') || h.startsWith('0X') ? h.slice(2) : h;
}

function addHex(h: string): string {
    return h.startsWith('0x') ? h : '0x' + h;
}

/** Write a varint (Bitcoin-style variable-length integer). */
function writeVarInt(num: number): Buffer {
    if (!num) return Buffer.from([0]);
    const tmp: number[] = [];
    let n = num;
    let len = 0;
    while (true) {
        tmp[len] = (n & 0x7f) | (len ? 0x80 : 0x00);
        if (n <= 0x7f) break;
        n = Math.floor(n / 128) - 1;
        len++;
    }
    return Buffer.from(tmp.reverse());
}

/** Write a compact size (Bitcoin-style). */
function writeCompactSize(n: number): Buffer {
    if (n < 253) {
        const b = Buffer.alloc(1);
        b.writeUInt8(n);
        return b;
    } else if (n <= 0xffff) {
        const b = Buffer.alloc(3);
        b.writeUInt8(253);
        b.writeUInt16LE(n, 1);
        return b;
    } else if (n <= 0xffffffff) {
        const b = Buffer.alloc(5);
        b.writeUInt8(254);
        b.writeUInt32LE(n, 1);
        return b;
    }
    const b = Buffer.alloc(9);
    b.writeUInt8(255);
    b.writeBigUInt64LE(BigInt(n), 1);
    return b;
}

/** Write a fixed-size unsigned integer (little-endian). */
function writeUInt(value: number | bigint | string, bits: number): Buffer {
    const v = typeof value === 'string' ? BigInt(value) : typeof value === 'number' ? BigInt(value) : value;
    switch (bits) {
        case 16: { const b = Buffer.alloc(2); b.writeUInt16LE(Number(v)); return b; }
        case 32: { const b = Buffer.alloc(4); b.writeUInt32LE(Number(v)); return b; }
        case 64: { const b = Buffer.alloc(8); b.writeBigInt64LE(v); return b; }
        case 160: { const s = v.toString(16).padStart(40, '0'); return Buffer.from(s, 'hex'); }
        case 256: { const s = removeHex(v.toString(16)).padStart(64, '0'); return Buffer.from(s, 'hex'); }
        default: { const b = Buffer.alloc(1); b.writeUInt8(Number(v)); return b; }
    }
}

/** Convert a Verus float string "X.XXXXXXXX" to satoshi bigint. */
function convertToInt64(vf: string | number): bigint {
    const s = String(vf);
    const [whole = '0', frac = ''] = s.split('.');
    const fracPad = frac.padEnd(8, '0').slice(0, 8);
    return BigInt(whole) * 100000000n + BigInt(fracPad);
}

/** Convert satoshi bigint to Verus float "X.XXXXXXXX". */
function uint64ToVerusFloat(sats: bigint): string {
    const SATS = 100000000n;
    const whole = sats / SATS;
    let frac = (sats < 0n ? -(sats % SATS) : sats % SATS).toString();
    while (frac.length < 8) frac = '0' + frac;
    return `${sats < 0n ? '-' : ''}${whole}.${frac}`;
}

// ── Address types ────────────────────────────────────────────

const R_ADDRESS_TYPE = 2;
const I_ADDRESS_TYPE = 4;
const ETH_ADDRESS_TYPE = 9;
const FLAG_DEST_AUX = 64;

/** Encode a CTransferDestination. */
function serializeCTransferDestination(ctd: { type: number; address: string; auxdests?: Array<{ type: number; address: string }> }): Buffer {
    const typeB = Buffer.alloc(1);
    typeB.writeUInt8(ctd.type);
    if (ctd.type === 0) return typeB;

    let destination: Buffer;
    const typeMask = ctd.type & 0x7f;
    if ((typeMask & I_ADDRESS_TYPE) === I_ADDRESS_TYPE || (typeMask & R_ADDRESS_TYPE) === R_ADDRESS_TYPE) {
        destination = fromBase58Check(removeHex(ctd.address)).hash;
    } else if ((typeMask & ETH_ADDRESS_TYPE) === ETH_ADDRESS_TYPE) {
        destination = Buffer.from(removeHex(ctd.address), 'hex');
    } else {
        destination = fromBase58Check(removeHex(ctd.address)).hash;
    }

    let out = Buffer.concat([typeB, writeCompactSize(destination.length), destination]);

    if ((ctd.type & FLAG_DEST_AUX) === FLAG_DEST_AUX && ctd.auxdests) {
        const parts: Buffer[] = [];
        for (const aux of ctd.auxdests) {
            const subType = Buffer.alloc(1);
            subType.writeUInt8(aux.type);
            const subMask = aux.type & 0x7f;
            let subDest: Buffer;
            if ((subMask & I_ADDRESS_TYPE) === I_ADDRESS_TYPE || (subMask & R_ADDRESS_TYPE) === R_ADDRESS_TYPE) {
                subDest = fromBase58Check(removeHex(aux.address)).hash;
            } else {
                subDest = Buffer.from(removeHex(aux.address), 'hex');
            }
            const item = Buffer.concat([subType, writeCompactSize(subDest.length), subDest]);
            parts.push(Buffer.concat([writeCompactSize(item.length), item]));
        }
        out = Buffer.concat([out, writeCompactSize(ctd.auxdests.length), ...parts]);
    }

    return out;
}

// ── Currency state serialization ─────────────────────────

function isFractional(flags: number): boolean {
    return (flags & FLAG_FRACTIONAL) === FLAG_FRACTIONAL;
}

function serializeReserveCurrenciesArray(items: Array<{ currencyid: string }>): Buffer {
    let out = writeCompactSize(items.length);
    for (const item of items) {
        out = Buffer.concat([out, fromBase58Check(item.currencyid).hash]);
    }
    return out;
}

function serializeReserveWeightsArray(items: Array<{ weight: string | number }>): Buffer {
    let out = writeCompactSize(items.length);
    for (const item of items) {
        out = Buffer.concat([out, writeUInt(convertToInt64(item.weight), 32)]);
    }
    return out;
}

function serializeReservesArray(items: Array<{ reserves: string | number }>): Buffer {
    let out = writeCompactSize(items.length);
    for (const item of items) {
        out = Buffer.concat([out, writeUInt(convertToInt64(item.reserves), 64)]);
    }
    return out;
}

function serializeIntArray(
    currencies: Record<string, Record<string, unknown>> | undefined,
    field: string,
    bits: number,
): Buffer {
    if (!currencies) return Buffer.alloc(1);
    const keys = Object.keys(currencies);
    let out = writeCompactSize(keys.length);
    for (const k of keys) {
        out = Buffer.concat([out, writeUInt(convertToInt64(currencies[k][field] as string | number), bits)]);
    }
    return out;
}

/** Serialize a CCoinbaseCurrencyState (CurrencyState + coinbase extra fields). */
function serializeCoinbaseCurrencyState(cs: Record<string, unknown>): Buffer {
    let out = serializeCurrencyState(cs);

    out = Buffer.concat([out, writeUInt(convertToInt64(cs.primarycurrencyout as string), 64)]);
    out = Buffer.concat([out, writeUInt(convertToInt64(cs.preconvertedout as string), 64)]);
    out = Buffer.concat([out, writeUInt(convertToInt64(cs.primarycurrencyfees as string), 64)]);
    out = Buffer.concat([out, writeUInt(convertToInt64(cs.primarycurrencyconversionfees as string), 64)]);

    const curr = cs.currencies as Record<string, Record<string, unknown>> | undefined;
    out = Buffer.concat([out, serializeIntArray(curr, 'reservein', 64)]);
    out = Buffer.concat([out, serializeIntArray(curr, 'primarycurrencyin', 64)]);
    out = Buffer.concat([out, serializeIntArray(curr, 'reserveout', 64)]);
    out = Buffer.concat([out, serializeIntArray(curr, 'lastconversionprice', 64)]);
    out = Buffer.concat([out, serializeIntArray(curr, 'viaconversionprice', 64)]);
    out = Buffer.concat([out, serializeIntArray(curr, 'fees', 64)]);
    out = Buffer.concat([out, serializeIntArray(curr, 'priorweights', 32)]);
    out = Buffer.concat([out, serializeIntArray(curr, 'conversionfees', 64)]);

    return out;
}

/** Serialize a CCurrencyState (base, without coinbase fields). */
function serializeCurrencyState(cs: Record<string, unknown>): Buffer {
    let out = writeUInt(cs.version as number, 16);
    out = Buffer.concat([out, writeUInt(cs.flags as number, 16)]);
    out = Buffer.concat([out, fromBase58Check(removeHex(cs.currencyid as string)).hash]);

    const items = (isFractional(cs.flags as number)
        ? cs.reservecurrencies
        : cs.launchcurrencies) as Array<{ currencyid: string; weight: string | number; reserves: string | number }> ?? [];

    out = Buffer.concat([out, serializeReserveCurrenciesArray(items)]);
    out = Buffer.concat([out, serializeReserveWeightsArray(items)]);
    out = Buffer.concat([out, serializeReservesArray(items)]);

    out = Buffer.concat([out, writeVarInt(Number(convertToInt64(cs.initialsupply as string)))]);
    out = Buffer.concat([out, writeVarInt(Number(convertToInt64(cs.emitted as string)))]);
    out = Buffer.concat([out, writeVarInt(Number(convertToInt64(cs.supply as string)))]);

    return out;
}

/** Serialize the currencystates map/array. */
function serializeCoinbaseCurrencyStates(states: unknown): Buffer {
    // The old code supports both array-of-objects and object-map formats
    let items: Array<Record<string, unknown>>;
    if (Array.isArray(states)) {
        items = states;
    } else if (states && typeof states === 'object') {
        // Object format: { iAddr: state, ... } → array of single-key objects
        items = Object.entries(states as Record<string, unknown>).map(([, v]) => v as Record<string, unknown>);
    } else {
        items = [];
    }

    let out = writeCompactSize(items.length);
    for (const item of items) {
        let stateObj: Record<string, unknown>;
        if (Array.isArray(states)) {
            // Array format: each item is { iAddr: stateObj }
            const keys = Object.keys(item);
            // Write the outer systemid key (20 bytes) before the currency state
            out = Buffer.concat([out, fromBase58Check(keys[0]).hash]);
            stateObj = item[keys[0]] as Record<string, unknown>;
        } else {
            stateObj = item;
        }
        out = Buffer.concat([out, serializeCoinbaseCurrencyState(stateObj)]);
    }
    return out;
}

/** Serialize proof roots array. */
function serializeCProofRootArray(roots: Array<Record<string, unknown>>): Buffer {
    let out = writeCompactSize(roots.length);
    for (const item of roots) {
        // Write the outer systemid key (20 bytes) before the proof root data
        out = Buffer.concat([out, fromBase58Check(item.systemid as string).hash]);
        out = Buffer.concat([out, writeUInt(item.version as number, 16)]);
        out = Buffer.concat([out, writeUInt(item.type as number, 16)]);
        out = Buffer.concat([out, fromBase58Check(item.systemid as string).hash]);
        out = Buffer.concat([out, writeUInt(item.height as number, 32)]);
        out = Buffer.concat([out, Buffer.from(reverseBytes(item.stateroot as string), 'hex')]);
        out = Buffer.concat([out, Buffer.from(reverseBytes(item.blockhash as string), 'hex')]);
        out = Buffer.concat([out, Buffer.from(reverseBytes((item.power as string).padStart(64, '0')), 'hex')]);
        if ((item.type as number) === 2) {
            // Ethereum type: include gas price
            out = Buffer.concat([out, writeUInt(convertToInt64(item.gasprice as string), 64)]);
        }
    }
    return out;
}

/** Serialize nodes array. */
function serializeNodes(nodes: Array<{ networkaddress: string; nodeidentity: string }>): Buffer {
    let out = writeCompactSize(nodes.length);
    for (const item of nodes) {
        const addr = Buffer.from(item.networkaddress, 'utf-8');
        out = Buffer.concat([out, writeCompactSize(addr.length), addr]);
        out = Buffer.concat([out, fromBase58Check(item.nodeidentity).hash]);
    }
    return out;
}

// ── Deserialization helpers ─────────────────────────────────

/** Reader state wrapping a Buffer with advancing position. */
class BufReader {
    buf: Buffer;
    pos = 0;

    constructor(buf: Buffer) { this.buf = buf; }

    readUInt8(): number { return this.buf.readUInt8(this.pos++); }
    readUInt16LE(): number { const v = this.buf.readUInt16LE(this.pos); this.pos += 2; return v; }
    readUInt32LE(): number { const v = this.buf.readUInt32LE(this.pos); this.pos += 4; return v; }
    readBigInt64LE(): bigint { const v = this.buf.readBigInt64LE(this.pos); this.pos += 8; return v; }
    readBigUInt64LE(): bigint { const v = this.buf.readBigUInt64LE(this.pos); this.pos += 8; return v; }

    readBytes(n: number): Buffer {
        const s = this.buf.subarray(this.pos, this.pos + n);
        this.pos += n;
        return Buffer.from(s);
    }

    readVarInt(): number {
        let n = 0;
        while (true) {
            const ch = this.readUInt8();
            n = (n * 128) | (ch & 0x7f);
            if (ch & 0x80) n++;
            else return n;
        }
    }

    readCompactSize(): number {
        const first = this.readUInt8();
        if (first < 253) return first;
        if (first === 253) return this.readUInt16LE();
        if (first === 254) return this.readUInt32LE();
        return Number(this.readBigUInt64LE());
    }

    readUInt160Hex(): string { return this.readBytes(20).toString('hex'); }
    readUInt256Hex(): string { return this.readBytes(32).toString('hex'); }
}

function hexToIAddress(hex: string): string {
    return toBase58Check(Buffer.from(hex.padStart(40, '0'), 'hex'), I_ADDR_VERSION);
}

/** Compute notarization flags from boolean properties. */
function notarizationFlagsFromObj(obj: Record<string, unknown>): number {
    let flags = obj.launchcleared ? FLAG_START_NOTARIZATION : 0;
    flags += obj.launchconfirmed ? FLAG_LAUNCH_CONFIRMED : 0;
    flags += obj.launchcomplete ? FLAG_LAUNCH_COMPLETE : 0;
    flags += obj.refunding ? FLAG_REFUNDING : 0;
    flags += obj.contractupgrade ? FLAG_CONTRACT_UPGRADE : 0;
    return flags;
}

// ── Public API ──────────────────────────────────────────────

export class NotarizationCodec {
    /**
     * Serialize a notarization object to a `0x`-prefixed hex string.
     * Accepts the Verus daemon JSON format.
     */
    static serialize(notarization: Record<string, unknown>): string {
        let out = writeVarInt(Number(notarization.version ?? 1));
        out = Buffer.concat([out, writeVarInt(notarizationFlagsFromObj(notarization))]);
        out = Buffer.concat([out, serializeCTransferDestination(notarization.proposer as { type: number; address: string })]);
        out = Buffer.concat([out, fromBase58Check(notarization.currencyid as string).hash]);
        out = Buffer.concat([out, serializeCoinbaseCurrencyState(notarization.currencystate as Record<string, unknown>)]);
        out = Buffer.concat([out, writeUInt(notarization.notarizationheight as number, 32)]);
        out = Buffer.concat([out, Buffer.from(reverseBytes(notarization.prevnotarizationtxid as string), 'hex')]);
        out = Buffer.concat([out, writeUInt(notarization.prevnotarizationout as number, 32)]);
        out = Buffer.concat([out, Buffer.from(reverseBytes(notarization.hashprevcrossnotarization as string), 'hex')]);
        out = Buffer.concat([out, writeUInt(notarization.prevheight as number, 32)]);
        out = Buffer.concat([out, serializeCoinbaseCurrencyStates(notarization.currencystates)]);
        out = Buffer.concat([out, serializeCProofRootArray(notarization.proofroots as Array<Record<string, unknown>>)]);
        out = Buffer.concat([out, serializeNodes(notarization.nodes as Array<{ networkaddress: string; nodeidentity: string }> ?? [])]);

        return addHex(out.toString('hex'));
    }

    /**
     * Deserialize a hex notarization into the Verus daemon JSON format.
     */
    static deserialize(hex: string): Record<string, unknown> {
        const r = new BufReader(Buffer.from(removeHex(hex), 'hex'));
        const result: Record<string, unknown> = {};

        result.version = r.readVarInt();
        const flags = r.readVarInt();

        // Set boolean flags
        if (flags & FLAG_START_NOTARIZATION) result.launchcleared = true;
        if (flags & FLAG_LAUNCH_CONFIRMED) result.launchconfirmed = true;
        if (flags & FLAG_LAUNCH_COMPLETE) result.launchcomplete = true;
        if (flags & FLAG_REFUNDING) result.refunding = true;
        if (flags & FLAG_CONTRACT_UPGRADE) result.contractupgrade = true;

        // proposer
        result.proposer = deserializeCTransferDestination(r);

        // currencyid
        result.currencyid = hexToIAddress(r.readUInt160Hex());

        // currencystate
        result.currencystate = deserializeCoinbaseCurrencyState(r);

        // notarizationheight
        result.notarizationheight = r.readUInt32LE();

        // prevnotarizationtxid (reversed)
        result.prevnotarizationtxid = reverseBytes(r.readUInt256Hex());

        // prevnotarizationout
        result.prevnotarizationout = r.readUInt32LE();

        // hashprevcrossnotarization (reversed)
        result.hashprevcrossnotarization = reverseBytes(r.readUInt256Hex());

        // prevheight
        result.prevheight = r.readUInt32LE();

        // currencystates
        result.currencystates = deserializeCoinbaseCurrencyStates(r);

        // proofroots
        result.proofroots = deserializeProofRoots(r);

        // nodes
        result.nodes = deserializeProofNodes(r);

        return result;
    }
}

// ── Deserialization functions ───────────────────────────────

function deserializeCTransferDestination(r: BufReader): { type: number; address: string } {
    const type = r.readUInt8();
    if (type === 0) return { type, address: '' };

    const len = r.readCompactSize();
    const dest = r.readBytes(len);

    const typeMask = type & 0x7f;
    let address: string;
    if ((typeMask & I_ADDRESS_TYPE) === I_ADDRESS_TYPE) {
        address = toBase58Check(dest, I_ADDR_VERSION);
    } else if ((typeMask & R_ADDRESS_TYPE) === R_ADDRESS_TYPE) {
        address = toBase58Check(dest, R_ADDR_VERSION);
    } else {
        address = '0x' + dest.toString('hex');
    }

    // Skip auxdests if present
    if ((type & FLAG_DEST_AUX) === FLAG_DEST_AUX) {
        const auxCount = r.readCompactSize();
        for (let i = 0; i < auxCount; i++) {
            const auxLen = r.readCompactSize();
            r.readBytes(auxLen); // skip
        }
    }

    return { type, address };
}

function deserializeCoinbaseCurrencyState(r: BufReader): Record<string, unknown> {
    const state = deserializeCurrencyState(r);

    state.primarycurrencyout = uint64ToVerusFloat(r.readBigInt64LE());
    state.preconvertedout = uint64ToVerusFloat(r.readBigInt64LE());
    state.primarycurrencyfees = uint64ToVerusFloat(r.readBigInt64LE());
    state.primarycurrencyconversionfees = uint64ToVerusFloat(r.readBigInt64LE());

    const currencyItems = (isFractional(state.flags as number)
        ? state.reservecurrencies
        : state.launchcurrencies) as Array<{ currencyid: string }> ?? [];

    state.currencies = deserializeCurrenciesMap(r, currencyItems);

    return state;
}

function deserializeCurrencyState(r: BufReader): Record<string, unknown> {
    const state: Record<string, unknown> = {};
    state.version = r.readUInt16LE();
    state.flags = r.readUInt16LE();
    state.currencyid = hexToIAddress(r.readUInt160Hex());

    const frac = isFractional(state.flags as number);
    const ids = deserializeReserveCurrenciesArray(r);
    const weights = deserializeReserveWeightsArray(r);
    const reserves = deserializeReservesArray(r);

    const items: Array<Record<string, unknown>> = [];
    for (let i = 0; i < ids.length; i++) {
        items.push({
            currencyid: ids[i],
            weight: weights[i],
            reserves: reserves[i],
        });
    }

    if (frac) {
        state.reservecurrencies = items;
    } else {
        state.launchcurrencies = items;
    }

    state.initialsupply = uint64ToVerusFloat(BigInt(r.readVarInt()));
    state.emitted = uint64ToVerusFloat(BigInt(r.readVarInt()));
    state.supply = uint64ToVerusFloat(BigInt(r.readVarInt()));

    return state;
}

function deserializeReserveCurrenciesArray(r: BufReader): string[] {
    const count = r.readCompactSize();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
        ids.push(hexToIAddress(r.readUInt160Hex()));
    }
    return ids;
}

function deserializeReserveWeightsArray(r: BufReader): string[] {
    const count = r.readCompactSize();
    const weights: string[] = [];
    for (let i = 0; i < count; i++) {
        weights.push(uint64ToVerusFloat(BigInt(r.readUInt32LE())));
    }
    return weights;
}

function deserializeReservesArray(r: BufReader): string[] {
    const count = r.readCompactSize();
    const reserves: string[] = [];
    for (let i = 0; i < count; i++) {
        reserves.push(uint64ToVerusFloat(r.readBigInt64LE()));
    }
    return reserves;
}

function deserializeCurrenciesMap(
    r: BufReader,
    currencyItems: Array<{ currencyid: string }>,
): Record<string, Record<string, string>> {
    const fields64 = ['reservein', 'primarycurrencyin', 'reserveout', 'lastconversionprice', 'viaconversionprice', 'fees'];
    const fields32 = ['priorweights'];
    const fieldsConv = ['conversionfees'];

    const result: Record<string, Record<string, string>> = {};
    for (const item of currencyItems) {
        result[item.currencyid] = {};
    }

    // Read each field array in order
    for (const field of fields64) {
        const count = r.readCompactSize();
        for (let i = 0; i < count && i < currencyItems.length; i++) {
            result[currencyItems[i].currencyid][field] = uint64ToVerusFloat(r.readBigInt64LE());
        }
    }

    for (const field of fields32) {
        const count = r.readCompactSize();
        for (let i = 0; i < count && i < currencyItems.length; i++) {
            result[currencyItems[i].currencyid][field] = uint64ToVerusFloat(BigInt(r.readUInt32LE()));
        }
    }

    for (const field of fieldsConv) {
        const count = r.readCompactSize();
        for (let i = 0; i < count && i < currencyItems.length; i++) {
            result[currencyItems[i].currencyid][field] = uint64ToVerusFloat(r.readBigInt64LE());
        }
    }

    return result;
}

function deserializeCoinbaseCurrencyStates(r: BufReader): Array<Record<string, unknown>> {
    const count = r.readCompactSize();
    const result: Array<Record<string, unknown>> = [];
    for (let i = 0; i < count; i++) {
        const _currencyidHex = r.readUInt160Hex();
        const currencyid = hexToIAddress(_currencyidHex);
        const state = deserializeCoinbaseCurrencyState(r);
        result.push({ [currencyid]: state });
    }
    return result;
}

function deserializeProofRoots(r: BufReader): Array<Record<string, unknown>> {
    const count = r.readCompactSize();
    const roots: Array<Record<string, unknown>> = [];
    for (let i = 0; i < count; i++) {
        const _sysHex = r.readUInt160Hex();
        const root: Record<string, unknown> = {};
        root.version = r.readUInt16LE();
        root.type = r.readUInt16LE();
        root.systemid = hexToIAddress(r.readUInt160Hex());
        root.height = r.readUInt32LE();
        root.stateroot = reverseBytes(r.readUInt256Hex());
        root.blockhash = reverseBytes(r.readUInt256Hex());
        root.power = reverseBytes(r.readUInt256Hex());
        if ((root.type as number) === 2) {
            root.gasprice = uint64ToVerusFloat(r.readBigInt64LE());
        }
        roots.push(root);
    }
    return roots;
}

function deserializeProofNodes(r: BufReader): Array<{ networkaddress: string; nodeidentity: string }> {
    const count = r.readCompactSize();
    const nodes: Array<{ networkaddress: string; nodeidentity: string }> = [];
    for (let i = 0; i < count; i++) {
        const strLen = r.readCompactSize();
        const networkaddress = r.readBytes(strLen).toString('utf8');
        const nodeidentity = hexToIAddress(r.readUInt160Hex());
        nodes.push({ networkaddress, nodeidentity });
    }
    return nodes;
}
