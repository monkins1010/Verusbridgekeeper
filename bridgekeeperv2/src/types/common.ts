/**
 * Common shared types used across the bridge keeper application.
 */

/** Supported network tickers */
export type Ticker = 'VRSC' | 'VRSCTEST';

/** Server status codes */
export enum ServerStatus {
    OFF = 0,
    OK = 1,
    RPC_FAULT = 2,
    WEBSOCKET_FAULT = 3,
}

/** Configuration passed to BridgeKeeper.start() */
export interface IBridgeConfig {
    ticker?: Ticker;
    debug?: boolean;
    debugSubmit?: boolean;
    debugNotarization?: boolean;
    noImports?: boolean;
    checkHash?: boolean;
    consoleLog?: boolean;
}

/** Status response from BridgeKeeper.status() */
export interface IServerStatus {
    serverRunning: ServerStatus;
    logs: string[];
}

/** Log entry with timestamp */
export interface ILogEntry {
    timestamp: Date;
    message: string;
}
