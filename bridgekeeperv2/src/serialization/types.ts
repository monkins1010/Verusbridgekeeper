/**
 * Serialization type definitions for bridge-specific data structures.
 * Verus primitive types (ReserveTransfer, TransferDestination, etc.)
 * come from verus-typescript-primitives.
 */

/** Serialized notarization data */
export interface INotarization {
    version: number;
    flags: number;
    proposer: unknown; // TransferDestination from primitives
    currencyId: string;
    currencyState: ICurrencyState;
    notarizationHeight: number;
    prevHeight: number;
    hashPrevCrossNotarization: string;
    prevNotarizationTxid: string;
    prevNotarizationOut: number;
    nodes: INetworkNode[];
    proofRoots: Record<string, IProofRoot>;
}

/** Currency state within a notarization */
export interface ICurrencyState {
    flags: number;
    version: number;
    currencyId: string;
    currencies: string[];
    weights: bigint[];
    reserves: bigint[];
    initialSupply: bigint;
    emitted: bigint;
    supply: bigint;
    primaryCurrencyOut: bigint;
    preConvertedOut: bigint;
    primaryCurrencyFees: bigint;
    primaryCurrencyConversionFees: bigint;
    conversionPrice: bigint[];
    viaConversionPrice: bigint[];
    priorWeights: bigint[];
    currencyFees: bigint[];
    currencyConversionFees: bigint[];
}

/** Network node info in notarization */
export interface INetworkNode {
    networkAddress: string;
    nodeIdentity: string;
}

/** Proof root (bridge-specific, includes gas price) */
export interface IProofRoot {
    version: number;
    type: number;
    systemId: string;
    height: number;
    stateRoot: string;
    blockHash: string;
    compactPower: string;
    gasPrice: bigint;
}
