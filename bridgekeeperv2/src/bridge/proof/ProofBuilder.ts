/**
 * ProofBuilder — builds ETH storage proofs for cross-chain verification.
 */

import { EthereumProvider } from '../../ethereum/EthereumProvider';
import { IEthProof } from '../../types/ethereum';
import { IProofBuildParams } from './types';

export class ProofBuilder {
    private provider: EthereumProvider;

    constructor(provider: EthereumProvider) {
        this.provider = provider;
    }

    /** Build an eth_getProof response for the given contract and storage keys */
    async buildStorageProof(params: IProofBuildParams): Promise<IEthProof> {
        const ethProvider = this.provider.getProvider();

        const proof = await ethProvider.send('eth_getProof', [
            params.contractAddress,
            params.storageKeys,
            '0x' + params.blockNumber.toString(16),
        ]);

        return proof as IEthProof;
    }

    /** Build a block header proof */
    async buildBlockProof(blockNumber: number): Promise<unknown> {
        // TODO: Implement block header proof serialization
        throw new Error('buildBlockProof not yet implemented');
    }
}
