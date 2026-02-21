/**
 * NotarizationTransformer — converts between contract ABI tuple format and
 * the Verus daemon JSON format used by the bridge keepers.
 *
 * The delegator contract's getcurrency / bestForks / setLatestData return
 * data in ABI-encoded form. This module converts those tuples into the
 * human-readable JSON format the Verus daemon expects and vice-versa.
 */

import { removeHexPrefix, addHexPrefix } from '../utils/hex';
import { toBase58Check, fromBase58Check } from 'verus-typescript-primitives';
import { I_ADDR_VERSION } from 'verus-typescript-primitives/dist/constants/vdxf';

/** Convert a 20-byte hex address to a Verus i-address. */
function hexToIAddr(hex: string): string {
    const clean = removeHexPrefix(hex).padStart(40, '0');
    return toBase58Check(Buffer.from(clean, 'hex'), I_ADDR_VERSION);
}

/** Reverse bytes in a hex string. */
function reverseBytes(hex: string): string {
    const m = hex.match(/.{2}/g);
    return m ? m.reverse().join('') : hex;
}

/** Convert uint64 sats to "X.XXXXXXXX". */
function satsToFloat(sats: bigint): string {
    const S = 100000000n;
    const whole = sats / S;
    let frac = (sats < 0n ? -(sats % S) : sats % S).toString();
    while (frac.length < 8) frac = '0' + frac;
    return `${sats < 0n ? '-' : ''}${whole}.${frac}`;
}

export class NotarizationTransformer {
    /**
     * Transform a contract ABI tuple into Verus daemon JSON format.
     *
     * The tuple layout matches what the VerusNotarizer contract returns:
     * [version, flags, proposer[type,addr], currencyid, currencyState,
     *  notarizationHeight, prevNotTxid, prevNotOut, hashPrevCrossNot,
     *  prevHeight, currencyStates[], proofRoots[], nodes[]]
     *
     * @param t - Array from ABI decode
     */
    static toVerusJson(t: unknown[]): Record<string, unknown> {
        // This is a best-effort transformer — the exact tuple shape depends
        // on ABI decode context. We handle the common notarization tuple.
        if (!Array.isArray(t) || t.length < 10) {
            throw new Error('Invalid notarization tuple: expected at least 10 elements');
        }

        const result: Record<string, unknown> = {
            version: Number(t[0]),
            flags: Number(t[1]),
        };

        // Proposer (tuple of [type, destinationaddress])
        if (Array.isArray(t[2])) {
            result.proposer = {
                type: Number(t[2][0]),
                address: hexToIAddr(removeHexPrefix(String(t[2][1]))),
            };
        }

        // Currency ID
        if (typeof t[3] === 'string') {
            result.currencyid = hexToIAddr(t[3]);
        }

        // Notarization height
        result.notarizationheight = Number(t[5]);

        // Previous notarization txid (bytes32 → reversed hex)
        if (typeof t[6] === 'string') {
            result.prevnotarizationtxid = reverseBytes(removeHexPrefix(t[6]));
        }

        result.prevnotarizationout = Number(t[7]);

        // Hash prev cross notarization
        if (typeof t[8] === 'string') {
            result.hashprevcrossnotarization = reverseBytes(removeHexPrefix(t[8]));
        }

        result.prevheight = Number(t[9]);

        return result;
    }

    /**
     * Transform Verus daemon JSON back into the contract struct format.
     * Used when preparing data for contract calls.
     */
    static toContractTuple(verusJson: Record<string, unknown>): unknown[] {
        const proposer = verusJson.proposer as { type: number; address: string } | undefined;
        let proposerType = 0;
        let proposerAddr = '0x0000000000000000000000000000000000000000';
        if (proposer) {
            proposerType = proposer.type;
            try {
                proposerAddr = '0x' + fromBase58Check(proposer.address).hash.toString('hex');
            } catch {
                proposerAddr = proposer.address;
            }
        }

        let currencyIdHex = '0x0000000000000000000000000000000000000000';
        if (typeof verusJson.currencyid === 'string') {
            try {
                currencyIdHex = '0x' + fromBase58Check(verusJson.currencyid as string).hash.toString('hex');
            } catch {
                currencyIdHex = verusJson.currencyid as string;
            }
        }

        let prevTxid = '0x' + '0'.repeat(64);
        if (typeof verusJson.prevnotarizationtxid === 'string') {
            prevTxid = addHexPrefix(reverseBytes(verusJson.prevnotarizationtxid as string));
        }

        let hashPrevCross = '0x' + '0'.repeat(64);
        if (typeof verusJson.hashprevcrossnotarization === 'string') {
            hashPrevCross = addHexPrefix(reverseBytes(verusJson.hashprevcrossnotarization as string));
        }

        return [
            verusJson.version ?? 1,
            verusJson.flags ?? 0,
            [proposerType, proposerAddr],
            currencyIdHex,
            null, // currencyState — serialized separately
            verusJson.notarizationheight ?? 0,
            prevTxid,
            verusJson.prevnotarizationout ?? 0,
            hashPrevCross,
            verusJson.prevheight ?? 0,
        ];
    }
}
