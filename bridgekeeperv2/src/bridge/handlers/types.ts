/**
 * Bridge handler type definitions.
 */

import { IRpcHandler } from '../../server/types';

/** Result from getinfo handler */
export interface IGetInfoResult {
    version: string;
    name: string;
    blocks: number;
    tiptime: number;
    chainid: string;
    longestchain: number;
}

/** Result from getcurrency handler */
export interface IGetCurrencyResult {
    currencyid: string;
    currencyidhex: string;
    parent: string;
    name: string;
    currencystate: unknown;
    bestcurrencystate: unknown;
}

/** Result from getexports handler */
export interface IGetExportsResult {
    height: number;
    txid: string;
    txoutnum: number;
    exportinfo: ICrossChainExportInfo;
    partialtransactionproof: string;
    transfers: IOutboundTransfer[];
}

/** Cross-chain export info (JSON-ready format for Verus daemon) */
export interface ICrossChainExportInfo {
    version: number;
    flags: number;
    sourcesystemid: string;
    hashtransfers: string;
    destinationsystemid: string;
    destinationcurrencyid: string;
    sourceheightstart: number;
    sourceheightend: number;
    numinputs: number;
    totalamounts: Array<{ currency: string; amount: string }>;
    totalfees: Array<{ currency: string; amount: string }>;
    totalburned: Array<{ currency: string; amount: number }>;
    rewardaddress: string;
    firstinput: number;
}

/** Outbound transfer in Verus daemon JSON format */
export interface IOutboundTransfer {
    version: number;
    currencyvalues: Record<string, string>;
    flags: number;
    exportto?: string;
    feecurrencyid: string;
    fees: string;
    destinationcurrencyid: string;
    via?: string;
    destination: IOutboundDestination;
}

/** Transfer destination in Verus daemon JSON format */
export interface IOutboundDestination {
    type: number;
    address: string;
    gateway?: string;
    fees?: number;
    auxdests?: Array<{ type: number; address: string }>;
}

/** Raw contract export set returned from getReadyExportsByRange */
export interface IContractExportSet {
    exportHash: string;
    prevExportHash: string;
    startHeight: bigint;
    endHeight: bigint;
    transfers: IContractTransfer[];
}

/** Raw contract transfer struct from CReserveTransfer */
export interface IContractTransfer {
    version: number;
    currencyvalue: { currency: string; amount: bigint };
    flags: number;
    feecurrencyid: string;
    fees: bigint;
    destination: { destinationtype: number; destinationaddress: string };
    destcurrencyid: string;
    destsystemid: string;
    secondreserveid: string;
}

/** Result from getbestproofroot handler */
export interface IGetBestProofRootResult {
    version: number;
    laststableheight: number;
    lastconfirmedheight: number;
    bestcurrencystate: unknown;
    proofroots: unknown[];
}

/** Result from submitimports handler */
export interface ISubmitImportsResult {
    txid?: string;
    error?: boolean;
    message?: string;
}

/** Base handler dependencies (injected into all handlers) */
export interface IHandlerDependencies {
    provider: import('../../ethereum/EthereumProvider').EthereumProvider;
    contracts: import('../../ethereum/ContractManager').ContractManager;
    txSender: import('../../ethereum/TransactionSender').TransactionSender;
    cache: import('../../cache/CacheManager').CacheManager;
    config: import('../../config/ConfigManager').ConfigManager;
}
