/**
 * TransactionSender — gas estimation, nonce management, transaction submission.
 * Uses ethers' built-in tx.wait(confirms, timeout) for confirmation timeouts.
 * Replaces the scattered tx logic in ethInteractor.js.
 */

import { ethers } from 'ethers';
import { EthereumProvider } from './EthereumProvider';
import { ITransactionResult } from './types';

export class TransactionSender {
    private provider: EthereumProvider;

    constructor(provider: EthereumProvider) {
        this.provider = provider;
    }

    /**
     * Send a contract transaction with gas estimation and receipt waiting.
     * Uses ethers' native tx.wait(confirms, timeout) to avoid indefinite hangs
     * when waiting for confirmation.
     */
    async sendContractTransaction(
        contract: ethers.Contract,
        method: string,
        args: unknown[],
        overrides?: ethers.Overrides,
    ): Promise<ITransactionResult> {
        // Estimate gas
        const gasEstimate = await contract[method].estimateGas(...args);
        const gasLimit = gasEstimate * 120n / 100n; // 20% buffer

        const tx = await contract[method](...args, {
            gasLimit,
            ...overrides,
        });

        // Use ethers' built-in timeout on tx.wait()
        const timeoutMs = this.provider.txConfirmTimeoutMs;
        const receipt = await tx.wait(1, timeoutMs);

        return {
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            status: receipt.status,
        };
    }

    /** Send raw ETH to an address */
    async sendEth(to: string, valueWei: bigint): Promise<ITransactionResult> {
        const wallet = this.provider.getWallet();

        const tx = await wallet.sendTransaction({
            to,
            value: valueWei,
        });

        const timeoutMs = this.provider.txConfirmTimeoutMs;
        const receipt = await tx.wait(1, timeoutMs);

        return {
            hash: receipt!.hash,
            blockNumber: receipt!.blockNumber,
            gasUsed: receipt!.gasUsed,
            status: receipt!.status ?? 0,
        };
    }

    /** Get current gas price */
    async getGasPrice(): Promise<bigint> {
        const feeData = await this.provider.getProvider().getFeeData();
        return feeData.gasPrice ?? 0n;
    }

    /** Get the wallet's ETH balance */
    async getBalance(): Promise<bigint> {
        const wallet = this.provider.getWallet();
        return this.provider.getProvider().getBalance(wallet.address);
    }

    /** Get the wallet's current nonce */
    async getNonce(): Promise<number> {
        const wallet = this.provider.getWallet();
        return this.provider.getProvider().getTransactionCount(wallet.address);
    }
}
