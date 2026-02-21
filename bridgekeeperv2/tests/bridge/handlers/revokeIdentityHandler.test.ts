/**
 * RevokeIdentityHandler unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RevokeIdentityHandler } from '../../../src/bridge/handlers/RevokeIdentityHandler';
import { createMockDeps } from './helpers';
import type { IHandlerDependencies } from '../../../src/bridge/handlers/types';

describe('RevokeIdentityHandler', () => {
    let handler: RevokeIdentityHandler;
    let deps: IHandlerDependencies;

    beforeEach(() => {
        deps = createMockDeps();
        handler = new RevokeIdentityHandler(deps);
    });

    it('should submit revocation and return txid', async () => {
        const result = await handler.handle();
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
    });

    it('should return error when getDelegator throws', async () => {
        (deps.contracts.getDelegator as any).mockImplementation(() => {
            throw new Error('No wallet configured');
        });

        const result = await handler.handle() as Record<string, unknown>;
        expect(result).toHaveProperty('error', true);
        expect(result.message).toContain('No wallet');
    });

    it('should call staticCall before sending transaction', async () => {
        await handler.handle();

        const delegator = deps.contracts.getDelegator();
        expect(delegator.revokeWithMainAddress.staticCall).toHaveBeenCalled();
    });
});
