/**
 * NotarizationCodec unit tests.
 *
 * Uses the golden test pair from the old notarizationSerializer.js:
 * `check2` (input notarization object) → `check3` (expected serialized hex).
 */

import { describe, it, expect } from 'vitest';
import { NotarizationCodec } from '../../src/serialization/NotarizationCodec';

/**
 * `check2` — notarization object from notarizationSerializer.js lines 539–693.
 * Contains: launch currencies, fractional bridge currency state, two proof roots
 * (ETH type 2 + Verus type 1), empty nodes list.
 */
const check2: Record<string, unknown> = {
    version: 1,
    launchcleared: true,
    launchconfirmed: true,
    launchcomplete: true,
    proposer: {
        type: 4,
        address: 'iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB',
    },
    currencyid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
    notarizationheight: 7808047,
    currencystate: {
        flags: 48,
        version: 1,
        currencyid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
        launchcurrencies: [
            {
                currencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                weight: 0.0,
                reserves: 0.0001,
                priceinreserve: 0.0001,
            },
        ],
        initialsupply: 0.0,
        emitted: 0.0,
        supply: 0.0,
        currencies: {
            iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
                reservein: 0.0,
                primarycurrencyin: 0.0,
                reserveout: 0.0,
                lastconversionprice: 0.0,
                viaconversionprice: 0.0,
                fees: 0.0,
                conversionfees: 0.0,
                priorweights: 0.0,
            },
        },
        primarycurrencyfees: 0.0,
        primarycurrencyconversionfees: 0.0,
        primarycurrencyout: 0.0,
        preconvertedout: 0.0,
    },
    prevnotarizationtxid:
        '7de670c91caca95fe2a3d0c6eeae27e4a2b49db73d04d881253b8433371e4037',
    prevnotarizationout: 1,
    prevheight: 7808031,
    hashprevcrossnotarization:
        '0000000000000000000000000000000000000000000000000000000000000000',
    currencystates: [
        {
            iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
                flags: 16,
                version: 1,
                currencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                launchcurrencies: [],
                initialsupply: 0.0,
                emitted: 0.0,
                supply: 0.0,
                primarycurrencyfees: 0.0,
                primarycurrencyconversionfees: 0.0,
                primarycurrencyout: 0.0,
                preconvertedout: 0.0,
            },
        },
        {
            iSojYsotVzXz4wh2eJriASGo6UidJDDhL2: {
                flags: 3,
                version: 1,
                currencyid: 'iSojYsotVzXz4wh2eJriASGo6UidJDDhL2',
                reservecurrencies: [
                    {
                        currencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                        weight: 0.33333334,
                        reserves: 0.0,
                        priceinreserve: 0.00000299,
                    },
                    {
                        currencyid: 'iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD',
                        weight: 0.33333333,
                        reserves: 0.0,
                        priceinreserve: 0.000003,
                    },
                    {
                        currencyid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
                        weight: 0.33333333,
                        reserves: 0.0,
                        priceinreserve: 0.000003,
                    },
                ],
                initialsupply: 1000000.0,
                emitted: 0.0,
                supply: 1000000.0,
                currencies: {
                    iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
                        reservein: 0.0,
                        primarycurrencyin: 0.0,
                        reserveout: 0.0,
                        lastconversionprice: 0.00000299,
                        viaconversionprice: 0.0,
                        fees: 0.0,
                        conversionfees: 0.0,
                        priorweights: 0.0,
                    },
                    iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD: {
                        reservein: 0.0,
                        primarycurrencyin: 0.0,
                        reserveout: 0.0,
                        lastconversionprice: 0.000003,
                        viaconversionprice: 0.0,
                        fees: 0.0,
                        conversionfees: 0.0,
                        priorweights: 0.0,
                    },
                    iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm: {
                        reservein: 0.0,
                        primarycurrencyin: 0.0,
                        reserveout: 0.0,
                        lastconversionprice: 0.000003,
                        viaconversionprice: 0.0,
                        fees: 0.0,
                        conversionfees: 0.0,
                        priorweights: 0.0,
                    },
                },
                primarycurrencyfees: 0.0,
                primarycurrencyconversionfees: 0.0,
                primarycurrencyout: 0.0,
                preconvertedout: 0.0,
            },
        },
    ],
    proofroots: [
        {
            version: 1,
            type: 2,
            systemid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
            height: 7808047,
            stateroot:
                '96be998ace7773889f648c1ea5a54429b443286f916517ff3977d22781af8107',
            blockhash:
                'b3b2b2a2604dbe42cb8cb7dcabd7483afec391c51be114b0bb8efff8b7b25a8e',
            power: '0000000000000000000000000000000000000000000000000000000000a4a470',
            gasprice: 0,
        },
        {
            version: 1,
            type: 1,
            systemid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
            height: 310,
            stateroot:
                '2fbd5be03b09b9095306ba5d01029e5fc748b590517af1417f897fa5400b65f1',
            blockhash:
                'fbf80ddc6ac20a2755393fa4be0d7218275afea0bcba944d75333353ab7ca99c',
            power: '00000000000000000146fde3db3e8b63000000000000000000000001ce72bcf5',
        },
    ],
    nodes: [],
};

