/**
 * RPC server type definitions.
 */

/** JSON-RPC request envelope */
export interface IRpcRequest {
    jsonrpc?: string;
    id?: number | string;
    method: string;
    params?: unknown[];
}

/** JSON-RPC response envelope */
export interface IRpcResponse<T = unknown> {
    jsonrpc?: string;
    id?: number | string;
    result?: T;
    error?: IRpcError;
}

/** JSON-RPC error */
export interface IRpcError {
    code?: number;
    message: string;
    data?: unknown;
}

/** Handler interface for RPC methods */
export interface IRpcHandler<TParams = unknown, TResult = unknown> {
    readonly method: string;
    handle(params: TParams): Promise<TResult>;
}

/** Server configuration for the HTTP RPC server */
export interface IServerConfig {
    port: number;
    userpass: string;
    allowIp: string;
    concurrency?: number;
    requestTimeoutMs?: number;
}
