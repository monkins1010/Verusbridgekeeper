/**
 * GetNotarizationDataHandler — returns fork/notarization data from the contract.
 *
 * Loops through `delegator.bestForks(j)` for j = 0..N, parsing each returned
 * hex blob in FORKLEN-sized chunks to extract notarization hash, txid, and vout.
 * Returns a Verus-daemon-compatible object with `{ version, forks, lastconfirmed,
 * bestchain, notarizations }`.
 *
 * Results are cached for 300 s.
 */

import { IRpcHandler } from '../../server/types';
import { IHandlerDependencies } from './types';
import { removeHexPrefix } from '../../utils/hex';
import {
    VERSION_NOTARIZATIONDATA_CURRENT,
    LIF,
} from '../../config/constants';

/** Reverse bytes of a hex string (pair-wise) */
function reverseBytes(hex: string): string {
    const m = hex.match(/.{2}/g);
    return m ? m.reverse().join('') : hex;
}

/** Cache key and TTL */
const CACHE_KEY = 'getNotarizationData';
const CACHE_TTL = 300_000; // 5 minutes

/** Safety limit on fork iterations */
const MAX_FORKS_ITERATIONS = 100;

export class GetNotarizationDataHandler implements IRpcHandler<unknown[], unknown> {
    readonly method = 'getnotarizationdata';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `getnotarizationdata` RPC.
     * @returns `{ version, forks, lastconfirmed, bestchain, notarizations }`
     */
    async handle(_params?: unknown[]): Promise<unknown> {
        // Return cached if available
        const cached = this.deps.cache.api.get<unknown>(CACHE_KEY);
        if (cached) return cached;

        const notarizationResult: Record<string, unknown> = {
            version: VERSION_NOTARIZATIONDATA_CURRENT,
        };

        try {
            const delegator = this.deps.contracts.getDelegatorReadOnly();

            const forksArray: number[][] = [];
            const notarizations: Record<number, { txid: string; n: number; hash: string }> = {};
            let bestchain = -1;
            let largestIndex = 0;
            let calcIndex = 0;
            let j = 0;

            try {
                while (j < MAX_FORKS_ITERATIONS) {
                    let notarization: string = await delegator.bestForks(j);
                    notarization = removeHexPrefix(notarization);

                    // Determine fork length based on hex layout version
                    const lengthMod = notarization.length % LIF.FORKLEN;
                    const voutPosition = lengthMod === 0 ? LIF.NPOS : LIF.NPOS_VRSCTEST;
                    const forkLength = lengthMod === 0 ? LIF.FORKLEN : LIF.FORKLEN_VRSCTEST;

                    if (!notarization || notarization.length < forkLength) break;

                    const length = notarization.length / forkLength;
                    const forksData: number[] = [];

                    for (let i = 0; i < length; i++) {
                        const hashPos = LIF.HASHPOS + i * forkLength;
                        const txidPos = LIF.TXIDPOS + i * forkLength;
                        const nPos = voutPosition + i * forkLength;

                        if (largestIndex < calcIndex) {
                            largestIndex = calcIndex;
                            bestchain = j;
                        }

                        if ((j === 0 && i === 0) || i > 0) {
                            notarizations[calcIndex] = {
                                txid: '0x' + reverseBytes(notarization.substring(txidPos, txidPos + LIF.BYTES32SIZE)),
                                n: parseInt(notarization.slice(nPos, nPos + 8), LIF.HEX),
                                hash: '0x' + reverseBytes(notarization.substring(hashPos, hashPos + LIF.BYTES32SIZE)),
                            };
                            forksData.push(calcIndex);
                            calcIndex++;
                        } else {
                            forksData.push(0);
                        }
                    }

                    forksArray.push(forksData);
                    j++;
                }
            } catch {
                // bestForks may revert when no more forks exist — this is expected
            }

            if (forksArray.length === 0) {
                notarizationResult.forks = [];
                notarizationResult.lastconfirmed = -1;
                notarizationResult.bestchain = -1;
            } else {
                notarizationResult.forks = forksArray;
                notarizationResult.lastconfirmed =
                    forksArray.length === 1 && forksArray[0].length === 1 ? -1 : 0;
                notarizationResult.bestchain = bestchain;
                notarizationResult.notarizations = Object.keys(notarizations).map((idx) => ({
                    index: parseInt(idx),
                    txid: removeHexPrefix(notarizations[parseInt(idx)].txid),
                    vout: notarizations[parseInt(idx)].n,
                }));
            }

            this.deps.cache.api.set(CACHE_KEY, notarizationResult, CACHE_TTL);
            return notarizationResult;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return { error: true, message: `getNotarizationData: ${msg}` };
        }
    }
}
