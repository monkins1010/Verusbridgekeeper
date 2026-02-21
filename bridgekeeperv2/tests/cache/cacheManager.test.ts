/**
 * CacheManager unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../../src/cache/CacheManager';

describe('CacheManager', () => {
    let cache: CacheManager;

    beforeEach(() => {
        cache = new CacheManager({ apiTtlMs: 1000 });
    });

    it('should store and retrieve values', () => {
        cache.set('test', 'key1', { data: 'hello' });
        const result = cache.get<{ data: string }>('test', 'key1');
        expect(result).toEqual({ data: 'hello' });
    });

    it('should return null for missing keys', () => {
        const result = cache.get('test', 'nonexistent');
        expect(result).toBeNull();
    });

    it('should expire entries after TTL', async () => {
        cache.set('test', 'key1', 'value', 50); // 50ms TTL
        expect(cache.get('test', 'key1')).toBe('value');

        await new Promise((resolve) => setTimeout(resolve, 60));
        expect(cache.get('test', 'key1')).toBeNull();
    });

    it('should clear a specific store', () => {
        cache.set('store1', 'k1', 'v1');
        cache.set('store2', 'k2', 'v2');

        cache.clearStore('store1');

        expect(cache.get('store1', 'k1')).toBeNull();
        expect(cache.get('store2', 'k2')).toBe('v2');
    });

    it('should clear all stores', () => {
        cache.set('store1', 'k1', 'v1');
        cache.set('store2', 'k2', 'v2');

        cache.clear();

        expect(cache.get('store1', 'k1')).toBeNull();
        expect(cache.get('store2', 'k2')).toBeNull();
        expect(cache.size).toBe(0);
    });

    it('should track total size', () => {
        cache.set('s1', 'k1', 'v1');
        cache.set('s1', 'k2', 'v2');
        cache.set('s2', 'k1', 'v3');

        expect(cache.size).toBe(3);
    });

    it('should use typed sub-cache accessors', () => {
        cache.api.set('getinfo', { version: '2.0' });
        expect(cache.api.get('getinfo')).toEqual({ version: '2.0' });

        cache.api.clear();
        expect(cache.api.get('getinfo')).toBeNull();
    });

    it('should prune expired entries', async () => {
        cache.set('test', 'k1', 'v1', 50);
        cache.set('test', 'k2', 'v2', 5000);

        await new Promise((resolve) => setTimeout(resolve, 60));
        cache.prune();

        expect(cache.get('test', 'k1')).toBeNull();
        expect(cache.get('test', 'k2')).toBe('v2');
    });
});
