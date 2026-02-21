/**
 * EventListener — block and notarization event subscriptions.
 * Automatically re-subscribes after provider reconnection via
 * EthereumProvider's onReconnect callback.
 * Replaces the event watching logic in ethInteractor.js.
 */

import { ethers } from 'ethers';
import { EthereumProvider } from './EthereumProvider';
import { ContractManager } from './ContractManager';
import { INotarizationEvent } from './types';

export type BlockHandler = (blockNumber: number) => void | Promise<void>;
export type NotarizationHandler = (event: INotarizationEvent) => void | Promise<void>;

export class EventListener {
    private provider: EthereumProvider;
    private contracts: ContractManager;
    private blockHandlers: BlockHandler[] = [];
    private notarizationHandlers: NotarizationHandler[] = [];
    private listening = false;

    constructor(provider: EthereumProvider, contracts: ContractManager) {
        this.provider = provider;
        this.contracts = contracts;

        // Re-subscribe after the provider reconnects
        this.provider.onReconnect(async () => {
            if (this.listening) {
                console.log('EventListener: re-subscribing after reconnect...');
                // Reset listening flag so start() will re-attach
                this.listening = false;
                await this.start();
            }
        });
    }

    /** Register a handler for new blocks */
    onBlock(handler: BlockHandler): void {
        this.blockHandlers.push(handler);
    }

    /** Register a handler for new notarization events */
    onNotarization(handler: NotarizationHandler): void {
        this.notarizationHandlers.push(handler);
    }

    /** Start listening for events */
    async start(): Promise<void> {
        if (this.listening) return;
        this.listening = true;

        const ethProvider = this.provider.getProvider();

        // Block listener
        ethProvider.on('block', async (blockNumber: number) => {
            for (const handler of this.blockHandlers) {
                try {
                    await handler(blockNumber);
                } catch (err) {
                    console.error('Block handler error:', err);
                }
            }
        });

        // Notarization event listener (if contract supports it)
        try {
            const delegator = this.contracts.getDelegator();
            delegator.on('NewNotarization', async (...args: unknown[]) => {
                const event: INotarizationEvent = {
                    verusHeight: Number(args[0]),
                    ethHeight: Number(args[1]),
                    txid: String(args[2]),
                    blockHash: String(args[3]),
                };

                for (const handler of this.notarizationHandlers) {
                    try {
                        await handler(event);
                    } catch (err) {
                        console.error('Notarization handler error:', err);
                    }
                }
            });
        } catch {
            // Contract may not have notarization events
        }
    }

    /** Stop listening for events */
    async stop(): Promise<void> {
        if (!this.listening) return;

        const ethProvider = this.provider.getProvider();
        ethProvider.removeAllListeners('block');

        try {
            const delegator = this.contracts.getDelegator();
            delegator.removeAllListeners('NewNotarization');
        } catch {
            // Ignore
        }

        this.listening = false;
    }
}
