/**
 * Ethereum-specific type definitions for bridge operations.
 * Verus types (TransferDestination, CurrencyValueMap, ReserveTransfer, etc.)
 * are imported from verus-typescript-primitives — only bridge-specific types live here.
 */

/** Ethereum proof root data */
export interface IEthProofRoot {
    version: number;
    type: number;
    systemId: string;
    height: number;
    stateRoot: string;
    blockHash: string;
    compactPower: string;
    gasPrice: bigint;
}

/** Ethereum storage proof from eth_getProof */
export interface IEthStorageProof {
    key: string;
    value: string;
    proof: string[];
}

/** Full Ethereum proof from eth_getProof */
export interface IEthProof {
    address: string;
    accountProof: string[];
    balance: string;
    codeHash: string;
    nonce: number;
    storageHash: string;
    storageProof: IEthStorageProof[];
}

/** Block data returned from Ethereum provider */
export interface IBlockData {
    number: number;
    hash: string;
    timestamp: number;
    baseFeePerGas?: bigint;
    stateRoot: string;
    gasUsed: bigint;
    gasLimit: bigint;
}

/** Transaction receipt */
export interface ITransactionReceipt {
    transactionHash: string;
    blockNumber: number;
    status: number;
    gasUsed: bigint;
}
