/**
 * EthereumProvider — manages ethers.js WebSocket provider with auto-reconnection.
 * Uses native WebSocket ping/pong heartbeat to detect half-open connections.
 * Replaces the web3.js provider setup from ethInteractor.js.
 */

import { ethers } from 'ethers';
import { IProviderOptions } from './types';

/**
 * The underlying ws.WebSocket supports ping/pong, but ethers' WebSocketLike
 * interface doesn't expose it. We use this to type-narrow the raw WebSocket
 * for heartbeat without importing ws as a direct dependency.
 */
interface RawWebSocket extends ethers.WebSocketLike {
    ping(data?: unknown, mask?: boolean, cb?: (err: Error) => void): void;
    on(event: string, listener: (...args: unknown[]) => void): this;
    removeAllListeners(event?: string): this;
}

export class EthereumProvider {
    private provider: ethers.WebSocketProvider | null = null;
    private wallet: ethers.Wallet | null = null;
    private options: Required<IProviderOptions>;
    private reconnectAttempts = 0;
    private reconnecting = false;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private pongReceived = true;
    private reconnectCallbacks: Array<() => void | Promise<void>> = [];
    private lastPrivateKey?: string;

    constructor(options: IProviderOptions) {
        this.options = {
            autoReconnect: true,
            reconnectIntervalMs: 5_000,
            maxReconnectAttempts: 10,
            heartbeatIntervalMs: 30_000,
            txConfirmTimeoutMs: 120_000,
            ...options,
        };
    }

    /**
     * Register a callback invoked after a successful reconnection.
     * Use this to re-subscribe EventListener or refresh state.
     */
    onReconnect(callback: () => void | Promise<void>): void {
        this.reconnectCallbacks.push(callback);
    }

    /** Initialize the WebSocket provider and wallet */
    async connect(privateKey?: string): Promise<void> {
        this.stopHeartbeat();

        if (privateKey) {
            this.lastPrivateKey = privateKey;
        }

        this.provider = new ethers.WebSocketProvider(
            this.options.url,
            undefined,
            { staticNetwork: true },
        );

        this.reconnectAttempts = 0;

        if (this.lastPrivateKey) {
            this.wallet = new ethers.Wallet(this.lastPrivateKey, this.provider);
        }

        // Set up auto-reconnect on WebSocket close / error
        if (this.options.autoReconnect) {
            this.setupReconnection();
        }

        // Wait for the provider to be ready
        await this.provider.ready;

        // Start ping/pong heartbeat after connection is established
        this.startHeartbeat();
    }

    /** Get the underlying ethers provider */
    getProvider(): ethers.WebSocketProvider {
        if (!this.provider) {
            throw new Error('Provider not connected. Call connect() first.');
        }
        return this.provider;
    }

    /** Get the wallet (signer) instance */
    getWallet(): ethers.Wallet {
        if (!this.wallet) {
            throw new Error('Wallet not initialized. Provide a private key on connect().');
        }
        return this.wallet;
    }

    /** Transaction confirmation timeout in ms (for tx.wait) */
    get txConfirmTimeoutMs(): number {
        return this.options.txConfirmTimeoutMs;
    }

    /** Check if the WebSocket connection is alive */
    async isOnline(): Promise<boolean> {
        try {
            if (!this.provider) return false;
            await this.provider.getBlockNumber();
            return true;
        } catch {
            return false;
        }
    }

    /** Get the latest block */
    async getBlock(tag: string | number = 'latest'): Promise<ethers.Block | null> {
        return this.getProvider().getBlock(tag);
    }

    /** Get network info */
    async getNetwork(): Promise<ethers.Network> {
        return this.getProvider().getNetwork();
    }

    /** Disconnect the provider and clean up heartbeat */
    async disconnect(): Promise<void> {
        this.stopHeartbeat();

        if (this.provider) {
            await this.provider.destroy();
            this.provider = null;
            this.wallet = null;
        }
    }

