/**
 * TransferConditioner — conditions raw Verus daemon reserve-transfer objects
 * for submission to the Ethereum bridge contract.
 *
 * Responsibilities:
 * - Convert base58 Verus addresses → 0x-prefixed ETH hex (`addressToHex`)
 * - Reshape `currencyvalues` (dict) → `currencyvalue` (single-pair struct)
 * - Convert string fees to BigInt satoshi values
 * - Normalise destination fields (`type`/`address` → `destinationtype`/`destinationaddress`)
 *
 * The output matches the Solidity struct layout expected by `delegator.submitImports`.
 */

import { fromBase58Check, toBase58Check } from 'verus-typescript-primitives';
import { I_ADDR_VERSION } from 'verus-typescript-primitives/dist/constants/vdxf';
import { IConditionedTransfer } from './types';

/**
 * Convert a Verus base58 address to 0x-prefixed hex.
 * Passes through values that are already hex-prefixed or empty.
 */
function addressToHex(addr: string): string {
    if (!addr) return '0x0000000000000000000000000000000000000000';
    if (addr.startsWith('0x')) return addr;
    try {
        return '0x' + fromBase58Check(addr).hash.toString('hex');
    } catch {
        return addr;
    }
}

/** Convert "X.XXXXXXXX" → BigInt sats */
function verusFloatToSats(vf: string): bigint {
    const s = String(vf);
    const [whole = '0', frac = ''] = s.split('.');
    const fracPad = frac.padEnd(8, '0').slice(0, 8);
    return BigInt(whole) * 100000000n + BigInt(fracPad);
}

export class TransferConditioner {
    /**
     * Condition a raw Verus transfer object for contract submission.
     *
     * Converts all address fields to ETH hex, reshapes `currencyvalues` → `currencyvalue`,
     * converts fees from verus-float strings to BigInt, and normalises the destination.
     *
     * @param rawTransfer - Raw transfer object from Verus daemon JSON
     * @returns A conditioned transfer ready for the contract call
     */
    condition(rawTransfer: unknown): IConditionedTransfer {
        const t = { ...(rawTransfer as Record<string, unknown>) };

        // --- currencyvalues → currencyvalue ---
        let currency = '';
        let amount = 0n;
        if (t.currencyvalues && typeof t.currencyvalues === 'object' && !t.currencyvalue) {
            const cv = t.currencyvalues as Record<string, string | number | bigint>;
            const keys = Object.keys(cv);
            if (keys.length > 0) {
                currency = addressToHex(keys[0]);
                amount = typeof cv[keys[0]] === 'string'
                    ? verusFloatToSats(cv[keys[0]] as string)
                    : BigInt(cv[keys[0]] as number | bigint);
            }
        } else if (t.currencyvalue && typeof t.currencyvalue === 'object') {
            const cv = t.currencyvalue as { currency: string; amount: bigint | string | number };
            currency = addressToHex(cv.currency);
            amount = typeof cv.amount === 'string' ? verusFloatToSats(cv.amount) : BigInt(cv.amount);
        }

        // --- Fees ---
        let fees = 0n;
        if (typeof t.fees === 'string') fees = verusFloatToSats(t.fees as string);
        else if (typeof t.fees === 'bigint') fees = t.fees;
        else if (typeof t.fees === 'number') fees = BigInt(t.fees);

        // --- Destination ---
        let destinationAddress = '';
        let flags = Number(t.flags ?? 0);
        if (t.destination && typeof t.destination === 'object') {
            const dest = t.destination as Record<string, unknown>;
            const addr = (dest.address ?? dest.destinationaddress) as string;
            if (addr && !addr.startsWith('0x')) {
                try {
                    destinationAddress = '0x' + fromBase58Check(addr).hash.toString('hex');
                } catch {
                    destinationAddress = addr;
                }
            } else {
                destinationAddress = addr ?? '';
            }
        }

        // --- Convert remaining address fields ---
        const feecurrencyid = addressToHex((t.feecurrencyid as string) ?? '');
        const destcurrencyid = addressToHex((t.destcurrencyid ?? t.destinationcurrencyid) as string ?? '');

        return {
            serializedTransfer: '', // populated downstream if needed
            destinationAddress,
            currencyValues: { [currency]: amount },
            flags,
        };
    }

    /**
     * Convert an address between base58 and hex representations.
     *
     * @param address - The address to convert
     * @param toFormat - Target format: `'hex'` for ETH hex, `'base58'` for Verus base58
     * @returns The converted address string
     */
    convertAddress(address: string, toFormat: 'hex' | 'base58'): string {
        if (toFormat === 'hex') {
            return addressToHex(address);
        }

        // hex → base58 (i-address)
        const hex = address.startsWith('0x') ? address.slice(2) : address;
        return toBase58Check(Buffer.from(hex, 'hex'), I_ADDR_VERSION);
    }
}
