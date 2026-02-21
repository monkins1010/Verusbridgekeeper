/**
 * Handler test helpers — mock dependencies for bridge handler unit tests.
 */

import { vi } from 'vitest';
import type { IHandlerDependencies } from '../../src/bridge/handlers/types';

/**
 * Create a set of fully-mocked handler dependencies.
 * Every method is a vitest mock (`vi.fn()`), so callers can set return
 * values via `.mockResolvedValue()` / `.mockReturnValue()`.
 */
export function createMockDeps(overrides?: Partial<IHandlerDependencies>): IHandlerDependencies {
    const cache = {
        api: { get: vi.fn().mockReturnValue(null), set: vi.fn(), clear: vi.fn() },
        block: { get: vi.fn().mockReturnValue(null), set: vi.fn(), clear: vi.fn() },
        import: { get: vi.fn().mockReturnValue(null), set: vi.fn(), clear: vi.fn() },
        set: vi.fn(),
        get: vi.fn().mockReturnValue(null),
        clearStore: vi.fn(),
        clear: vi.fn(),
        prune: vi.fn(),
        size: 0,
    } as any;

    const provider = {
        getBlock: vi.fn().mockResolvedValue({ number: 100, timestamp: 1700000000 }),
        getProvider: vi.fn().mockReturnValue({
            getBlock: vi.fn().mockResolvedValue({
                number: 100,
                timestamp: 1700000000,
                stateRoot: '0x' + 'ab'.repeat(32),
                hash: '0x' + 'cd'.repeat(32),
                baseFeePerGas: 10000000000n,
                difficulty: 0n,
                transactions: ['0x1234'],
            }),
            getTransaction: vi.fn().mockResolvedValue({ gasPrice: 100000000000n }),
        }),
        isOnline: vi.fn().mockResolvedValue(true),
        getWallet: vi.fn().mockReturnValue({ address: '0x1234567890abcdef1234567890abcdef12345678' }),
    } as any;

    const contracts = {
        getDelegator: vi.fn().mockReturnValue({
            claimableFees: vi.fn().mockResolvedValue(0n),
            revokeWithMainAddress: {
                staticCall: vi.fn().mockResolvedValue(undefined),
            },
            getcurrency: vi.fn().mockResolvedValue('0x'),
            bestForks: vi.fn().mockResolvedValue('0x'),
            setLatestData: {
                staticCall: vi.fn().mockResolvedValue(undefined),
            },
            submitImports: {
                staticCall: vi.fn().mockResolvedValue(undefined),
                estimateGas: vi.fn().mockResolvedValue(500000n),
            },
            checkImport: vi.fn().mockResolvedValue(false),
            lastImportInfo: vi.fn().mockResolvedValue('0x' + '00'.repeat(128)),
        }),
        getDelegatorReadOnly: vi.fn().mockReturnValue({
            claimableFees: vi.fn().mockResolvedValue(0n),
            getcurrency: vi.fn().mockResolvedValue('0x'),
            bestForks: vi.fn().mockResolvedValue('0x'),
            lastImportInfo: vi.fn().mockResolvedValue('0x' + '00'.repeat(128)),
        }),
    } as any;

    const txSender = {
        sendContractTransaction: vi.fn().mockResolvedValue({
            hash: '0xabcdef',
            blockNumber: 101,
            gasUsed: 200000n,
            status: 1,
        }),
    } as any;

    const config = {
        ticker: 'VRSCTEST' as const,
        ethNodeUrl: 'wss://test',
        delegatorAddress: '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d',
        hasPrivateKey: true,
    } as any;

    return {
        cache,
        provider,
        contracts,
        txSender,
        config,
        ...overrides,
    } as IHandlerDependencies;
}
