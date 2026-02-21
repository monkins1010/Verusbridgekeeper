/**
 * CrossChainExportCodec unit tests.
 *
 * Verifies serialize/deserialize roundtrip for cross-chain export data structures.
 */

import { describe, it, expect } from 'vitest';
import {
    CrossChainExportCodec,
    ICrossChainExport,
} from '../../src/serialization/CrossChainExportCodec';

/** Minimal valid export for serialization tests. */
const sampleExport: ICrossChainExport = {
    version: 1,
    flags: 2,
    sourcesystemid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
    hashtransfers:
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    destinationsystemid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
    destinationcurrencyid: 'iSojYsotVzXz4wh2eJriASGo6UidJDDhL2',
    sourceheightstart: 100,
    sourceheightend: 200,
    numinputs: 3,
    totalamounts: [
        { currency: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq', amount: '10.00000000' },
    ],
    totalfees: [
        { currency: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq', amount: '0.01000000' },
    ],
    totalburned: [],
    rewardaddress: { type: 0, address: '' },
    firstinput: 0,
};

describe('CrossChainExportCodec', () => {
    describe('serialize', () => {
        it('should produce a hex string', () => {
            const hex = CrossChainExportCodec.serialize(sampleExport);
            expect(hex).toMatch(/^0x[0-9a-f]+$/i);
        });

        it('should contain the correct version bytes', () => {
            const hex = CrossChainExportCodec.serialize(sampleExport);
            // First 2 bytes (4 hex chars) should be version 1 in little-endian: 0100
            expect(hex.slice(2, 6)).toBe('0100');
        });

        it('should contain the correct flags bytes', () => {
            const hex = CrossChainExportCodec.serialize(sampleExport);
            // Next 2 bytes should be flags 2 in little-endian: 0200
            expect(hex.slice(6, 10)).toBe('0200');
        });
    });

    describe('deserialize', () => {
        it('should roundtrip key fields', () => {
            const hex = CrossChainExportCodec.serialize(sampleExport);
            const parsed = CrossChainExportCodec.deserialize(hex);

            expect(parsed.version).toBe(1);
            expect(parsed.flags).toBe(2);
            expect(parsed.sourcesystemid).toBe('iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm');
            expect(parsed.destinationsystemid).toBe('iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq');
            expect(parsed.destinationcurrencyid).toBe('iSojYsotVzXz4wh2eJriASGo6UidJDDhL2');
            expect(parsed.sourceheightstart).toBe(100);
            expect(parsed.sourceheightend).toBe(200);
            expect(parsed.numinputs).toBe(3);
        });

        it('should preserve hashtransfers', () => {
            const hex = CrossChainExportCodec.serialize(sampleExport);
            const parsed = CrossChainExportCodec.deserialize(hex);
            expect(parsed.hashtransfers).toBe(sampleExport.hashtransfers);
        });
    });

    describe('edge cases', () => {
        it('should handle zero amounts', () => {
            const zeroExport: ICrossChainExport = {
                ...sampleExport,
                totalamounts: [],
                totalfees: [],
                totalburned: [],
                numinputs: 0,
            };

            const hex = CrossChainExportCodec.serialize(zeroExport);
            const parsed = CrossChainExportCodec.deserialize(hex);
            expect(parsed.numinputs).toBe(0);
        });

        it('should handle multiple currency amounts', () => {
            const multiExport: ICrossChainExport = {
                ...sampleExport,
                totalamounts: [
                    { currency: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq', amount: '5.00000000' },
                    { currency: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm', amount: '2.50000000' },
                ],
                totalfees: [
                    { currency: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq', amount: '0.01000000' },
                    { currency: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm', amount: '0.00500000' },
                ],
            };

            const hex = CrossChainExportCodec.serialize(multiExport);
            expect(hex).toMatch(/^0x[0-9a-f]+$/i);
            // Roundtrip should preserve key fields
            const parsed = CrossChainExportCodec.deserialize(hex);
            expect(parsed.numinputs).toBe(3);
        });
    });
});
