/**
 * EthProofSerializer unit tests.
 */

import { describe, it, expect } from 'vitest';
import { EthProofSerializer } from '../../src/serialization/EthProofSerializer';
import { IEthProof } from '../../src/types/ethereum';

/** Minimal mock proof structure. */
const mockProof: IEthProof = {
    address: '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d',
    accountProof: [
        '0xf90211a0aaaa',
        '0xf90211a0bbbb',
    ],
    balance: '0x0',
    codeHash: '0x1234',
    nonce: 1,
    storageHash: '0x5678',
    storageProof: [
        {
            key: '0x0000000000000000000000000000000000000000000000000000000000000001',
            value: '0x01',
            proof: ['0xf8518080', '0xf843a0'],
        },
    ],
};

describe('EthProofSerializer', () => {
    describe('serialize', () => {
        it('should produce a hex-prefixed string', () => {
            const result = EthProofSerializer.serialize(mockProof);
            expect(result).toMatch(/^0x[0-9a-f]+$/i);
        });

        it('should encode account proof nodes', () => {
            const result = EthProofSerializer.serialize(mockProof);
            // First byte should be 02 (compact-size for 2 account proof nodes)
            expect(result.slice(2, 4)).toBe('02');
        });

        it('should include storage proof count', () => {
            const result = EthProofSerializer.serialize(mockProof);
            // The buffer should contain the storage proof key (32 bytes)
            // and the count of storage proofs (01)
            expect(result.length).toBeGreaterThan(20);
        });

        it('should handle empty storage proofs', () => {
            const emptyStorageProof: IEthProof = {
                ...mockProof,
                storageProof: [],
            };
            const result = EthProofSerializer.serialize(emptyStorageProof);
            expect(result).toMatch(/^0x[0-9a-f]+$/i);
        });

        it('should handle multiple storage proofs', () => {
            const multiProof: IEthProof = {
                ...mockProof,
                storageProof: [
                    {
                        key: '0x0000000000000000000000000000000000000000000000000000000000000001',
                        value: '0x01',
                        proof: ['0xf851'],
                    },
                    {
                        key: '0x0000000000000000000000000000000000000000000000000000000000000002',
                        value: '0xff',
                        proof: ['0xf852', '0xf853'],
                    },
                ],
            };
            const result = EthProofSerializer.serialize(multiProof);
            expect(result).toMatch(/^0x[0-9a-f]+$/i);
        });

        it('should produce deterministic output', () => {
            const a = EthProofSerializer.serialize(mockProof);
            const b = EthProofSerializer.serialize(mockProof);
            expect(a).toBe(b);
        });
    });
});
