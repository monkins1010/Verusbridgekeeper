/**
 * Bridge-specific crypto utilities.
 * Address/binary/math utils come from verus-typescript-primitives.
 */

import { randomBytes, createHash } from 'crypto';

/** Split an Ethereum signature into r, s, v components */
export function splitSignature(signature: string): { r: string; s: string; v: number } {
    const sig = signature.startsWith('0x') ? signature.slice(2) : signature;

    if (sig.length !== 130) {
        throw new Error(`Invalid signature length: ${sig.length}, expected 130`);
    }

    return {
        r: '0x' + sig.slice(0, 64),
        s: '0x' + sig.slice(64, 128),
        v: parseInt(sig.slice(128, 130), 16),
    };
}

/** Encode multiple signatures into a packed format */
export function encodeSignatures(signatures: Array<{ r: string; s: string; v: number }>): string {
    // TODO: Implement packed signature encoding
    return signatures
        .map((sig) => {
            const r = sig.r.replace('0x', '');
            const s = sig.s.replace('0x', '');
            const v = sig.v.toString(16).padStart(2, '0');
            return r + s + v;
        })
        .join('');
}

/** Generate a random credential (32 bytes hex) */
export function generateCredential(): string {
    return randomBytes(32).toString('hex');
}

/** SHA256 hash */
export function sha256(data: Buffer): Buffer {
    return createHash('sha256').update(data).digest();
}

/** Double SHA256 hash */
export function sha256d(data: Buffer): Buffer {
    return sha256(sha256(data));
}
