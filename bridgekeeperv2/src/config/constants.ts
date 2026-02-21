/**
 * Bridge-specific constants.
 *
 * Address versions, VDXF keys, destination types, and other Verus primitives
 * constants are imported from verus-typescript-primitives — only bridge-specific
 * constants (chain IDs, fork heights, gas limits, contract types) live here.
 */

import { Ticker } from '../types/common';

/** Per-network chain IDs and addresses */
export const CHAIN_CONFIG = Object.freeze({
    VDXFDATAKEY: {
        VRSCTEST: 'bb29b6fbac51550f7bda924d73c8e0bc971fb1dc',
        VRSC: 'bb29b6fbac51550f7bda924d73c8e0bc971fb1dc',
    },
    VETH_CURRENCY_ID: {
        VRSCTEST: 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm',
        VRSC: 'i9nwxtKuVYX4MSbeULLiK2ttVi6rUEhh4X',
    },
    HEX_CURRENCIES: {
        VRSCTEST: '0xA6ef9ea235635E328124Ff3429dB9F9E91b64e2d',
        VRSC: '0x1Af5b8015C64d39Ab44C60EAd8317f9F5a9B6C4C',
    },
    BRIDGE_CURRENCY_HEX: {
        VRSCTEST: '0xffEce948b8A38bBcC813411D2597f7f8485a0689',
        VRSC: '0x0200ebbd26467b866120d84a0d37c82cde0acaeb',
    },
    VERUS_SYSTEM_ID: {
        VRSCTEST: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
        VRSC: 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV',
    },
    BRIDGE_ID: {
        VRSCTEST: 'iSojYsotVzXz4wh2eJriASGo6UidJDDhL2',
        VRSC: 'i3f7tSctFkiPpiedY8QR5Tep9p4qDVebDx',
    },
    VETH_ID_HEX: {
        VRSCTEST: '0x67460C2f56774eD27EeB8685f29f6CEC0B090B00',
        VRSC: '0x454cb83913d688795e237837d30258d11ea7c752',
    },
    VETH_ID_HEX_REVERSED: {
        VRSCTEST: '000b090bec6c9ff28586eb7ed24e77562f0c4667',
        VRSC: '52c7a71ed15802d33778235e7988d61339b84c45',
    },
} as const);

/** Application version */
export const VERSION = '2.0.0';

/** Empty Ethereum address */
export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

// --- Notarization flags ---
export const FLAG_DEFINITION_NOTARIZATION = 1;
export const FLAG_PRE_LAUNCH = 2;
export const FLAG_START_NOTARIZATION = 4;
export const FLAG_LAUNCH_CONFIRMED = 8;
export const FLAG_REFUNDING = 0x10;
export const FLAG_ACCEPTED_MIRROR = 0x20;
export const FLAG_BLOCKONE_NOTARIZATION = 0x40;
export const FLAG_SAME_CHAIN = 0x80;
export const FLAG_LAUNCH_COMPLETE = 0x100;
export const FLAG_CONTRACT_UPGRADE = 512;

// --- Currency state flags ---
export const FLAG_FRACTIONAL = 1;
export const FLAG_IMPORT_TO_SOURCE = 512;

// --- Notarization defaults ---
export const VERSION_NOTARIZATIONDATA_CURRENT = 1;
export const ETH_NOTARIZATION_DEFAULT_VERSION = 1;
export const ETH_NOTARIZATION_DEFAULT_TYPE = 2;

// --- Contract sub-contract type enum ---
export enum ContractType {
    TokenManager = 0,
    VerusSerializer = 1,
    VerusProof = 2,
    VerusCrossChainExport = 3,
    VerusNotarizer = 4,
    CreateExport = 5,
    VerusNotaryTools = 6,
    ExportManager = 7,
    SubmitImports = 8,
    NotarizationSerializer = 9,
    UpgradeManager = 10,
    LastIndex = 11,
}

// --- Gas limits ---
export const NOTARIZATION_MAX_GAS = 1_500_000;
export const SUBMIT_IMPORT_MAX_GAS = 5_000_000;

// --- Timing ---
export const GLOBAL_TIME_DELTA = 60_000; // 60s cache refresh interval

// --- Proof type ---
export const TRANSFER_TYPE_ETH = 3;

// --- Last Import From data positions ---
export const LIF = Object.freeze({
    HASHPOS: 0,
    TXIDPOS: 64,
    NPOS: 136,
    NPOS_VRSCTEST: 200,
    BYTES32SIZE: 64,
    HEX: 16,
    FLAGS: 68,
    VERSION: 1,
    FORKLEN: 192,
    FORKLEN_VRSCTEST: 256,
});

// --- Fork heights for gas price calculation ---
export const TESTNET_ETH_GAS_REDUCTION_HEIGHT = 7_264_000;
export const ETH_GAS_REDUCTION_HEIGHT = 20_798_885;

export const TESTNET_ETH_GAS_REDUCTION_HEIGHT2 = 10_000_052;
export const ETH_GAS_REDUCTION_HEIGHT2 = 24_189_426;

export const TESTNET_ETH_GAS_REDUCTION_HEIGHT3 = 10_180_885;
export const ETH_GAS_REDUCTION_HEIGHT3 = 24_371_856;

// --- Contract start heights ---
export const TESTNET_ETH_CONTRACT_START_HEIGHT = 6_200_348;
export const ETH_CONTRACT_START_HEIGHT = 18_272_986;

/** Helper to get chain config values for a given ticker */
export function getChainConfig(ticker: Ticker) {
    return {
        vethCurrencyId: CHAIN_CONFIG.VETH_CURRENCY_ID[ticker],
        verusSystemId: CHAIN_CONFIG.VERUS_SYSTEM_ID[ticker],
        bridgeId: CHAIN_CONFIG.BRIDGE_ID[ticker],
        hexCurrencies: CHAIN_CONFIG.HEX_CURRENCIES[ticker],
        bridgeCurrencyHex: CHAIN_CONFIG.BRIDGE_CURRENCY_HEX[ticker],
        vethIdHex: CHAIN_CONFIG.VETH_ID_HEX[ticker],
        vethIdHexReversed: CHAIN_CONFIG.VETH_ID_HEX_REVERSED[ticker],
        vdxfDataKey: CHAIN_CONFIG.VDXFDATAKEY[ticker],
    };
}
