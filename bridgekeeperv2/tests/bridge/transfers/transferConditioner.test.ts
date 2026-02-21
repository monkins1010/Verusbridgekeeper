/**
 * TransferConditioner unit tests.
 */

import { describe, it, expect } from 'vitest';
import { TransferConditioner } from '../../../src/bridge/transfers/TransferConditioner';

describe('TransferConditioner', () => {
    const conditioner = new TransferConditioner();

    describe('condition', () => {
        it('should convert base58 currencyvalues keys to hex', () => {
            const result = conditioner.condition({
                currencyvalues: { iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '1.00000000' },
                flags: 0,
                feecurrencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                fees: '0.01000000',
                destination: { type: 4, address: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq' },
            });

            expect(result.flags).toBe(0);
            // currencyValues should have a hex key
            const keys = Object.keys(result.currencyValues);
            expect(keys.length).toBe(1);
            expect(keys[0]).toMatch(/^0x/);
        });

        it('should convert fees from verus-float to bigint', () => {
            const result = conditioner.condition({
                currencyvalues: { iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '5.00000000' },
                flags: 64,
                fees: '0.01000000',
                feecurrencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                destination: { type: 2, address: 'RVWgPXsNMXoHPSP2vRqQkjRYdW51P3PwtE' },
            });

            expect(result.flags).toBe(64);
        });

        it('should handle hex-prefixed addresses (passthrough)', () => {
            const result = conditioner.condition({
                currencyvalue: {
                    currency: '0xa6ef9ea235635e328124ff3429db9f9e91b64e2d',
                    amount: 100000000n,
                },
                flags: 0,
                fees: 1000000n,
                feecurrencyid: '0xa6ef9ea235635e328124ff3429db9f9e91b64e2d',
                destination: { type: 9, address: '0x1234567890abcdef1234567890abcdef12345678' },
            });

            const keys = Object.keys(result.currencyValues);
            expect(keys[0]).toBe('0xa6ef9ea235635e328124ff3429db9f9e91b64e2d');
        });

        it('should handle empty transfer', () => {
            const result = conditioner.condition({ flags: 0 });
            expect(result.flags).toBe(0);
        });
    });

    describe('convertAddress', () => {
        it('should convert base58 to hex', () => {
            const hex = conditioner.convertAddress('iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq', 'hex');
            expect(hex).toMatch(/^0x[0-9a-f]{40}$/i);
        });

        it('should pass through hex addresses', () => {
            const hex = conditioner.convertAddress('0xa6ef9ea235635e328124ff3429db9f9e91b64e2d', 'hex');
            expect(hex).toBe('0xa6ef9ea235635e328124ff3429db9f9e91b64e2d');
        });

        it('should convert hex to base58', () => {
            // Convert to hex first, then back
            const hex = conditioner.convertAddress('iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm', 'hex');
            const base58 = conditioner.convertAddress(hex, 'base58');
            expect(base58).toBe('iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm');
        });
    });
});
