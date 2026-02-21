/**
 * CrossChainExportCodec — serialize/deserialize cross-chain export data.
 *
 * The cross-chain export is the bridge-specific envelope around a set of
 * reserve transfers. Most of the heavy serialization is already done inline
 * in GetExportsHandler; this codec provides reusable serialize/deserialize
 * for the `CCrossChainExport` structure that wraps those transfers.
 *
 * Binary layout:
 *   uint16(version) | uint16(flags) | uint160(sourcesystemid) |
 *   uint256(hashtransfers) | uint160(destinationsystemid) |
 *   uint160(destinationcurrencyid) | uint32(sourceheightstart) |
 *   uint32(sourceheightend) | uint32(numinputs) |
 *   CCurrencyValueMap[](totalamounts) | CCurrencyValueMap[](totalfees) |
 *   CCurrencyValueMap[](totalburned) | CTransferDestination(rewardaddress) |
 *   int32(firstinput)
 */

import { fromBase58Check, toBase58Check } from 'verus-typescript-primitives';
import { I_ADDR_VERSION } from 'verus-typescript-primitives/dist/constants/vdxf';
import { removeHexPrefix, addHexPrefix } from '../utils/hex';

/** Write a compact-size integer. */
function writeCompactSize(n: number): Buffer {
    if (n < 253) { const b = Buffer.alloc(1); b.writeUInt8(n); return b; }
    if (n <= 0xffff) { const b = Buffer.alloc(3); b.writeUInt8(253); b.writeUInt16LE(n, 1); return b; }
    if (n <= 0xffffffff) { const b = Buffer.alloc(5); b.writeUInt8(254); b.writeUInt32LE(n, 1); return b; }
    const b = Buffer.alloc(9); b.writeUInt8(255); b.writeBigUInt64LE(BigInt(n), 1); return b;
}

/** Convert a Verus-float "X.XXXXXXXX" to sats bigint. */
function toSats(vf: string | number): bigint {
    const s = String(vf);
    const [whole = '0', frac = ''] = s.split('.');
    return BigInt(whole) * 100000000n + BigInt(frac.padEnd(8, '0').slice(0, 8));
}

/** Hex-to-i-address. */
function hexToI(hex: string): string {
    return toBase58Check(Buffer.from(removeHexPrefix(hex).padStart(40, '0'), 'hex'), I_ADDR_VERSION);
}

/** Serialize a CurrencyValueMap array. */
function serializeCVMArray(items: Array<{ currency: string; amount: string | number }>): Buffer {
    let out = writeCompactSize(items.length);
    // Sort by currency address bytes (ascending numeric)
    const sorted = [...items].sort((a, b) => {
        const ha = fromBase58Check(a.currency).hash.toString('hex');
        const hb = fromBase58Check(b.currency).hash.toString('hex');
        return ha < hb ? -1 : ha > hb ? 1 : 0;
    });
    for (const item of sorted) {
        out = Buffer.concat([out, fromBase58Check(item.currency).hash]);
        const buf = Buffer.alloc(8);
        buf.writeBigInt64LE(toSats(item.amount));
        out = Buffer.concat([out, buf]);
    }
    return out;
}

/** ICrossChainExport shape for codec. */
export interface ICrossChainExport {
    version: number;
    flags: number;
    sourcesystemid: string;
    hashtransfers: string;
    destinationsystemid: string;
    destinationcurrencyid: string;
    sourceheightstart: number;
    sourceheightend: number;
    numinputs: number;
    totalamounts: Array<{ currency: string; amount: string }>;
    totalfees: Array<{ currency: string; amount: string }>;
    totalburned: Array<{ currency: string; amount: string | number }>;
    rewardaddress: { type: number; address: string };
    firstinput: number;
}

export class CrossChainExportCodec {
    /** Serialize a cross-chain export to hex. */
    static serialize(exportData: ICrossChainExport): string {
        const e = exportData;
        let out = Buffer.alloc(2);
        out.writeUInt16LE(e.version);

        const flags = Buffer.alloc(2);
        flags.writeUInt16LE(e.flags);
        out = Buffer.concat([out, flags]);

        out = Buffer.concat([out, fromBase58Check(e.sourcesystemid).hash]);

        // hashtransfers (32 bytes, reversed)
        const ht = removeHexPrefix(e.hashtransfers);
        const htReversed = ht.match(/.{2}/g)?.reverse().join('') ?? ht;
        out = Buffer.concat([out, Buffer.from(htReversed, 'hex')]);

        out = Buffer.concat([out, fromBase58Check(e.destinationsystemid).hash]);
        out = Buffer.concat([out, fromBase58Check(e.destinationcurrencyid).hash]);

        const sh = Buffer.alloc(4); sh.writeUInt32LE(e.sourceheightstart);
        out = Buffer.concat([out, sh]);

        const eh = Buffer.alloc(4); eh.writeUInt32LE(e.sourceheightend);
        out = Buffer.concat([out, eh]);

        const ni = Buffer.alloc(4); ni.writeUInt32LE(e.numinputs);
        out = Buffer.concat([out, ni]);

        out = Buffer.concat([out, serializeCVMArray(e.totalamounts)]);
        out = Buffer.concat([out, serializeCVMArray(e.totalfees)]);
        out = Buffer.concat([out, serializeCVMArray(e.totalburned as Array<{ currency: string; amount: string }>)]);

        // Reward address (simplified CTransferDestination)
        const typeB = Buffer.alloc(1);
        typeB.writeUInt8(e.rewardaddress?.type ?? 0);
        out = Buffer.concat([out, typeB]);
        if (e.rewardaddress?.type) {
            const dest = fromBase58Check(e.rewardaddress.address).hash;
            out = Buffer.concat([out, writeCompactSize(dest.length), dest]);
        }

        const fi = Buffer.alloc(4); fi.writeInt32LE(e.firstinput);
        out = Buffer.concat([out, fi]);

        return addHexPrefix(out.toString('hex'));
    }

    /** Deserialize a cross-chain export from hex (partial — returns key fields). */
    static deserialize(hex: string): Partial<ICrossChainExport> {
        const buf = Buffer.from(removeHexPrefix(hex), 'hex');
        let pos = 0;

        const version = buf.readUInt16LE(pos); pos += 2;
        const flags = buf.readUInt16LE(pos); pos += 2;
        const sourcesystemid = hexToI(buf.subarray(pos, pos + 20).toString('hex')); pos += 20;

        // hashtransfers (reversed)
        const htRaw = buf.subarray(pos, pos + 32).toString('hex'); pos += 32;
        const hashtransfers = htRaw.match(/.{2}/g)?.reverse().join('') ?? htRaw;

        const destinationsystemid = hexToI(buf.subarray(pos, pos + 20).toString('hex')); pos += 20;
        const destinationcurrencyid = hexToI(buf.subarray(pos, pos + 20).toString('hex')); pos += 20;

        const sourceheightstart = buf.readUInt32LE(pos); pos += 4;
        const sourceheightend = buf.readUInt32LE(pos); pos += 4;
        const numinputs = buf.readUInt32LE(pos); pos += 4;

        return {
            version, flags, sourcesystemid, hashtransfers,
            destinationsystemid, destinationcurrencyid,
            sourceheightstart, sourceheightend, numinputs,
        };
    }
}
