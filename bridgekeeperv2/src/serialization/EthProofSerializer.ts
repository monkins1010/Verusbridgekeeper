/**
 * EthProofSerializer — serializes ETH storage proofs for cross-chain verification.
 *
 * Takes the result of `eth_getProof` and produces a hex-encoded proof blob
 * that the Verus daemon can include in partial transaction proofs.
 *
 * The output format is:
 *   compactSize(accountProof.length) | for each: compactSize(len) | rlpNode |
 *   compactSize(storageProofs.length) | for each storage proof:
 *     key(32 bytes) | compactSize(proof.length) | for each: compactSize(len) | rlpNode
 */

import { IEthProof } from '../types/ethereum';
import { removeHexPrefix, addHexPrefix } from '../utils/hex';

/** Write a compact-size integer (Bitcoin-style). */
function writeCompactSize(n: number): Buffer {
    if (n < 253) { const b = Buffer.alloc(1); b.writeUInt8(n); return b; }
    if (n <= 0xffff) { const b = Buffer.alloc(3); b.writeUInt8(253); b.writeUInt16LE(n, 1); return b; }
    if (n <= 0xffffffff) { const b = Buffer.alloc(5); b.writeUInt8(254); b.writeUInt32LE(n, 1); return b; }
    const b = Buffer.alloc(9); b.writeUInt8(255); b.writeBigUInt64LE(BigInt(n), 1); return b;
}

/** Encode a proof node list: compactSize(count) + for each: compactSize(len) + bytes. */
function encodeProofNodes(nodes: string[]): Buffer {
    let out = writeCompactSize(nodes.length);
    for (const node of nodes) {
        const raw = Buffer.from(removeHexPrefix(node), 'hex');
        out = Buffer.concat([out, writeCompactSize(raw.length), raw]);
    }
    return out;
}

export class EthProofSerializer {
    /**
     * Serialize a full ETH proof for inclusion in a Verus partial transaction proof.
     *
     * @param proof - The result from `eth_getProof`
     * @returns Hex-encoded proof blob (0x-prefixed)
     */
    static serialize(proof: IEthProof): string {
        // Account proof
        let out = encodeProofNodes(proof.accountProof);

        // Storage proofs
        out = Buffer.concat([out, writeCompactSize(proof.storageProof.length)]);
        for (const sp of proof.storageProof) {
            // Key (32 bytes, left-padded)
            const keyBuf = Buffer.from(removeHexPrefix(sp.key).padStart(64, '0'), 'hex');
            out = Buffer.concat([out, keyBuf]);

            // Value (encoded as compact-size prefixed bytes)
            const valBuf = Buffer.from(removeHexPrefix(sp.value).replace(/^0+/, '') || '0', 'hex');
            out = Buffer.concat([out, writeCompactSize(valBuf.length), valBuf]);

            // Proof nodes
            out = Buffer.concat([out, encodeProofNodes(sp.proof)]);
        }

        return addHexPrefix(out.toString('hex'));
    }
}
