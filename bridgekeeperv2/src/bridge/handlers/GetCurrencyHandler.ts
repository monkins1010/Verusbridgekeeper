/**
 * GetCurrencyHandler — returns the currency definition from the delegator contract.
 *
 * Calls `delegator.getcurrency(ethAddress)` and ABI-decodes the returned tuple
 * (version, name, currencyid, parent, systemid, notarizationprotocol, proofprotocol,
 * nativecurrencyid, launchsystemid, startblock, endblock, initialsupply,
 * prelaunchcarveout, gatewayid, notaries[], minnotariesconfirm).
 * Results are cached for 60 s.
 */

import { ethers } from 'ethers';
import { IRpcHandler } from '../../server/types';
import { IGetCurrencyResult, IHandlerDependencies } from './types';
import { removeHexPrefix } from '../../utils/hex';
import { fromBase58Check, toBase58Check } from 'verus-typescript-primitives';
import { I_ADDR_VERSION } from 'verus-typescript-primitives/dist/constants/vdxf';

/** Cache TTL for currency data: 60 seconds */
const CURRENCY_CACHE_TTL = 60_000;

/** Convert a raw 20-byte hex address (with or without 0x) to a Verus i-address */
function hexToIAddress(hex: string): string {
    const clean = removeHexPrefix(hex).padStart(40, '0');
    return toBase58Check(Buffer.from(clean, 'hex'), I_ADDR_VERSION);
}

export class GetCurrencyHandler implements IRpcHandler<unknown[], IGetCurrencyResult> {
    readonly method = 'getcurrency';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `getcurrency` RPC.
     * @param params - `[currencyIAddress]` — a Verus i-address or R-address
     * @returns Currency definition object
     */
    async handle(params?: unknown[]): Promise<IGetCurrencyResult> {
        if (!params || params.length < 1) {
            throw new Error('getcurrency requires [currencyAddress]');
        }

        const currency = params[0] as string;

        // Check cache
        const cached = this.deps.cache.api.get<IGetCurrencyResult>('getCurrency');
        if (cached) return cached;

        try {
            // Convert Verus base58 address to 0x-prefixed ETH address
            const { hash } = fromBase58Check(currency);
            const ethAddress = '0x' + hash.toString('hex');

            const delegator = this.deps.contracts.getDelegatorReadOnly();
            const info: string = await delegator.getcurrency(ethAddress);

            // The contract returns ABI-encoded data.
            // Decode using the known tuple layout, skipping the first 32-byte offset+length.
            const abiCoder = ethers.AbiCoder.defaultAbiCoder();
            const decoded = abiCoder.decode(
                [
                    'uint256',    // 0  version
                    'string',     // 1  name
                    'address',    // 2  currencyid
                    'address',    // 3  parent
                    'address',    // 4  systemid
                    'uint8',      // 5  notarizationprotocol
                    'uint8',      // 6  proofprotocol
                    'tuple(uint8,bytes)', // 7  nativecurrencyid
                    'address',    // 8  launchsystemid
                    'uint256',    // 9  startblock
                    'uint256',    // 10 endblock
                    'uint256',    // 11 initialsupply
                    'uint256',    // 12 prelaunchcarveout
                    'address',    // 13 gatewayid
                    'address[]',  // 14 notaries
                    'uint256',    // 15 minnotariesconfirm
                ],
                '0x' + info.slice(66),
            );

            const notaries: string[] = [];
            for (let i = 0; i < decoded[14].length; i++) {
                notaries.push(hexToIAddress(decoded[14][i]));
            }

            const result: IGetCurrencyResult = {
                currencyid: hexToIAddress(decoded[2]),
                currencyidhex: decoded[2],
                parent: hexToIAddress(decoded[3]),
                name: decoded[1] as string,
                currencystate: {
                    version: Number(decoded[0]),
                    name: decoded[1] as string,
                    options: (decoded[1] as string) === 'VETH' ? 172 : 96,
                    currencyid: hexToIAddress(decoded[2]),
                    systemid: hexToIAddress(decoded[4]),
                    notarizationprotocol: Number(decoded[5]),
                    proofprotocol: Number(decoded[6]),
                    launchsystemid: hexToIAddress(decoded[8]),
                    startblock: Number(decoded[9]),
                    endblock: Number(decoded[10]),
                    gatewayid: hexToIAddress(decoded[13]),
                    notaries,
                    minnotariesconfirm: Number(decoded[15]),
                    gatewayconvertername: 'Bridge',
                },
                bestcurrencystate: null,
            };

            this.deps.cache.api.set('getCurrency', result, CURRENCY_CACHE_TTL);
            return result;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`getcurrency: ${msg}`);
        }
    }
}
