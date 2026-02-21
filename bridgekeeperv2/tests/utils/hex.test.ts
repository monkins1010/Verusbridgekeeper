/**
 * Hex utility tests.
 */

import { describe, it, expect } from 'vitest';
import {
    addHexPrefix,
    removeHexPrefix,
    reverseHex,
    padHex,
    numberToHex,
    hexToNumber,
} from '../../src/utils/hex';

describe('hex utils', () => {
    describe('addHexPrefix', () => {
        it('should add 0x to unprefixed hex', () => {
            expect(addHexPrefix('abcdef')).toBe('0xabcdef');
        });

        it('should not double-prefix', () => {
            expect(addHexPrefix('0xabcdef')).toBe('0xabcdef');
        });
    });

    describe('removeHexPrefix', () => {
        it('should remove 0x prefix', () => {
            expect(removeHexPrefix('0xabcdef')).toBe('abcdef');
        });

        it('should handle strings without prefix', () => {
            expect(removeHexPrefix('abcdef')).toBe('abcdef');
        });
    });

    describe('reverseHex', () => {
        it('should reverse bytes', () => {
            expect(reverseHex('0102030405')).toBe('0504030201');
        });
    });

    describe('padHex', () => {
        it('should pad to byte length', () => {
            expect(padHex('ff', 4)).toBe('000000ff');
        });
    });

    describe('numberToHex / hexToNumber', () => {
        it('should roundtrip', () => {
            expect(numberToHex(255)).toBe('0xff');
            expect(hexToNumber('0xff')).toBe(255);
        });
    });
});
