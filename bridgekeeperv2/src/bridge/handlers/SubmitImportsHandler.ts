/**
 * SubmitImportsHandler — processes and submits cross-chain imports to the contract.
 *
 * Workflow:
 * 1. Condition the import array (convert Verus addresses → ETH hex, reshape transfers).
 * 2. Call `checkImport(txid)` to see if already processed.
 * 3. Estimate gas and verify it's under the 5 M limit.
 * 4. Submit via `delegator.submitImports(importStruct)`.
 *
 * Gas limit: 5 M (SUBMIT_IMPORT_MAX_GAS).
 */

import { IRpcHandler } from '../../server/types';
import { ISubmitImportsResult, IHandlerDependencies } from './types';
import { removeHexPrefix, addHexPrefix } from '../../utils/hex';
import { fromBase58Check } from 'verus-typescript-primitives';
import { SUBMIT_IMPORT_MAX_GAS } from '../../config/constants';

/** Destination type mask. */
const R_ADDRESS_TYPE = 2;
const I_ADDRESS_TYPE = 4;
const ETH_ADDRESS_TYPE = 9;

/** Convert a Verus base58 address to 0x-prefixed ETH hex. */
function addressToHex(addr: string): string {
    if (!addr) return '0x0000000000000000000000000000000000000000';
    if (addr.startsWith('0x')) return addr;
    try {
        return '0x' + fromBase58Check(addr).hash.toString('hex');
    } catch {
        return addr;
    }
}

/**
 * Condition a submit-imports array: convert Verus addresses to ETH hex wherever
 * the contract expects them (currencyvalues, feecurrencyid, destcurrencyid,
 * destsystemid, secondreserveid, etc.).
 *
 * This mirrors the old `conditionSubmitImports` + `reshapeTransfers` + `fixETHObjects`.
 */
function conditionImport(importObj: Record<string, unknown>): Record<string, unknown> {
    const result = { ...importObj };

    // Convert top-level address fields
    if (typeof result.sourcesystemid === 'string') {
        result.sourcesystemid = addressToHex(result.sourcesystemid as string);
    }
    if (typeof result.importcurrencyid === 'string') {
        result.importcurrencyid = addressToHex(result.importcurrencyid as string);
    }
    if (typeof result.destinationsystemid === 'string') {
        result.destinationsystemid = addressToHex(result.destinationsystemid as string);
    }
    if (typeof result.destinationcurrencyid === 'string') {
        result.destinationcurrencyid = addressToHex(result.destinationcurrencyid as string);
    }

    // Condition transfers
    if (Array.isArray(result.transfers)) {
        result.transfers = (result.transfers as Array<Record<string, unknown>>).map(conditionTransfer);
    }

    return result;
}

/** Condition a single transfer object for contract submission. */
function conditionTransfer(transfer: Record<string, unknown>): Record<string, unknown> {
    const t = { ...transfer };

    // Convert currencyvalues → currencyvalue (single key/value for the contract struct)
    if (t.currencyvalues && typeof t.currencyvalues === 'object' && !t.currencyvalue) {
        const cv = t.currencyvalues as Record<string, string | number | bigint>;
        const keys = Object.keys(cv);
        if (keys.length > 0) {
            const currency = addressToHex(keys[0]);
            const amount = typeof cv[keys[0]] === 'string'
                ? verusFloatToSats(cv[keys[0]] as string)
                : BigInt(cv[keys[0]] as number | bigint);
            t.currencyvalue = { currency, amount };
        }
        delete t.currencyvalues;
    }

    // Convert address fields
    if (typeof t.feecurrencyid === 'string') t.feecurrencyid = addressToHex(t.feecurrencyid as string);
    if (typeof t.destcurrencyid === 'string') t.destcurrencyid = addressToHex(t.destcurrencyid as string);
    if (typeof t.destsystemid === 'string') t.destsystemid = addressToHex(t.destsystemid as string);
    if (typeof t.secondreserveid === 'string') t.secondreserveid = addressToHex(t.secondreserveid as string);
    if (typeof t.exportto === 'string') t.exportto = addressToHex(t.exportto as string);

    // Fees to bigint
    if (typeof t.fees === 'string') t.fees = verusFloatToSats(t.fees as string);

    // Condition destination
    if (t.destination && typeof t.destination === 'object') {
        const dest = t.destination as Record<string, unknown>;
        if (typeof dest.address === 'string' && !dest.address.startsWith('0x')) {
            try {
                dest.destinationaddress = '0x' + fromBase58Check(dest.address as string).hash.toString('hex');
            } catch {
                dest.destinationaddress = dest.address;
            }
        } else {
            dest.destinationaddress = dest.address;
        }
        dest.destinationtype = dest.type ?? dest.destinationtype;
        t.destination = dest;
    }

    return t;
}

/** Convert a Verus-float "X.XXXXXXXX" to satoshi bigint. */
function verusFloatToSats(vf: string): bigint {
    const s = String(vf);
    const [whole = '0', frac = ''] = s.split('.');
    const fracPad = frac.padEnd(8, '0').slice(0, 8);
    return BigInt(whole) * 100000000n + BigInt(fracPad);
}

export class SubmitImportsHandler implements IRpcHandler<unknown[], ISubmitImportsResult> {
    readonly method = 'submitimports';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `submitimports` RPC.
     * @param params - `[importObject]` — a Verus import structure
     * @returns `{ txid }` on success
     */
    async handle(params?: unknown[]): Promise<ISubmitImportsResult> {
        if (!params || params.length < 1) {
            throw new Error('submitimports requires [importObject]');
        }

        // Check wallet
        try {
            this.deps.provider.getWallet();
        } catch {
            return { error: true, message: 'No wallet configured — cannot submit imports' };
        }

        try {
            const importObj = conditionImport(params[0] as Record<string, unknown>);
            const delegator = this.deps.contracts.getDelegator();

            // Check if already processed
            if (importObj.txid) {
                const processed = await delegator.checkImport(importObj.txid);
                if (processed) {
                    // Already processed — return last known hash
                    const lastHash = this.deps.cache.api.get<string>('lastSubmitImportHash');
                    return { txid: lastHash ?? undefined };
                }
            }

            // Static call to test for revert
            await delegator.submitImports.staticCall(importObj);

            // Estimate gas
            const gasEstimate = await delegator.submitImports.estimateGas(importObj);
            if (gasEstimate > BigInt(SUBMIT_IMPORT_MAX_GAS)) {
                return { error: true, message: `Gas limit exceeded: ${gasEstimate} > ${SUBMIT_IMPORT_MAX_GAS}` };
            }

            // Submit the transaction
            const result = await this.deps.txSender.sendContractTransaction(
                delegator,
                'submitImports',
                [importObj],
                { gasLimit: BigInt(SUBMIT_IMPORT_MAX_GAS) },
            );

            this.deps.cache.api.set('lastSubmitImportHash', result.hash);
            return { txid: result.hash };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return { error: true, message: `submitImports: ${msg}` };
        }
    }
}
