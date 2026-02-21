/**
 * CLI tool type definitions.
 */

import { ethers } from 'ethers';
import { Ticker } from '../types/common';

/** Shared context passed to all CLI tools */
export interface IToolContext {
    /** Network ticker (VRSC or VRSCTEST) */
    ticker: Ticker;
    /** WebSocket URL for the Ethereum node */
    ethNodeUrl: string;
    /** Delegator contract address */
    delegatorAddress: string;
    /** Private key (64 hex chars, no 0x prefix). Optional — read-only tools work without it. */
    privateKey?: string;
    /** Verus daemon RPC credentials (if available) */
    verusDaemonRpc?: {
        url: string;
        user: string;
        password: string;
    };
}

/** Interface that all CLI tools must implement */
export interface ICliTool {
    /** Display name in the menu */
    readonly name: string;
    /** Short description */
    readonly description: string;
    /** Detailed help text shown when the tool is selected */
    readonly help: string;
    /** Category for menu grouping */
    readonly category: ToolCategory;
    /** Execute the tool interactively */
    run(ctx: IToolContext): Promise<void>;
}

/** Tool categories for menu grouping */
export enum ToolCategory {
    ContractUpgrade = 'Contract Upgrade',
    IdentityManagement = 'Identity Management',
    FinancialOperations = 'Financial Operations',
    Diagnostics = 'Diagnostics',
    Configuration = 'Configuration',
}

/** Message shown when a private key is required but not configured. */
export const NO_KEY_MESSAGE =
    'A private key must be set in veth.conf to run transactions. Read-only operations are still available.';

/**
 * Helper: create a read-only ethers.js WebSocket provider + delegator contract.
 * No private key needed — suitable for view/read-only operations.
 * Callers must call provider.destroy() when finished.
 */
export async function createReadOnlyProvider(ctx: IToolContext): Promise<{
    provider: ethers.WebSocketProvider;
    delegator: ethers.Contract;
}> {
    const abi = await import('../../abi/VerusDelegator.json');
    const provider = new ethers.WebSocketProvider(ctx.ethNodeUrl);
    await provider.ready;
    const delegator = new ethers.Contract(ctx.delegatorAddress, abi.default ?? abi, provider);
    return { provider, delegator };
}

/**
 * Helper: create an ethers.js WebSocket provider + wallet + delegator contract
 * for use in CLI tools that send transactions.
 * Throws if no private key is configured.
 * Callers must call provider.destroy() when finished.
 */
export async function createToolProvider(ctx: IToolContext): Promise<{
    provider: ethers.WebSocketProvider;
    wallet: ethers.Wallet;
    delegator: ethers.Contract;
}> {
    if (!ctx.privateKey) {
        throw new Error(NO_KEY_MESSAGE);
    }
    const abi = await import('../../abi/VerusDelegator.json');
    const provider = new ethers.WebSocketProvider(ctx.ethNodeUrl);
    await provider.ready;
    const wallet = new ethers.Wallet(ctx.privateKey, provider);
    const delegator = new ethers.Contract(ctx.delegatorAddress, abi.default ?? abi, wallet);
    return { provider, wallet, delegator };
}
