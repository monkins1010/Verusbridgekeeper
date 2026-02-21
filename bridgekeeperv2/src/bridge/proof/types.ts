/**
 * Proof-related type definitions.
 */

import { IEthProofRoot, IEthStorageProof, IEthProof } from '../../types/ethereum';

/** Parameters for building an ETH storage proof */
export interface IProofBuildParams {
    contractAddress: string;
    storageKeys: string[];
    blockNumber: number;
}

/** Validated proof root result */
export interface IValidatedProofRoot extends IEthProofRoot {
    valid: boolean;
    validationError?: string;
}
