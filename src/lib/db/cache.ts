/**
 * API Cache Layer
 *
 * Manages caching of Open5E API responses to reduce network requests
 * and improve offline functionality.
 * @module db/cache
 */

import { db } from './database';
import type { ApiCacheEntry } from './schema';
import { CACHE_TTL } from './schema';

// ============================================================================
// Cache Key Generation (browser-compatible, no Node.js crypto)
// ============================================================================

/**
 * Simple deterministic hash for cache keys.
 * Uses djb2-style algorithm — sufficient for cache key uniqueness.
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).substring(0, 8);
}

/**
 * Generate a cache key from endpoint and parameters
 * Format: "endpoint:paramsHash"
 * @param endpoint API endpoint (e.g., "classes", "spells")
 * @param params Query parameters
 * @returns Cache key string
 */
export function generateCacheKey(endpoint: string, params: Record<string, unknown> = {}): string {
  // Sort params keys for consistent hashing
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  const paramsString = JSON.stringify(sortedParams);
  const hash = hashString(paramsString);

  return `${endpoint}:${hash}`;
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Cache API data
 * @param key Cache key (use generateCacheKey)
 * @param data Data to cache
 * @param documentKey Document/rulebook key (e.g., "wotc-srd")
 * @param version API/document version
 * @param ttl Time-to-live in milliseconds (optional, uses default)
 * @returns The cached entry
 */
export async function cacheApiData(
  key: string,
  data: unknown,
  documentKey: string,
  version: string,
  ttl: number = CACHE_TTL.default
): Promise<ApiCacheEntry> {
  const entry: ApiCacheEntry = {
    key,
    data,
    documentKey,
    version,
    cachedAt: new Date().toISOString(),
    ttl,
  };

  await db.apiCache.put(entry);
  return entry;
}

/**
 * Get cached API data with TTL check
 * @param key Cache key
 * @returns Cached data or null if not found/expired
 */
export async function getCachedApiData<T = unknown>(key: string): Promise<T | null> {
  const entry = await db.apiCache.get(key);

  if (!entry) {
    return null;
  }

  // Check if cache has expired
  const cachedTime = new Date(entry.cachedAt).getTime();
  const now = Date.now();
  const age = now - cachedTime;

  if (age > entry.ttl) {
    // Cache expired, delete it
    await db.apiCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Check if cache entry exists and is valid (not expired)
 * @param key Cache key
 * @returns True if cache exists and is valid
 */
export async function isCacheValid(key: string): Promise<boolean> {
  const entry = await db.apiCache.get(key);

  if (!entry) {
    return false;
  }

  const cachedTime = new Date(entry.cachedAt).getTime();
  const now = Date.now();
  const age = now - cachedTime;

  return age <= entry.ttl;
}

/**
 * Invalidate (delete) a specific cache entry
 * @param key Cache key
 * @returns True if cache was deleted, false if not found
 */
export async function invalidateCache(key: string): Promise<boolean> {
  const existing = await db.apiCache.get(key);
  if (!existing) return false;

  await db.apiCache.delete(key);
  return true;
}

/**
 * Invalidate all cache entries for a document
 * @param documentKey Document key
 * @returns Number of entries deleted
 */
export async function invalidateDocumentCache(documentKey: string): Promise<number> {
  const entries = await db.apiCache.where('documentKey').equals(documentKey).toArray();
  await db.apiCache.where('documentKey').equals(documentKey).delete();
  return entries.length;
}

/**
 * Clear all cached API data
 * @returns Number of entries deleted
 */
export async function clearAllCache(): Promise<number> {
  const count = await db.apiCache.count();
  await db.apiCache.clear();
  return count;
}

/**
 * Delete expired cache entries
 * @returns Number of expired entries deleted
 */
export async function clearExpiredCache(): Promise<number> {
  const now = Date.now();
  const allEntries = await db.apiCache.toArray();

  let deletedCount = 0;
  for (const entry of allEntries) {
    const cachedTime = new Date(entry.cachedAt).getTime();
    const age = now - cachedTime;

    if (age > entry.ttl) {
      await db.apiCache.delete(entry.key);
      deletedCount++;
    }
  }

  return deletedCount;
}

// ============================================================================
// Cache Statistics
// ============================================================================

export interface CacheStats {
  /** Total number of cache entries */
  total: number;
  /** Number of entries by document key */
  byDocument: Record<string, number>;
  /** Number of expired entries */
  expired: number;
  /** Total cache size in bytes (approximate) */
  sizeBytes: number;
  /** Oldest cache entry timestamp */
  oldestEntry: Date | null;
  /** Newest cache entry timestamp */
  newestEntry: Date | null;
}

/**
 * Get cache statistics
 * @returns Cache statistics object
 */
export async function getCacheStats(): Promise<CacheStats> {
  const entries = await db.apiCache.toArray();
  const now = Date.now();

  const byDocument: Record<string, number> = {};
  let expired = 0;
  let sizeBytes = 0;
  let oldestEntry: Date | null = null;
  let newestEntry: Date | null = null;

  for (const entry of entries) {
    // Count by document
    byDocument[entry.documentKey] = (byDocument[entry.documentKey] || 0) + 1;

    // Count expired
    const cachedTime = new Date(entry.cachedAt).getTime();
    const age = now - cachedTime;
    if (age > entry.ttl) {
      expired++;
    }

    // Approximate size (JSON string length)
    sizeBytes += JSON.stringify(entry.data).length;

    // Track oldest/newest
    const entryDate = new Date(entry.cachedAt);
    if (!oldestEntry || entryDate < oldestEntry) {
      oldestEntry = entryDate;
    }
    if (!newestEntry || entryDate > newestEntry) {
      newestEntry = entryDate;
    }
  }

  return {
    total: entries.length,
    byDocument,
    expired,
    sizeBytes,
    oldestEntry,
    newestEntry,
  };
}

// ============================================================================
// Cache Warming
// ============================================================================

export interface CacheWarmingProgress {
  /** Current endpoint being cached */
  currentEndpoint: string;
  /** Number of endpoints completed */
  completed: number;
  /** Total number of endpoints to cache */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Status message */
  status: string;
  /** Any errors encountered */
  errors: string[];
}

export type CacheWarmingCallback = (progress: CacheWarmingProgress) => void;

/**
 * Warm cache for a set of documents
 * This is a placeholder that will be implemented with actual API integration
 * @param documentKeys Document keys to warm cache for
 * @param endpoints List of endpoints to cache (e.g., ['classes', 'species', 'backgrounds'])
 * @param onProgress Optional progress callback
 * @returns Object with success status and any errors
 */
export async function warmCache(
  documentKeys: string[],
  endpoints: string[],
  onProgress?: CacheWarmingCallback
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  let completed = 0;

  for (const endpoint of endpoints) {
    if (onProgress) {
      onProgress({
        currentEndpoint: endpoint,
        completed,
        total: endpoints.length,
        percentage: Math.round((completed / endpoints.length) * 100),
        status: `Caching ${endpoint}...`,
        errors,
      });
    }

    try {
      // TODO: Implement actual API fetching and caching
      // For now, this is a placeholder that demonstrates the structure
      // When API integration is complete, this will:
      // 1. Fetch data from Open5E API for each endpoint/document
      // 2. Cache the results using cacheApiData()
      // 3. Handle pagination if needed
      // 4. Handle rate limiting

      // Placeholder delay to simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      completed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to cache ${endpoint}: ${errorMessage}`);
    }
  }

  if (onProgress) {
    onProgress({
      currentEndpoint: '',
      completed,
      total: endpoints.length,
      percentage: 100,
      status: errors.length > 0 ? 'Completed with errors' : 'Completed successfully',
      errors,
    });
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Pre-populate cache for common queries
 * Caches frequently accessed data like reference data (conditions, skills, etc.)
 * @param onProgress Optional progress callback
 * @returns Result with success status
 */
export async function prewarmCommonCache(
  onProgress?: CacheWarmingCallback
): Promise<{ success: boolean; errors: string[] }> {
  // Common endpoints that should be pre-cached
  const commonEndpoints = ['conditions', 'skills', 'languages', 'damage-types', 'ability-scores'];

  return warmCache(['wotc-srd'], commonEndpoints, onProgress);
}

// ============================================================================
// Batch Cache Operations
// ============================================================================

/**
 * Get or cache data (cache-aside pattern)
 * Checks cache first, calls fetcher if not found, then caches result
 * @param key Cache key
 * @param fetcher Function to fetch data if not cached
 * @param documentKey Document key for caching
 * @param version Version for caching
 * @param ttl TTL for caching
 * @returns The data (from cache or freshly fetched)
 */
export async function getOrCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  documentKey: string,
  version: string,
  ttl: number = CACHE_TTL.default
): Promise<T> {
  // Try to get from cache first
  const cached = await getCachedApiData<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Not in cache, fetch fresh data
  const data = await fetcher();

  // Cache the result
  await cacheApiData(key, data, documentKey, version, ttl);

  return data;
}

/**
 * Batch cache multiple entries
 * @param entries Array of cache entries to store
 * @returns Number of entries cached
 */
export async function batchCacheData(
  entries: Array<{
    key: string;
    data: unknown;
    documentKey: string;
    version: string;
    ttl?: number;
  }>
): Promise<number> {
  const cacheEntries: ApiCacheEntry[] = entries.map((entry) => ({
    key: entry.key,
    data: entry.data,
    documentKey: entry.documentKey,
    version: entry.version,
    cachedAt: new Date().toISOString(),
    ttl: entry.ttl || CACHE_TTL.default,
  }));

  await db.apiCache.bulkPut(cacheEntries);
  return cacheEntries.length;
}

/**
 * Refresh cache entry (re-cache with new TTL)
 * @param key Cache key
 * @param ttl Optional new TTL
 * @returns True if refreshed, false if not found
 */
export async function refreshCache(key: string, ttl?: number): Promise<boolean> {
  const entry = await db.apiCache.get(key);
  if (!entry) return false;

  const refreshed: ApiCacheEntry = {
    ...entry,
    cachedAt: new Date().toISOString(),
    ttl: ttl || entry.ttl,
  };

  await db.apiCache.put(refreshed);
  return true;
}
