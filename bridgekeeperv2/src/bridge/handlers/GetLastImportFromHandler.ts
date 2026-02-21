/**
 * GetLastImportFromHandler — returns last import data from the delegator contract.
 *
 * Queries `lastImportInfo(SUBMIT_IMPORTS_LAST_TXID)` and `bestForks(0)` to build
 * a `{ lastimport, lastconfirmednotarization, lastconfirmedutxo }` object that
 * the Verus daemon needs to know where to resume imports from.
 *
 * Results are cached for 60 s.
 */

import { IRpcHandler } from '../../server/types';
import { IHandlerDependencies } from './types';
import { removeHexPrefix } from '../../utils/hex';
import { LIF, getChainConfig } from '../../config/constants';

/** Reverse bytes of a hex string (pair-wise) */
function reverseBytes(hex: string): string {
    const m = hex.match(/.{2}/g);
    return m ? m.reverse().join('') : hex;
}

/** The fixed bytes32 key for querying last import TXID */
const SUBMIT_IMPORTS_LAST_TXID =
    '0x00000000000000000000000037256eef64a0bf17344bcb0cbfcde4bea6746347';

/** Cache key and TTL */
const CACHE_KEY = 'lastImportFrom';
const CACHE_TTL = 60_000;

export class GetLastImportFromHandler implements IRpcHandler<unknown[], unknown> {
    readonly method = 'getlastimportfrom';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `getlastimportfrom` RPC.
     * @returns `{ lastimport, lastconfirmednotarization, lastconfirmedutxo }`
     */
    async handle(_params?: unknown[]): Promise<unknown> {
        // Return cached if available
        const cached = this.deps.cache.import.get<unknown>(CACHE_KEY);
        if (cached) return cached;

        try {
            const delegator = this.deps.contracts.getDelegatorReadOnly();
            const ticker = this.deps.config.ticker;
            const chainConfig = getChainConfig(ticker);
            const ethSystemId = chainConfig.vethCurrencyId;

            // Get last import info from contract
            const lastImportInfo = await delegator.lastImportInfo(SUBMIT_IMPORTS_LAST_TXID);

            // Build lastimport object
            const lastimport: Record<string, unknown> = {
                version: LIF.VERSION,
                flags: LIF.FLAGS,
                sourcesystemid: ethSystemId,
                sourceheight: Number(lastImportInfo.height),
                importcurrencyid: ethSystemId,
                valuein: {},
                tokensout: {},
                numoutputs: {},
                hashtransfers: reverseBytes(removeHexPrefix(lastImportInfo.hashOfTransfers)),
                exporttxid: reverseBytes(removeHexPrefix(lastImportInfo.exporttxid)),
                exporttxout: Number(lastImportInfo.exporttxoutnum),
            };

            // Get last confirmed UTXO from bestForks(0)
            let lastconfirmedutxo: Record<string, unknown> = {};
            try {
                let forksData: string = await delegator.bestForks(0);
                forksData = removeHexPrefix(forksData);

                const lengthMod = forksData.length % LIF.FORKLEN;
                const nPos = lengthMod === 0 ? LIF.NPOS : LIF.NPOS_VRSCTEST;
                const txidPos = LIF.TXIDPOS;

                const txid = '0x' + reverseBytes(
                    forksData.substring(txidPos, txidPos + LIF.BYTES32SIZE),
                );
                const n = parseInt(forksData.substring(nPos, nPos + 8), LIF.HEX);

                lastconfirmedutxo = {
                    txid: removeHexPrefix(txid),
                    voutnum: n,
                };
            } catch {
                // No notarizations received yet — leave empty
            }

            const result = {
                lastimport,
                lastconfirmednotarization: {},
                lastconfirmedutxo,
            };

            this.deps.cache.import.set(CACHE_KEY, result, CACHE_TTL);
            return result;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return { error: true, message: `getLastImportFrom: ${msg}` };
        }
    }
}
