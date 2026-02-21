/**
 * Ethereum module type definitions.
 */

/** Options for provider connection */
export interface IProviderOptions {
    /** WebSocket URL */
    url: string;
    /** Reconnect on disconnect */
    autoReconnect?: boolean;
    /** Reconnection attempt interval in ms */
    reconnectIntervalMs?: number;
    /** Max reconnection attempts */
    maxReconnectAttempts?: number;
    /** Interval between WebSocket ping frames (ms). Default: 30000 */
    heartbeatIntervalMs?: number;
    /** Transaction confirmation timeout (ms) for tx.wait(). Default: 120000 */
    txConfirmTimeoutMs?: number;
}

/** Delegator sub-contract addresses (from getContractInfo()) */
export interface IDelegatorContracts {
    tokenManager: string;
    verusSerializer: string;
    verusProof: string;
    verusCrossChainExport: string;
    verusNotarizer: string;
    createExport: string;
    verusNotaryTools: string;
    exportManager: string;
    submitImports: string;
    notarizationSerializer: string;
    upgradeManager: string;
}

/** Result from a submitted transaction */
export interface ITransactionResult {
    hash: string;
    blockNumber: number;
    gasUsed: bigint;
    status: number;
}

/** Notarization event data from contract */
export interface INotarizationEvent {
    verusHeight: number;
    ethHeight: number;
    txid: string;
    blockHash: string;
}