/**
 * `check3` — expected hex output of `serializeNotarization(check2)`,
 * from notarizationSerializer.js line 850.
 */
const check3 =
    '0x01810c0414b26820ee0c9b1276aac834cf457026a575dfce8467460c2f56774ed27eeb8685f29f6cec0b090b000100300067460c2f56774ed27eeb8685f29f6cec0b090b0001a6ef9ea235635e328124ff3429db9f9e91b64e2d0100000000011027000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000001000000000000000001000000000000000001000000000000000001000000000000000001000000000000000001000000000100000000000000002f24770037401e3733843b2581d8043db79db4a2e427aeeec6d0a3e25fa9ac1cc970e67d0100000000000000000000000000000000000000000000000000000000000000000000001f24770002a6ef9ea235635e328124ff3429db9f9e91b64e2d01001000a6ef9ea235635e328124ff3429db9f9e91b64e2d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffece948b8a38bbcc813411d2597f7f8485a068901000300ffece948b8a38bbcc813411d2597f7f8485a068903a6ef9ea235635e328124ff3429db9f9e91b64e2df0a1263056c30e221f0f851c36b767fff2544f7f67460c2f56774ed27eeb8685f29f6cec0b090b000356a0fc0155a0fc0155a0fc010300000000000000000000000000000000000000000000000095ddb082e7ff000095ddb082e7ff000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000032b010000000000002c010000000000002c01000000000000030000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000003000000000000000000000000030000000000000000000000000000000000000000000000000267460c2f56774ed27eeb8685f29f6cec0b090b000100020067460c2f56774ed27eeb8685f29f6cec0b090b002f2477000781af8127d27739ff1765916f2843b42944a5a51e8c649f887377ce8a99be968e5ab2b7f8ff8ebbb014e11bc591c3fe3a48d7abdcb78ccb42be4d60a2b2b2b370a4a400000000000000000000000000000000000000000000000000000000000000000000000000a6ef9ea235635e328124ff3429db9f9e91b64e2d01000100a6ef9ea235635e328124ff3429db9f9e91b64e2d36010000f1650b40a57f897f41f17a5190b548c75f9e02015dba065309b9093be05bbd2f9ca97cab533333754d94babca0fe5a2718720dbea43f3955270ac26adc0df8fbf5bc72ce010000000000000000000000638b3edbe3fd4601000000000000000000';

