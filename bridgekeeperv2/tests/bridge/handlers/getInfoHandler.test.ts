/**
 * GetInfoHandler unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetInfoHandler } from '../../../src/bridge/handlers/GetInfoHandler';
import { createMockDeps } from './helpers';
import type { IHandlerDependencies } from '../../../src/bridge/handlers/types';

describe('GetInfoHandler', () => {
    let handler: GetInfoHandler;
    let deps: IHandlerDependencies;

    beforeEach(() => {
        deps = createMockDeps();
        handler = new GetInfoHandler(deps);
    });

    it('should return bridge info with correct fields', async () => {
        const result = await handler.handle();

        expect(result.version).toBe('2.0.0');
        expect(result.name).toBe('VETH');
        expect(result.blocks).toBe(100);
        expect(result.tiptime).toBe(1700000000);
        expect(result.chainid).toBe('iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm');
        expect(result.longestchain).toBe(100);
    });

    it('should use cached result on second call', async () => {
        // First call — stores in cache
        await handler.handle();
        // Mock cache to return stored value
        (deps.cache.api.get as any).mockReturnValue({
            version: '2.0.0',
            name: 'VETH',
            blocks: 100,
            tiptime: 1700000000,
            chainid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
            longestchain: 100,
        });

        const result = await handler.handle();
        expect(result.blocks).toBe(100);
        // Provider.getBlock should only be called once (first call)
        expect(deps.provider.getBlock).toHaveBeenCalledTimes(1);
    });

    it('should throw when provider is offline', async () => {
        (deps.provider.isOnline as any).mockResolvedValue(false);

        await expect(handler.handle()).rejects.toThrow('web3 provider is not connected');
    });

    it('should throw when no block data is available', async () => {
        (deps.provider.getBlock as any).mockResolvedValue(null);

        await expect(handler.handle()).rejects.toThrow('No block data available');
    });

    it('should return VRSCTEST chain ID for VRSCTEST ticker', async () => {
        const result = await handler.handle();
        expect(result.chainid).toBe('iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm');
    });
});
