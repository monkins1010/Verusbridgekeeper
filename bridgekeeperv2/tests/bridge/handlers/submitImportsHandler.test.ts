/**
 * SubmitImportsHandler unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubmitImportsHandler } from '../../../src/bridge/handlers/SubmitImportsHandler';
import { createMockDeps } from './helpers';
import type { IHandlerDependencies } from '../../../src/bridge/handlers/types';

describe('SubmitImportsHandler', () => {
    let handler: SubmitImportsHandler;
    let deps: IHandlerDependencies;

    beforeEach(() => {
        deps = createMockDeps();
        handler = new SubmitImportsHandler(deps);
    });

    it('should throw when no params provided', async () => {
        await expect(handler.handle([])).rejects.toThrow();
    });

    it('should return error when no wallet configured', async () => {
        (deps.provider.getWallet as any).mockImplementation(() => {
            throw new Error('No wallet');
        });

        const result = await handler.handle([{ txid: '0x1234' }]);
        expect(result.error).toBe(true);
        expect(result.message).toContain('No wallet');
    });

    it('should skip already processed imports', async () => {
        const delegator = deps.contracts.getDelegator();
        (delegator.checkImport as any).mockResolvedValue(true);
        // Store a last hash in cache
        (deps.cache.api.get as any).mockReturnValue('0xpreviousTx');

        const result = await handler.handle([{ txid: '0xabc123' }]);
        expect(result.txid).toBe('0xpreviousTx');
    });

    it('should condition transfers with address conversion', async () => {
        const delegator = deps.contracts.getDelegator();
        const submitImportsMock = delegator.submitImports as any;

        const importObj = {
            sourcesystemid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
            importcurrencyid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
            transfers: [
                {
                    currencyvalues: { iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '1.00000000' },
                    flags: 0,
                    feecurrencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                    fees: '0.01000000',
                    destination: { type: 4, address: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq' },
                },
            ],
        };

        const result = await handler.handle([importObj]);
        expect(result.txid).toBeDefined();
    });
});
