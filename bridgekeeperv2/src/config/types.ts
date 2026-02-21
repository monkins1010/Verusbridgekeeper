/**
 * Configuration type definitions.
 */

import { Ticker } from '../types/common';

/** Parsed veth.conf file contents */
export interface IConfFile {
    rpcuser: string;
    rpcpassword: string;
    rpcport: string;
    rpchost: string;
    rpcallowip: string;
    ethnode: string;
    delegatorcontractaddress: string;
    privatekey: string;
    nowitnesssubmissions?: string;
}

/** Network-specific chain configuration */
export interface IChainConfig {
    vethCurrencyId: string;
    verusSystemId: string;
    bridgeId: string;
    hexCurrencies: string;
    bridgeCurrencyHex: string;
    vethIdHex: string;
    vethIdHexReversed: string;
}

/** OS-specific path configuration */
export interface IOSPaths {
    darwin: string;
    linux: string;
    win32: string;
}
