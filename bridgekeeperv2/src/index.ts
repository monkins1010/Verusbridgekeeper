/**
 * BridgeKeeper — top-level orchestrator for the Verus-Ethereum bridge.
 *
 * Exports start/stop/status for both programmatic use and CLI invocation.
 * Wires together ConfigManager, RpcServer, BridgeService, and all dependencies
 * using constructor injection (no global mutable state).
 *
 * Usage:
 *   import { BridgeKeeper } from './index';
 *   const bridge = new BridgeKeeper();
 *   await bridge.start({ ticker: 'VRSC' });
 */

import { IBridgeConfig, IServerStatus, ServerStatus } from './types/common';
import { ConfigManager } from './config/ConfigManager';
import { RpcServer } from './server/RpcServer';
import { RpcRouter } from './server/RpcRouter';
import { EthereumProvider } from './ethereum/EthereumProvider';
import { ContractManager } from './ethereum/ContractManager';
import { TransactionSender } from './ethereum/TransactionSender';
import { EventListener } from './ethereum/EventListener';
import { BridgeService } from './bridge/BridgeService';
import { CacheManager } from './cache/CacheManager';
import { GLOBAL_TIME_DELTA } from './config/constants';

export class BridgeKeeper {
    private rpcServer: RpcServer | null = null;
    private bridgeService: BridgeService | null = null;
    private configManager: ConfigManager | null = null;
    private log: (...args: unknown[]) => void = () => {};

    /**
     * Start the bridge keeper.
     *
     * 1. Loads configuration from veth.conf
     * 2. Initializes Ethereum provider + contracts
     * 3. Builds the handler chain and wires dependencies
     * 4. Starts the HTTP RPC server
     *
     * @param config - Bridge configuration (ticker, debug flags, etc.)
     * @returns true on success, Error on failure
     */
    async start(config: IBridgeConfig): Promise<boolean | Error> {
        try {
            // --- Config ---
            const configManager = new ConfigManager(config.ticker ?? 'VRSC');
            const confData = configManager.load();
            this.configManager = configManager;

            this.log = config.consoleLog ? console.log : () => {};

            // Validate essential config
            if (!confData.ethnode || confData.ethnode === 'wss://your-eth-node-url') {
                throw new Error(
                    'Ethereum node URL not configured. Edit the conf file and restart.',
                );
            }

            // --- Ethereum layer ---
            const provider = new EthereumProvider({
                url: confData.ethnode,
                autoReconnect: true,
                reconnectIntervalMs: 5_000,
                maxReconnectAttempts: 10,
            });

            const contracts = new ContractManager(provider, confData.delegatorcontractaddress);
            const txSender = new TransactionSender(provider);
            const eventListener = new EventListener(provider, contracts);

            // --- Cache ---
            const cache = new CacheManager({
                apiTtlMs: GLOBAL_TIME_DELTA,
                blockTtlMs: GLOBAL_TIME_DELTA * 5,
                importTtlMs: GLOBAL_TIME_DELTA * 5,
            });

            // --- Bridge service (wires handlers + Ethereum layer) ---
            const bridgeService = new BridgeService({
                config: configManager,
                provider,
                contracts,
                cache,
                txSender,
                eventListener,
            });

            // Initialize: connect provider, load contracts
            await bridgeService.initialize(confData.privatekey);
            this.bridgeService = bridgeService;

            // --- RPC Server ---
            const router = new RpcRouter();
            bridgeService.registerHandlers(router);

            // Add a stop handler that can be called via RPC
            router.register({
                method: 'stop',
                handle: async () => {
                    // Schedule stop asynchronously so the RPC response can be sent first
                    setTimeout(() => this.stop(), 100);
                    return { result: 'Bridgekeeper stopping...' };
                },
            });

            const rpcServer = new RpcServer(router, {
                port: configManager.rpcPort,
                userpass: configManager.rpcUserPass,
                allowIp: configManager.rpcAllowIp,
                requestTimeoutMs: 20_000,
                debug: config.debug ?? false,
            });

            await rpcServer.listen();
            this.rpcServer = rpcServer;

            console.log(`Bridgekeeper started listening on port: ${configManager.rpcPort}`);
            return true;
        } catch (error) {
            console.error('Failed to start Bridgekeeper:', error);
            return error instanceof Error ? error : new Error(String(error));
        }
    }

    /**
     * Stop the bridge keeper.
     * Shuts down the RPC server, disconnects from Ethereum, and cleans up resources.
     */
    async stop(): Promise<boolean | Error> {
        try {
            if (this.bridgeService) {
                await this.bridgeService.shutdown();
                this.bridgeService = null;
            }

            if (this.rpcServer) {
                await this.rpcServer.close();
                this.rpcServer = null;
            }

            console.log('Bridgekeeper stopped.');
            return true;
        } catch (error) {
            console.error('Error stopping Bridgekeeper:', error);
            return error instanceof Error ? error : new Error(String(error));
        }
    }

    /**
     * Get the current status of the bridge keeper.
     * Checks server listening state and WebSocket connection health.
     */
    async status(): Promise<IServerStatus> {
        const serverRunning = this.rpcServer?.isListening ?? false;
        let websocketOk = false;

        try {
            if (this.bridgeService) {
                websocketOk = await this.bridgeService.isHealthy();
            }
        } catch {
            websocketOk = false;
        }

        let status: ServerStatus;
        if (!serverRunning) {
            status = ServerStatus.OFF;
        } else if (websocketOk) {
            status = ServerStatus.OK;
        } else {
            status = ServerStatus.WEBSOCKET_FAULT;
        }

        return {
            serverRunning: status,
            logs: this.rpcServer?.recentLogs ?? [],
        };
    }
}

// Default export for library usage
export default BridgeKeeper;

// Re-export key types for consumers
export { IBridgeConfig, IServerStatus, ServerStatus } from './types/common';
export { ConfigManager } from './config/ConfigManager';
