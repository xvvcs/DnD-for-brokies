/**
 * Open5E API Client
 *
 * Enhanced API client with request throttling, retry logic,
 * automatic pagination handling, and cache integration.
 * @module api/client
 */

import type { Open5ePaginatedResponse } from '@/types/open5e';
import { generateCacheKey, getOrCache, getCachedApiData, cacheApiData } from '@/lib/db/cache';
import { CACHE_TTL } from '@/lib/db/schema';

const API_BASE_URL = process.env.NEXT_PUBLIC_OPEN5E_API_URL || 'https://api.open5e.com/v2';

// ============================================================================
// Configuration
// ============================================================================

/** Maximum number of concurrent requests */
const MAX_CONCURRENT = 5;

/** Delay between batches in milliseconds */
const BATCH_DELAY_MS = 100;

/** Default number of retries for failed requests */
const DEFAULT_RETRIES = 3;

/** Base delay for exponential backoff in milliseconds */
const RETRY_BASE_DELAY_MS = 500;

/** Default page size for paginated requests */
const DEFAULT_PAGE_SIZE = 50;

// ============================================================================
// Request Queue (Throttling)
// ============================================================================

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

/**
 * Manages request throttling with configurable concurrency and delay.
 */
class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private activeCount = 0;
  private maxConcurrent: number;
  private batchDelayMs: number;

  constructor(maxConcurrent: number = MAX_CONCURRENT, batchDelayMs: number = BATCH_DELAY_MS) {
    this.maxConcurrent = maxConcurrent;
    this.batchDelayMs = batchDelayMs;
  }

  /**
   * Add a request to the queue
   */
  enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  /**
   * Process queued requests respecting concurrency limits
   */
  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.activeCount++;

    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeCount--;

      // Add delay between batches
      if (this.queue.length > 0) {
        await this.delay(this.batchDelayMs);
      }

      this.processQueue();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Number of requests currently in the queue */
  get pendingCount(): number {
    return this.queue.length;
  }

  /** Number of active requests */
  get active(): number {
    return this.activeCount;
  }
}

// ============================================================================
// API Client
// ============================================================================

/** Options for API fetch requests */
export interface FetchOptions {
  /** Number of retries on failure (default: 3) */
  retries?: number;
  /** Skip the request queue (not recommended) */
  skipQueue?: boolean;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/** Options for paginated fetch requests */
export interface PaginatedFetchOptions extends FetchOptions {
  /** Page size (default: 50) */
  pageSize?: number;
}

/** Options for cached fetch requests */
export interface CachedFetchOptions extends PaginatedFetchOptions {
  /** Document key for cache organization */
  documentKey?: string;
  /** Cache TTL in milliseconds */
  ttl?: number;
  /** Force refresh (skip cache read, but still write to cache) */
  forceRefresh?: boolean;
}

/**
 * Enhanced API client for Open5E with throttling, retry, and cache support.
 */
export class Open5eClient {
  private baseUrl: string;
  private queue: RequestQueue;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
    this.queue = new RequestQueue();
  }

  // --------------------------------------------------------------------------
  // Core Fetch
  // --------------------------------------------------------------------------

