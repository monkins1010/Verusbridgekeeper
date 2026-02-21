/**
 * BridgeService — the main bridge orchestrator.
 * Wires all handlers, manages initialization, and coordinates bridge operations.
 */

import { EthereumProvider } from '../ethereum/EthereumProvider';
import { ContractManager } from '../ethereum/ContractManager';
import { TransactionSender } from '../ethereum/TransactionSender';
import { EventListener } from '../ethereum/EventListener';
import { CacheManager } from '../cache/CacheManager';
import { ConfigManager } from '../config/ConfigManager';
import { RpcRouter } from '../server/RpcRouter';
import { createHandlers, IHandlerDependencies } from './handlers';

export interface IBridgeServiceOptions {
    config: ConfigManager;
    provider: EthereumProvider;
    contracts: ContractManager;
    cache: CacheManager;
    txSender: TransactionSender;
    eventListener: EventListener;
}

export class BridgeService {
    private config: ConfigManager;
    private provider: EthereumProvider;
    private contracts: ContractManager;
    private txSender: TransactionSender;
    private eventListener: EventListener;
    private cache: CacheManager;

    constructor(options: IBridgeServiceOptions) {
        this.config = options.config;
        this.provider = options.provider;
        this.contracts = options.contracts;
        this.txSender = options.txSender;
        this.eventListener = options.eventListener;
        this.cache = options.cache;
    }

    /** Initialize the bridge service: connect to Ethereum, load contracts, register handlers */
    async initialize(privateKey: string): Promise<void> {
        // Connect to Ethereum
        await this.provider.connect(privateKey);

        // Initialize contracts
        await this.contracts.initialize();

        // Set up event listeners
        this.eventListener.onBlock((blockNumber) => {
            // Update block cache
            console.log(`New block: ${blockNumber}`);
        });

        this.eventListener.onNotarization((event) => {
            // Invalidate caches on new notarization
            this.cache.clear();
            console.log(`New notarization at Verus height: ${event.verusHeight}`);
        });

        await this.eventListener.start();
    }

    /** Register all RPC handlers with the router */
    registerHandlers(router: RpcRouter): void {
        const deps: IHandlerDependencies = {
            provider: this.provider,
            contracts: this.contracts,
            txSender: this.txSender,
            cache: this.cache,
            config: this.config,
        };

        const handlers = createHandlers(deps);
        router.register(...handlers);
    }

    /** Shut down the bridge service */
    async shutdown(): Promise<void> {
        await this.eventListener.stop();
        await this.provider.disconnect();
    }

    /** Check if the WebSocket connection is healthy */
    async isHealthy(): Promise<boolean> {
        return this.provider.isOnline();
    }
}
