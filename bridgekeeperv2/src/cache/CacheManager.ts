/**
 * CacheManager — generic typed cache with TTL support.
 * Replaces react-native-cache from the original project.
 */

import { ICacheConfig, ICacheEntry } from './types';

const DEFAULT_TTL_MS = 60_000; // 60 seconds

export class CacheManager {
    private stores: Map<string, Map<string, ICacheEntry<unknown>>> = new Map();
    private config: ICacheConfig;

    constructor(config: ICacheConfig = {}) {
        this.config = config;
    }

    /** Get a value from a named store */
    get<T>(store: string, key: string): T | null {
        const storeMap = this.stores.get(store);
        if (!storeMap) return null;

        const entry = storeMap.get(key);
        if (!entry) return null;

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            storeMap.delete(key);
            return null;
        }

        return entry.value as T;
    }

    /** Set a value in a named store with TTL */
    set<T>(store: string, key: string, value: T, ttlMs?: number): void {
        let storeMap = this.stores.get(store);
        if (!storeMap) {
            storeMap = new Map();
            this.stores.set(store, storeMap);
        }

        storeMap.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? DEFAULT_TTL_MS),
        });
    }

    /** Delete a specific key from a store */
    delete(store: string, key: string): boolean {
        const storeMap = this.stores.get(store);
        if (!storeMap) return false;
        return storeMap.delete(key);
    }

    /** Clear a specific store */
    clearStore(store: string): void {
        this.stores.delete(store);
    }

    /** Clear all caches */
    clear(): void {
        this.stores.clear();
    }

    /** Remove all expired entries from all stores */
    prune(): void {
        const now = Date.now();
        for (const [storeName, storeMap] of this.stores) {
            for (const [key, entry] of storeMap) {
                if (now > entry.expiresAt) {
                    storeMap.delete(key);
                }
            }
            if (storeMap.size === 0) {
                this.stores.delete(storeName);
            }
        }
    }

    /** Get the number of entries across all stores */
    get size(): number {
        let total = 0;
        for (const storeMap of this.stores.values()) {
            total += storeMap.size;
        }
        return total;
    }

    // --- Convenience accessors for typed sub-caches ---

    /** API response cache */
    readonly api = {
        get: <T>(key: string): T | null => this.get<T>('api', key),
        set: <T>(key: string, value: T, ttlMs?: number): void =>
            this.set('api', key, value, ttlMs ?? this.config.apiTtlMs),
        clear: (): void => this.clearStore('api'),
    };

    /** Block data cache */
    readonly block = {
        get: <T>(key: string): T | null => this.get<T>('block', key),
        set: <T>(key: string, value: T, ttlMs?: number): void =>
            this.set('block', key, value, ttlMs ?? this.config.blockTtlMs),
        clear: (): void => this.clearStore('block'),
    };

    /** Import data cache */
    readonly import = {
        get: <T>(key: string): T | null => this.get<T>('import', key),
        set: <T>(key: string, value: T, ttlMs?: number): void =>
            this.set('import', key, value, ttlMs ?? this.config.importTtlMs),
        clear: (): void => this.clearStore('import'),
    };
}