    /**
     * Start WebSocket ping/pong heartbeat.
     *
     * The underlying ws.WebSocket supports the WebSocket protocol's native
     * ping/pong frames. We send a ping every `heartbeatIntervalMs`. If no
     * pong is received before the next ping fires, the connection is
     * considered stale and we force a reconnect via provider.destroy().
     */
    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.pongReceived = true;

        if (!this.provider) return;

        const ws = this.provider.websocket;

        // Check that the underlying websocket actually supports ping/pong
        // (the ws library does; browser WebSocket does not)
        if (!('ping' in ws) || typeof (ws as RawWebSocket).ping !== 'function') {
            return;
        }

        const rawWs = ws as RawWebSocket;

        // Listen for pong responses
        rawWs.on('pong', () => {
            this.pongReceived = true;
        });

        this.heartbeatInterval = setInterval(() => {
            // readyState 1 === OPEN
            if (!this.provider || rawWs.readyState !== 1) {
                return;
            }

            if (!this.pongReceived) {
                // Missed pong — connection is stale
                console.error('WebSocket heartbeat timeout — no pong received. Forcing reconnect.');
                this.handleStaleConnection();
                return;
            }

            this.pongReceived = false;
            rawWs.ping();
        }, this.options.heartbeatIntervalMs);
    }

    /** Stop the heartbeat interval */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Handle a stale connection: destroy the provider and trigger reconnection.
     * provider.destroy() is the ethers-native way to release all resources.
     */
    private async handleStaleConnection(): Promise<void> {
        this.stopHeartbeat();

        if (this.provider) {
            try {
                await this.provider.destroy();
            } catch {
                // Provider may already be in a bad state
            }
            this.provider = null;
        }

        if (this.options.autoReconnect && !this.reconnecting) {
            this.attemptReconnect();
        }
    }

    /**
     * Setup automatic reconnection on WebSocket close.
     * Uses ws EventEmitter .on('close') so we don't conflict with any
     * ethers-internal property handlers.
     */
    private setupReconnection(): void {
        if (!this.provider) return;

        const ws = this.provider.websocket;

        if ('on' in ws && typeof (ws as RawWebSocket).on === 'function') {
            (ws as RawWebSocket).on('close', () => {
                if (!this.reconnecting && this.options.autoReconnect) {
                    this.attemptReconnect();
                }
            });
        } else {
            // Fallback: use the onerror property for environments without .on()
            const prevOnError = ws.onerror;
            ws.onerror = (...args: unknown[]) => {
                if (prevOnError) prevOnError.call(ws, ...args);
                if (!this.reconnecting && this.options.autoReconnect) {
                    this.attemptReconnect();
                }
            };
        }
    }

    /** Attempt to reconnect to the WebSocket */
    private async attemptReconnect(): Promise<void> {
        if (this.reconnecting) return;
        this.reconnecting = true;

        const maxAttempts = this.options.maxReconnectAttempts;
        const intervalMs = this.options.reconnectIntervalMs;

        while (this.reconnectAttempts < maxAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnection attempt ${this.reconnectAttempts}/${maxAttempts}...`);

            try {
                await this.connect(this.lastPrivateKey);
                console.log('Successfully reconnected to WebSocket provider.');
                this.reconnecting = false;

                // Notify listeners (e.g. EventListener) to re-subscribe
                for (const cb of this.reconnectCallbacks) {
                    try {
                        await cb();
                    } catch (err) {
                        console.error('Reconnect callback error:', err);
                    }
                }

                return;
            } catch (err) {
                console.error(`Reconnection failed: ${err instanceof Error ? err.message : err}`);
                await new Promise((resolve) => setTimeout(resolve, intervalMs));
            }
        }

        this.reconnecting = false;
        console.error(`Failed to reconnect after ${maxAttempts} attempts.`);
    }
}