  /**
   * Generic fetch method with error handling and retry logic.
   * @param endpoint API endpoint path (e.g., "classes", "spells")
   * @param params Query parameters
   * @param options Fetch options (retries, signal, etc.)
   * @returns Parsed JSON response
   */
  async fetch<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options: FetchOptions = {}
  ): Promise<T> {
    const { retries = DEFAULT_RETRIES, skipQueue = false, signal } = options;

    const executeFetch = async (): Promise<T> => {
      return this.fetchWithRetry<T>(endpoint, params, retries, signal);
    };

    if (skipQueue) {
      return executeFetch();
    }

    return this.queue.enqueue(executeFetch);
  }

  /**
   * Fetch with exponential backoff retry logic.
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> | undefined,
    retries: number,
    signal?: AbortSignal
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = this.buildUrl(endpoint, params);
        const response = await globalThis.fetch(url.toString(), { signal });

        if (!response.ok) {
          // Don't retry on 4xx client errors (except 429 rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(
              `Open5E API error: ${response.status} ${response.statusText} for ${endpoint}`
            );
          }
          throw new Error(
            `Open5E API error: ${response.status} ${response.statusText} for ${endpoint}`
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on abort
        if (signal?.aborted) {
          throw lastError;
        }

        // Don't retry on 4xx errors (except 429)
        if (
          lastError.message.includes('Open5E API error: 4') &&
          !lastError.message.includes('429')
        ) {
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${endpoint} after ${retries} retries`);
  }

  // --------------------------------------------------------------------------
  // Paginated Fetch
  // --------------------------------------------------------------------------

  /**
   * Fetch all pages of a paginated endpoint.
   * Automatically follows `next` links until all results are collected.
   * @param endpoint API endpoint path
   * @param params Query parameters (page/limit are managed automatically)
   * @param options Paginated fetch options
   * @returns Array of all results across all pages
   */
  async fetchAll<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options: PaginatedFetchOptions = {}
  ): Promise<T[]> {
    const { pageSize = DEFAULT_PAGE_SIZE, ...fetchOptions } = options;
    const allResults: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const paginatedParams = {
        ...params,
        page,
        limit: pageSize,
      };

      const response = await this.fetch<Open5ePaginatedResponse<T>>(
        endpoint,
        paginatedParams as Record<string, string | number | boolean | undefined>,
        fetchOptions
      );

      allResults.push(...response.results);

      if (response.next) {
        page++;
      } else {
        hasMore = false;
      }
    }

    return allResults;
  }

  // --------------------------------------------------------------------------
  // Cached Fetch
  // --------------------------------------------------------------------------

  /**
   * Fetch data with automatic caching.
   * Uses the cache-aside pattern: check cache first, fetch if miss, cache result.
   * @param endpoint API endpoint path
   * @param params Query parameters
   * @param options Cached fetch options
   * @returns Cached or freshly fetched data
   */
  async fetchCached<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options: CachedFetchOptions = {}
  ): Promise<T> {
    const {
      documentKey = 'global',
      ttl = CACHE_TTL.default,
      forceRefresh = false,
      ...fetchOptions
    } = options;

    const cacheKey = generateCacheKey(endpoint, params as Record<string, unknown>);

    // If not forcing refresh, try cache first
    if (!forceRefresh) {
      const cached = await getCachedApiData<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch from API
    const data = await this.fetch<T>(endpoint, params, fetchOptions);

    // Cache the result
    await cacheApiData(cacheKey, data, documentKey, '1', ttl);

    return data;
  }

  /**
   * Fetch all pages with automatic caching.
   * Caches the aggregated result (all pages combined).
   * @param endpoint API endpoint path
   * @param params Query parameters
   * @param options Cached fetch options
   * @returns All results from all pages (cached or fresh)
   */
  async fetchAllCached<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options: CachedFetchOptions = {}
  ): Promise<T[]> {
    const {
      documentKey = 'global',
      ttl = CACHE_TTL.default,
      forceRefresh = false,
      ...fetchOptions
    } = options;

    const cacheKey = generateCacheKey(endpoint, {
      ...(params as Record<string, unknown>),
      _allPages: true,
    });

    if (!forceRefresh) {
      const cached = await getCachedApiData<T[]>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const data = await this.fetchAll<T>(endpoint, params, fetchOptions);

    await cacheApiData(cacheKey, data, documentKey, '1', ttl);

    return data;
  }

  /**
   * Fetch with cache-aside pattern using getOrCache utility.
   * @param endpoint API endpoint path
   * @param params Query parameters
   * @param documentKey Document key for cache
   * @param ttl Cache TTL
   * @returns Data from cache or API
   */
  async fetchWithCache<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> | undefined,
    documentKey: string,
    ttl: number = CACHE_TTL.default
  ): Promise<T> {
    const cacheKey = generateCacheKey(endpoint, params as Record<string, unknown>);

    return getOrCache<T>(cacheKey, () => this.fetch<T>(endpoint, params), documentKey, '1', ttl);
  }

  // --------------------------------------------------------------------------
  // Utility
  // --------------------------------------------------------------------------

  /**
   * Build a full URL from endpoint and parameters.
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): URL {
    // Remove leading/trailing slashes for clean joining
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    const url = new URL(`${this.baseUrl}/${cleanEndpoint}/`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url;
  }

  /** Get queue statistics */
  get queueStats(): { pending: number; active: number } {
    return {
      pending: this.queue.pendingCount,
      active: this.queue.active,
    };
  }
}

/** Singleton API client instance */
export const open5eClient = new Open5eClient();
