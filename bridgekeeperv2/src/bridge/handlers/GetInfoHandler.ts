/**
 * GetInfoHandler — returns bridge node information.
 *
 * The response is consumed by the Verus daemon as a liveness/compatibility check.
 * `chainid` is the vETH currency i-address for the configured network.
 * `blocks` and `tiptime` come from the latest Ethereum block header.
 * No contract calls are made — only the provider is queried for the latest block.
 *
 * Results are cached for 60 s (`GLOBAL_TIME_DELTA`) to avoid unnecessary RPC calls.
 */

import { IRpcHandler } from '../../server/types';
import { IGetInfoResult, IHandlerDependencies } from './types';
import { VERSION, CHAIN_CONFIG, GLOBAL_TIME_DELTA } from '../../config/constants';

export class GetInfoHandler implements IRpcHandler<void, IGetInfoResult> {
    readonly method = 'getinfo';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `getinfo` RPC.
     * @returns Bridge node info: version, blocks, tiptime, chainid.
     */
    async handle(): Promise<IGetInfoResult> {
        // Check cache
        const cached = this.deps.cache.api.get<IGetInfoResult>('getInfo');
        if (cached) return cached;

        // Verify connectivity
        const isOnline = await this.deps.provider.isOnline();
        if (!isOnline) {
            throw new Error('web3 provider is not connected');
        }

        const block = await this.deps.provider.getBlock('latest');
        if (!block || !block.timestamp) {
            throw new Error('No block data available yet');
        }

        const ticker = this.deps.config.ticker;
        const chainid = CHAIN_CONFIG.VETH_CURRENCY_ID[ticker];

        const result: IGetInfoResult = {
            version: VERSION,
            name: 'VETH',
            blocks: block.number,
            tiptime: block.timestamp,
            chainid,
            longestchain: block.number,
        };

        this.deps.cache.api.set('getInfo', result, GLOBAL_TIME_DELTA);
        return result;
    }
}
