/**
 * API Cache Layer Sanity Tests
 *
 * Tests for cache management utilities including CRUD operations,
 * TTL validation, cache warming, and statistics.
 * @module db/cache.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from './database';
import type { ApiCacheEntry } from './schema';
import { CACHE_TTL } from './schema';
import {
  generateCacheKey,
  cacheApiData,
  getCachedApiData,
  isCacheValid,
  invalidateCache,
  invalidateDocumentCache,
  clearAllCache,
  clearExpiredCache,
  getCacheStats,
  warmCache,
  getOrCache,
  batchCacheData,
  refreshCache,
} from './cache';

// Helper to get cache entry by key
async function getCacheEntryById(key: string): Promise<ApiCacheEntry | undefined> {
  const all = await db.apiCache.toArray();
  return all.find((c) => c.key === key);
}

// Test data factory
function createTestCacheEntry(key: string, overrides: Partial<ApiCacheEntry> = {}): ApiCacheEntry {
  return {
    key,
    data: { test: 'data' },
    documentKey: 'wotc-srd',
    version: '1.0',
    cachedAt: new Date().toISOString(),
    ttl: CACHE_TTL.default,
    ...overrides,
  };
}

describe('Cache Key Generation', () => {
  it('should generate consistent cache keys', () => {
    const key1 = generateCacheKey('classes', { level: 1, source: 'phb' });
    const key2 = generateCacheKey('classes', { level: 1, source: 'phb' });
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different params', () => {
    const key1 = generateCacheKey('classes', { level: 1 });
    const key2 = generateCacheKey('classes', { level: 2 });
    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different endpoints', () => {
    const key1 = generateCacheKey('classes', {});
    const key2 = generateCacheKey('spells', {});
    expect(key1).not.toBe(key2);
  });

  it('should handle empty params', () => {
    const key = generateCacheKey('classes');
    expect(key).toContain('classes:');
  });

  it('should sort params for consistent hashing', () => {
    const key1 = generateCacheKey('spells', { a: 1, b: 2, c: 3 });
    const key2 = generateCacheKey('spells', { c: 3, a: 1, b: 2 });
    expect(key1).toBe(key2);
  });
});

describe('Cache Operations', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
    await db.apiCache.clear();
  });

  describe('cacheApiData', () => {
    it('should cache data successfully', async () => {
      const testData = { name: 'Fighter', hitDie: 'd10' };
      const key = 'classes:test';

      await cacheApiData(key, testData, 'wotc-srd', '1.0');

      const cached = await getCacheEntryById(key);
      expect(cached).toBeDefined();
      expect(cached?.data).toEqual(testData);
      expect(cached?.documentKey).toBe('wotc-srd');
      expect(cached?.version).toBe('1.0');
    });

    it('should use default TTL if not specified', async () => {
      const key = 'test:default-ttl';
      await cacheApiData(key, { test: true }, 'wotc-srd', '1.0');

      const cached = await getCacheEntryById(key);
      expect(cached?.ttl).toBe(CACHE_TTL.default);
    });

    it('should use custom TTL when provided', async () => {
      const key = 'test:custom-ttl';
      const customTtl = 5000;
      await cacheApiData(key, { test: true }, 'wotc-srd', '1.0', customTtl);

      const cached = await getCacheEntryById(key);
      expect(cached?.ttl).toBe(customTtl);
    });

    it('should overwrite existing cache entry', async () => {
      const key = 'test:overwrite';
      await cacheApiData(key, { version: 1 }, 'wotc-srd', '1.0');
      await cacheApiData(key, { version: 2 }, 'wotc-srd', '1.0');

      const cached = await getCacheEntryById(key);
      expect(cached?.data).toEqual({ version: 2 });
    });
  });

  describe('getCachedApiData', () => {
    it('should retrieve cached data', async () => {
      const testData = { name: 'Wizard' };
      const key = 'classes:wizard';
      await cacheApiData(key, testData, 'wotc-srd', '1.0');

      const retrieved = await getCachedApiData(key);
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const retrieved = await getCachedApiData('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should return null for expired cache', async () => {
      const key = 'test:expired';
      const entry = createTestCacheEntry(key, {
        cachedAt: new Date(Date.now() - 2000).toISOString(),
        ttl: 1000, // 1 second TTL, already expired
      });
      await db.apiCache.add(entry);

      const retrieved = await getCachedApiData(key);
      expect(retrieved).toBeNull();
    });

    it('should delete expired cache when accessed', async () => {
      const key = 'test:expired-delete';
      const entry = createTestCacheEntry(key, {
        cachedAt: new Date(Date.now() - 2000).toISOString(),
        ttl: 1000,
      });
      await db.apiCache.add(entry);

      await getCachedApiData(key);

      const stillExists = await getCacheEntryById(key);
      expect(stillExists).toBeUndefined();
    });

    it('should return valid cache within TTL', async () => {
      const key = 'test:valid';
      const testData = { valid: true };
      const entry = createTestCacheEntry(key, {
        data: testData,
        cachedAt: new Date(Date.now() - 500).toISOString(),
        ttl: 2000, // 2 seconds TTL, still valid
      });
      await db.apiCache.add(entry);

      const retrieved = await getCachedApiData(key);
      expect(retrieved).toEqual(testData);
    });
  });

  describe('isCacheValid', () => {
    it('should return true for valid cache', async () => {
      const key = 'test:valid-check';
      await cacheApiData(key, { test: true }, 'wotc-srd', '1.0', 10000);

      const isValid = await isCacheValid(key);
      expect(isValid).toBe(true);
    });

    it('should return false for expired cache', async () => {
      const key = 'test:expired-check';
      const entry = createTestCacheEntry(key, {
        cachedAt: new Date(Date.now() - 2000).toISOString(),
        ttl: 1000,
      });
      await db.apiCache.add(entry);

      const isValid = await isCacheValid(key);
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent cache', async () => {
      const isValid = await isCacheValid('non-existent');
      expect(isValid).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache entry', async () => {
      const key = 'test:invalidate';
      await cacheApiData(key, { test: true }, 'wotc-srd', '1.0');

      const deleted = await invalidateCache(key);
      expect(deleted).toBe(true);

      const entry = await getCacheEntryById(key);
      expect(entry).toBeUndefined();
    });

    it('should return false for non-existent key', async () => {
      const deleted = await invalidateCache('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('invalidateDocumentCache', () => {
    it('should delete all cache for a document', async () => {
      await cacheApiData('test:1', { test: 1 }, 'wotc-srd', '1.0');
      await cacheApiData('test:2', { test: 2 }, 'wotc-srd', '1.0');
      await cacheApiData('test:3', { test: 3 }, 'other-doc', '1.0');

      const deletedCount = await invalidateDocumentCache('wotc-srd');
      expect(deletedCount).toBe(2);

      const remaining = await db.apiCache.toArray();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].documentKey).toBe('other-doc');
    });

    it('should return 0 if no entries for document', async () => {
      const deletedCount = await invalidateDocumentCache('non-existent-doc');
      expect(deletedCount).toBe(0);
    });
  });

  describe('clearAllCache', () => {
    it('should delete all cache entries', async () => {
      await cacheApiData('test:1', { test: 1 }, 'wotc-srd', '1.0');
      await cacheApiData('test:2', { test: 2 }, 'other-doc', '1.0');
      await cacheApiData('test:3', { test: 3 }, 'another-doc', '1.0');

      const deletedCount = await clearAllCache();
      expect(deletedCount).toBe(3);

      const remaining = await db.apiCache.toArray();
      expect(remaining).toHaveLength(0);
    });

    it('should return 0 if cache is empty', async () => {
      const deletedCount = await clearAllCache();
      expect(deletedCount).toBe(0);
    });
  });

  describe('clearExpiredCache', () => {
    it('should delete only expired entries', async () => {
      // Valid entry
      await cacheApiData('test:valid', { valid: true }, 'wotc-srd', '1.0', 10000);

      // Expired entries
      await db.apiCache.add(
        createTestCacheEntry('test:expired1', {
          cachedAt: new Date(Date.now() - 2000).toISOString(),
          ttl: 1000,
        })
      );
      await db.apiCache.add(
        createTestCacheEntry('test:expired2', {
          cachedAt: new Date(Date.now() - 3000).toISOString(),
          ttl: 1000,
        })
      );

      const deletedCount = await clearExpiredCache();
      expect(deletedCount).toBe(2);

      const remaining = await db.apiCache.toArray();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].key).toBe('test:valid');
    });

    it('should return 0 if no expired entries', async () => {
      await cacheApiData('test:valid', { valid: true }, 'wotc-srd', '1.0', 10000);

      const deletedCount = await clearExpiredCache();
      expect(deletedCount).toBe(0);
    });
  });
});

describe('Cache Statistics', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
    await db.apiCache.clear();
  });

  it('should return correct total count', async () => {
    await cacheApiData('test:1', { test: 1 }, 'wotc-srd', '1.0');
    await cacheApiData('test:2', { test: 2 }, 'wotc-srd', '1.0');

    const stats = await getCacheStats();
    expect(stats.total).toBe(2);
  });

  it('should count entries by document', async () => {
    await cacheApiData('test:1', { test: 1 }, 'wotc-srd', '1.0');
    await cacheApiData('test:2', { test: 2 }, 'wotc-srd', '1.0');
    await cacheApiData('test:3', { test: 3 }, 'other-doc', '1.0');

    const stats = await getCacheStats();
    expect(stats.byDocument['wotc-srd']).toBe(2);
    expect(stats.byDocument['other-doc']).toBe(1);
  });

  it('should count expired entries', async () => {
    await cacheApiData('test:valid', { valid: true }, 'wotc-srd', '1.0', 10000);

    await db.apiCache.add(
      createTestCacheEntry('test:expired', {
        cachedAt: new Date(Date.now() - 2000).toISOString(),
        ttl: 1000,
      })
    );

    const stats = await getCacheStats();
    expect(stats.expired).toBe(1);
  });

  it('should calculate approximate size', async () => {
    await cacheApiData('test:data', { some: 'data', more: 'content' }, 'wotc-srd', '1.0');

    const stats = await getCacheStats();
    expect(stats.sizeBytes).toBeGreaterThan(0);
  });

  it('should track oldest and newest entries', async () => {
    const old = new Date(Date.now() - 5000).toISOString();
    const middle = new Date(Date.now() - 3000).toISOString();
    const recent = new Date(Date.now() - 1000).toISOString();

    await db.apiCache.add(createTestCacheEntry('test:old', { cachedAt: old }));
    await db.apiCache.add(createTestCacheEntry('test:middle', { cachedAt: middle }));
    await db.apiCache.add(createTestCacheEntry('test:recent', { cachedAt: recent }));

    const stats = await getCacheStats();
    expect(stats.oldestEntry).toEqual(new Date(old));
    expect(stats.newestEntry).toEqual(new Date(recent));
  });

  it('should return null for oldest/newest when cache is empty', async () => {
    const stats = await getCacheStats();
    expect(stats.oldestEntry).toBeNull();
    expect(stats.newestEntry).toBeNull();
  });
});

describe('Cache Warming', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
    await db.apiCache.clear();
  });

  it('should call progress callback with updates', async () => {
    const progressUpdates: Array<{ endpoint: string; percentage: number }> = [];
    const callback = vi.fn((progress) => {
      progressUpdates.push({
        endpoint: progress.currentEndpoint,
        percentage: progress.percentage,
      });
    });

    await warmCache(['wotc-srd'], ['classes', 'spells'], callback);

    expect(callback).toHaveBeenCalled();
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
  });

  it('should return success when no errors', async () => {
    const result = await warmCache(['wotc-srd'], ['classes']);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle empty endpoints array', async () => {
    const result = await warmCache(['wotc-srd'], []);
    expect(result.success).toBe(true);
  });
});

describe('Advanced Cache Operations', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
    await db.apiCache.clear();
  });

  describe('getOrCache', () => {
    it('should return cached data if available', async () => {
      const key = 'test:get-or-cache';
      await cacheApiData(key, { cached: true }, 'wotc-srd', '1.0');

      const fetcher = vi.fn().mockResolvedValue({ fresh: true });
      const result = await getOrCache(key, fetcher, 'wotc-srd', '1.0');

      expect(result).toEqual({ cached: true });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not in cache', async () => {
      const key = 'test:fetch-and-cache';
      const fetchedData = { fresh: true };
      const fetcher = vi.fn().mockResolvedValue(fetchedData);

      const result = await getOrCache(key, fetcher, 'wotc-srd', '1.0');

      expect(result).toEqual(fetchedData);
      expect(fetcher).toHaveBeenCalledOnce();

      const cached = await getCachedApiData(key);
      expect(cached).toEqual(fetchedData);
    });

    it('should fetch if cache expired', async () => {
      const key = 'test:expired-fetch';
      await db.apiCache.add(
        createTestCacheEntry(key, {
          data: { old: true },
          cachedAt: new Date(Date.now() - 2000).toISOString(),
          ttl: 1000,
        })
      );

      const fetchedData = { fresh: true };
      const fetcher = vi.fn().mockResolvedValue(fetchedData);

      const result = await getOrCache(key, fetcher, 'wotc-srd', '1.0');

      expect(result).toEqual(fetchedData);
      expect(fetcher).toHaveBeenCalledOnce();
    });
  });

  describe('batchCacheData', () => {
    it('should cache multiple entries at once', async () => {
      const entries = [
        { key: 'batch:1', data: { num: 1 }, documentKey: 'wotc-srd', version: '1.0' },
        { key: 'batch:2', data: { num: 2 }, documentKey: 'wotc-srd', version: '1.0' },
        { key: 'batch:3', data: { num: 3 }, documentKey: 'other-doc', version: '1.0' },
      ];

      const count = await batchCacheData(entries);
      expect(count).toBe(3);

      const all = await db.apiCache.toArray();
      expect(all).toHaveLength(3);
    });

    it('should use default TTL if not specified', async () => {
      await batchCacheData([
        { key: 'batch:default', data: { test: true }, documentKey: 'wotc-srd', version: '1.0' },
      ]);

      const entry = await getCacheEntryById('batch:default');
      expect(entry?.ttl).toBe(CACHE_TTL.default);
    });

    it('should use custom TTL when provided', async () => {
      const customTtl = 5000;
      await batchCacheData([
        {
          key: 'batch:custom',
          data: { test: true },
          documentKey: 'wotc-srd',
          version: '1.0',
          ttl: customTtl,
        },
      ]);

      const entry = await getCacheEntryById('batch:custom');
      expect(entry?.ttl).toBe(customTtl);
    });
  });

  describe('refreshCache', () => {
    it('should update cache timestamp', async () => {
      const key = 'test:refresh';
      const oldTime = new Date(Date.now() - 5000).toISOString();
      await db.apiCache.add(createTestCacheEntry(key, { cachedAt: oldTime }));

      const refreshed = await refreshCache(key);
      expect(refreshed).toBe(true);

      const entry = await getCacheEntryById(key);
      expect(entry?.cachedAt).not.toBe(oldTime);
      expect(new Date(entry!.cachedAt).getTime()).toBeGreaterThan(new Date(oldTime).getTime());
    });

    it('should update TTL if provided', async () => {
      const key = 'test:refresh-ttl';
      await cacheApiData(key, { test: true }, 'wotc-srd', '1.0', 1000);

      const newTtl = 5000;
      await refreshCache(key, newTtl);

      const entry = await getCacheEntryById(key);
      expect(entry?.ttl).toBe(newTtl);
    });

    it('should keep existing TTL if not provided', async () => {
      const key = 'test:refresh-keep-ttl';
      const originalTtl = 3000;
      await cacheApiData(key, { test: true }, 'wotc-srd', '1.0', originalTtl);

      await refreshCache(key);

      const entry = await getCacheEntryById(key);
      expect(entry?.ttl).toBe(originalTtl);
    });

    it('should return false for non-existent entry', async () => {
      const refreshed = await refreshCache('non-existent');
      expect(refreshed).toBe(false);
    });
  });
});