describe('NotarizationCodec', () => {
    describe('serialize', () => {
        it('should produce the golden hex output for check2', () => {
            const result = NotarizationCodec.serialize(check2);
            expect(result).toBe(check3);
        });

        it('should handle notarization with string-typed numeric values', () => {
            // check4 uses strings for numeric values — serialize should still work
            const check4: Record<string, unknown> = {
                version: '1',
                launchcleared: true,
                launchconfirmed: true,
                launchcomplete: true,
                proposer: {
                    type: 4,
                    address: 'iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB',
                },
                currencyid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
                notarizationheight: 7808047,
                currencystate: {
                    flags: 48,
                    version: 1,
                    currencyid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
                    launchcurrencies: [
                        {
                            currencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                            weight: '0.00000000',
                            reserves: '0.00010000',
                        },
                    ],
                    initialsupply: '0.00000000',
                    emitted: '0.00000000',
                    supply: '0.00000000',
                    currencies: {
                        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
                            reservein: '0.00000000',
                            primarycurrencyin: '0.00000000',
                            reserveout: '0.00000000',
                            lastconversionprice: '0.00000000',
                            viaconversionprice: '0.00000000',
                            fees: '0.00000000',
                            priorweights: '0.00000000',
                            conversionfees: '0.00000000',
                        },
                    },
                    primarycurrencyfees: '0.00000000',
                    primarycurrencyconversionfees: '0.00000000',
                    primarycurrencyout: '0.00000000',
                    preconvertedout: '0.00000000',
                },
                prevnotarizationtxid:
                    '7de670c91caca95fe2a3d0c6eeae27e4a2b49db73d04d881253b8433371e4037',
                prevnotarizationout: 1,
                prevheight: 7808031,
                hashprevcrossnotarization:
                    '0000000000000000000000000000000000000000000000000000000000000000',
                currencystates: [
                    {
                        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
                            flags: 16,
                            version: 1,
                            currencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                            launchcurrencies: [],
                            initialsupply: '0.00000000',
                            emitted: '0.00000000',
                            supply: '0.00000000',
                            primarycurrencyfees: '0.00000000',
                            primarycurrencyconversionfees: '0.00000000',
                            primarycurrencyout: '0.00000000',
                            preconvertedout: '0.00000000',
                        },
                    },
                    {
                        iSojYsotVzXz4wh2eJriASGo6UidJDDhL2: {
                            flags: 3,
                            version: 1,
                            currencyid: 'iSojYsotVzXz4wh2eJriASGo6UidJDDhL2',
                            reservecurrencies: [
                                {
                                    currencyid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                                    weight: '0.33333334',
                                    reserves: '0.00000000',
                                },
                                {
                                    currencyid: 'iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD',
                                    weight: '0.33333333',
                                    reserves: '0.00000000',
                                },
                                {
                                    currencyid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
                                    weight: '0.33333333',
                                    reserves: '0.00000000',
                                },
                            ],
                            initialsupply: '1000000.00000000',
                            emitted: '0.00000000',
                            supply: '1000000.00000000',
                            currencies: {
                                iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: {
                                    reservein: '0.00000000',
                                    primarycurrencyin: '0.00000000',
                                    reserveout: '0.00000000',
                                    lastconversionprice: '0.00000299',
                                    viaconversionprice: '0.00000000',
                                    fees: '0.00000000',
                                    priorweights: '0.00000000',
                                    conversionfees: '0.00000000',
                                },
                                iRQrexTecXdkiPM6Q5KHxGDmpDaGFS2wRD: {
                                    reservein: '0.00000000',
                                    primarycurrencyin: '0.00000000',
                                    reserveout: '0.00000000',
                                    lastconversionprice: '0.00000300',
                                    viaconversionprice: '0.00000000',
                                    fees: '0.00000000',
                                    priorweights: '0.00000000',
                                    conversionfees: '0.00000000',
                                },
                                iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm: {
                                    reservein: '0.00000000',
                                    primarycurrencyin: '0.00000000',
                                    reserveout: '0.00000000',
                                    lastconversionprice: '0.00000300',
                                    viaconversionprice: '0.00000000',
                                    fees: '0.00000000',
                                    priorweights: '0.00000000',
                                    conversionfees: '0.00000000',
                                },
                            },
                            primarycurrencyfees: '0.00000000',
                            primarycurrencyconversionfees: '0.00000000',
                            primarycurrencyout: '0.00000000',
                            preconvertedout: '0.00000000',
                        },
                    },
                ],
                proofroots: [
                    {
                        version: 1,
                        type: 2,
                        systemid: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
                        height: 7808047,
                        stateroot:
                            '96be998ace7773889f648c1ea5a54429b443286f916517ff3977d22781af8107',
                        blockhash:
                            'b3b2b2a2604dbe42cb8cb7dcabd7483afec391c51be114b0bb8efff8b7b25a8e',
                        power: '0000000000000000000000000000000000000000000000000000000000a4a470',
                        gasprice: '0.00000000',
                    },
                    {
                        version: 1,
                        type: 1,
                        systemid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
                        height: 310,
                        stateroot:
                            '2fbd5be03b09b9095306ba5d01029e5fc748b590517af1417f897fa5400b65f1',
                        blockhash:
                            'fbf80ddc6ac20a2755393fa4be0d7218275afea0bcba944d75333353ab7ca99c',
                        power: '00000000000000000146fde3db3e8b63000000000000000000000001ce72bcf5',
                    },
                ],
                nodes: [],
            };

            // Both check2 and check4 (with same height) should produce the same output
            const result = NotarizationCodec.serialize(check4);
            expect(result).toBe(check3);
        });
    });

    describe('deserialize', () => {
        it('should roundtrip — deserialize(serialize(check2)) preserves key fields', () => {
            const hex = NotarizationCodec.serialize(check2);
            const parsed = NotarizationCodec.deserialize(hex);

            expect(parsed.version).toBe(1);
            expect(parsed.launchcleared).toBe(true);
            expect(parsed.launchconfirmed).toBe(true);
            expect(parsed.launchcomplete).toBe(true);
            expect(parsed.currencyid).toBe('iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm');
            expect(parsed.notarizationheight).toBe(7808047);
            expect(parsed.prevnotarizationtxid).toBe(
                '7de670c91caca95fe2a3d0c6eeae27e4a2b49db73d04d881253b8433371e4037',
            );
            expect(parsed.prevnotarizationout).toBe(1);
            expect(parsed.prevheight).toBe(7808031);
        });

        it('should deserialize the golden hex (check3)', () => {
            const parsed = NotarizationCodec.deserialize(check3);

            expect(parsed.version).toBe(1);
            expect(parsed.currencyid).toBe('iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm');
            expect(parsed.notarizationheight).toBe(7808047);

            // Proposer
            const proposer = parsed.proposer as { type: number; address: string };
            expect(proposer.type).toBe(4);
            expect(proposer.address).toBe('iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB');

            // Proof roots should be present
            const proofroots = parsed.proofroots as unknown[];
            expect(proofroots).toHaveLength(2);
        });
    });

    describe('serialize edge cases', () => {
        it('should handle empty nodes array', () => {
            const result = NotarizationCodec.serialize(check2);
            // The hex should end with "00" (compactsize 0 for empty nodes)
            expect(result.endsWith('00')).toBe(true);
        });
    });
});
