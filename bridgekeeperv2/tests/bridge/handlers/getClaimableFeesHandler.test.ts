/**
 * GetClaimableFeesHandler unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetClaimableFeesHandler } from '../../../src/bridge/handlers/GetClaimableFeesHandler';
import { createMockDeps } from './helpers';
import type { IHandlerDependencies } from '../../../src/bridge/handlers/types';

describe('GetClaimableFeesHandler', () => {
    let handler: GetClaimableFeesHandler;
    let deps: IHandlerDependencies;

    beforeEach(() => {
        deps = createMockDeps();
        handler = new GetClaimableFeesHandler(deps);
    });

    it('should return claimable fees for an address', async () => {
        // Mock claimableFees to return 100000000 (1.0 ETH in sats)
        const delegator = deps.contracts.getDelegatorReadOnly();
        (delegator.claimableFees as any).mockResolvedValue(100000000n);

        const result = await handler.handle(['iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm']);
        expect(result).toBeDefined();
    });

    it('should throw when no address is provided', async () => {
        await expect(handler.handle([])).rejects.toThrow();
    });

    it('should throw when called without params', async () => {
        await expect(handler.handle()).rejects.toThrow();
    });
});
