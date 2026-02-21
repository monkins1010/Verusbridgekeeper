/**
 * RpcRouter — maps RPC method names to handler instances.
 * Replaces the old apiFunctions.js lookup table.
 */

import { IRpcHandler, IRpcResponse } from './types';

export class RpcRouter {
    private handlers: Map<string, IRpcHandler> = new Map();

    /** Register one or more handlers */
    register(...handlers: IRpcHandler[]): void {
        for (const handler of handlers) {
            this.handlers.set(handler.method, handler);
        }
    }

    /** Look up and invoke the handler for a given RPC method */
    async dispatch(method: string, params?: unknown[]): Promise<IRpcResponse> {
        const handler = this.handlers.get(method);

        if (!handler) {
            return {
                error: {
                    code: -32601,
                    message: `Method not found: ${method}`,
                },
            };
        }

        try {
            const result = await handler.handle(params);
            return { result };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            return {
                error: {
                    code: -32603,
                    message,
                },
            };
        }
    }

    /** Check if a handler exists for the given method */
    has(method: string): boolean {
        return this.handlers.has(method);
    }

    /** List all registered method names */
    methods(): string[] {
        return Array.from(this.handlers.keys());
    }
}
