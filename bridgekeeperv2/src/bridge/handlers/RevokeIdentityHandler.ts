/**
 * RevokeIdentityHandler — revokes the caller's identity on the bridge contract.
 *
 * Calls `revokeWithMainAddress("0x04")` on the delegator contract.
 * Requires a configured wallet (private key). First performs a static `call()`
 * to detect revert, then submits the actual transaction via TransactionSender.
 */

import { IRpcHandler } from '../../server/types';
import { IHandlerDependencies } from './types';
import { NOTARIZATION_MAX_GAS } from '../../config/constants';

/** The auto-revoke type byte sent to the contract */
const TYPE_AUTO_REVOKE = '0x04';

export class RevokeIdentityHandler implements IRpcHandler<unknown[], unknown> {
    readonly method = 'revokeidentity';
    private deps: IHandlerDependencies;

    constructor(deps: IHandlerDependencies) {
        this.deps = deps;
    }

    /**
     * Handle `revokeidentity` RPC.
     * @returns `{ txid: string }` on success
     */
    async handle(_params?: unknown[]): Promise<unknown> {
        try {
            const delegator = this.deps.contracts.getDelegator();

            // Static call first to check for revert
            await delegator.revokeWithMainAddress.staticCall(TYPE_AUTO_REVOKE);

            // Send the actual transaction
            const result = await this.deps.txSender.sendContractTransaction(
                delegator,
                'revokeWithMainAddress',
                [TYPE_AUTO_REVOKE],
                { gasLimit: BigInt(NOTARIZATION_MAX_GAS) },
            );

            return { txid: result.hash };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return { error: true, message: msg };
        }
    }
}
