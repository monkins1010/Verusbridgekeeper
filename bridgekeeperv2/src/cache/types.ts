/**
 * Cache type definitions.
 */

/** Configuration for cache TTLs */
export interface ICacheConfig {
    /** TTL for API response cache in ms (default: 60000) */
    apiTtlMs?: number;
    /** TTL for block data cache in ms (default: 300000) */
    blockTtlMs?: number;
    /** TTL for import data cache in ms (default: 300000) */
    importTtlMs?: number;
}

/** A single cache entry with expiration */
export interface ICacheEntry<T> {
    value: T;
    expiresAt: number;
    blockHeight?: number;
}

/** Known API cache keys */
export enum ApiCacheKey {
    GetInfo = 'getinfo',
    GetCurrency = 'getcurrency',
    GetBestProofRoot = 'getbestproofroot',
    GetNotarizationData = 'getnotarizationdata',
    GetExports = 'getexports',
}
