/**
 * GetClaimableFeesHandler — returns claimable notary pool fees for an ETH address.
 *
 * Accepts an ETH address, formats it as a Verus-compatible key
 * (`0x` + padLeft(`0c14` + address, 64)), and queries the delegator contract's
 * `claimableFees` method. Returns the fees as a Verus-float string keyed by address.
 */

import { IRpcHandler } from '../../server/types';
import { IHandlerDependencies } from './types';
import { removeHexPrefix } from '../../utils/hex';

/** Convert a uint64 satoshi value to a "X.XXXXXXXX" Verus-float string. */
function uint64ToVerusFloat(sats: bigint): string {
    const SATS = 100000000n;
    const whole = sats / SATS;
    let frac = (sats < 0n ? -(sats % SATS) : sats % SATS).toString();
    while (frac.length < 8) frac = '0' + frac;
    return `${sats < 0n ? '-' : ''}${whole}.${frac}`;
}

export class GetClaimableFeesHandler implements IRpcHandler<unknown[], unknown> {
    readonly method = 'getclaimablefees';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `getclaimablefees` RPC.
     * @param params - `[ethAddress]` — a `0x`-prefixed ETH address
     * @returns `{ ETH: { [address]: feesString } }`
     */
    async handle(params?: unknown[]): Promise<unknown> {
        if (!params || params.length < 1) {
            throw new Error('getclaimablefees requires [ethAddress]');
        }

        const address = params[0] as string;

        if (!address || !address.startsWith('0x') || address.length !== 42) {
            return { error: true, message: 'Not a valid ETH address provided' };
        }

        // Format as Verus key: 0x + padLeft(0c14 + rawAddress, 64)
        const raw = removeHexPrefix(address);
        const formattedAddress = '0x' + (`0c14${raw}`).padStart(64, '0');

        const delegator = this.deps.contracts.getDelegatorReadOnly();
        const feesSats: bigint = await delegator.claimableFees(formattedAddress);
        const fees = uint64ToVerusFloat(feesSats);

        return { ETH: { [address]: fees } };
    }
}
