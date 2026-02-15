/**
 * Open5E API Client Tests
 *
 * Tests for the enhanced API client covering:
 * - Basic fetch with error handling
 * - Retry logic with exponential backoff
 * - Request throttling / queue
 * - Pagination (fetchAll)
 * - Cache integration (fetchCached, fetchAllCached)
 * @module api/client.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Open5eClient } from './client';
import { db } from '@/lib/db/database';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock fetch response.
 */
function mockResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => mockResponse(data, status),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data)),
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

/**
 * Create a paginated API response.
 */
function paginatedResponse<T>(
  results: T[],
  next: string | null = null,
  count?: number
): { count: number; next: string | null; previous: string | null; results: T[] } {
  return {
    count: count ?? results.length,
    next,
    previous: null,
    results,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Open5eClient', () => {
  let client: Open5eClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Clear IndexedDB tables
    await db.apiCache.clear();

    // Create a client with known base URL
    client = new Open5eClient('https://api.open5e.com/v2');

    // Mock global fetch
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Basic fetch
  // --------------------------------------------------------------------------

  describe('fetch', () => {
    it('should fetch data from the API', async () => {
      const mockData = { key: 'fighter', name: 'Fighter' };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockData));

      const result = await client.fetch<typeof mockData>('classes/fighter');

      expect(result).toEqual(mockData);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should append query parameters to the URL', async () => {
      const mockData = paginatedResponse([]);
      fetchSpy.mockResolvedValueOnce(mockResponse(mockData));

      await client.fetch('classes', { document__key: 'wotc-srd', page: 1 });

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('document__key=wotc-srd');
      expect(calledUrl).toContain('page=1');
    });

    it('should skip undefined parameters', async () => {
      const mockData = paginatedResponse([]);
      fetchSpy.mockResolvedValueOnce(mockResponse(mockData));

      await client.fetch('classes', { document__key: 'wotc-srd', search: undefined });

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('document__key=wotc-srd');
      expect(calledUrl).not.toContain('search');
    });

    it('should throw on 4xx client errors without retrying', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ error: 'Not Found' }, 404));

      await expect(client.fetch('classes/nonexistent', undefined, { retries: 2 })).rejects.toThrow(
        'Open5E API error: 404'
      );

      // Should NOT retry on 4xx (except 429)
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx server errors', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse({ error: 'Internal Server Error' }, 500))
        .mockResolvedValueOnce(mockResponse({ key: 'fighter', name: 'Fighter' }));

      const result = await client.fetch<{ key: string; name: string }>(
        'classes/fighter',
        undefined,
        {
          retries: 1,
        }
      );

      expect(result).toEqual({ key: 'fighter', name: 'Fighter' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 rate limit errors', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse({ error: 'Too Many Requests' }, 429))
        .mockResolvedValueOnce(mockResponse({ key: 'wizard', name: 'Wizard' }));

      const result = await client.fetch<{ key: string; name: string }>(
        'classes/wizard',
        undefined,
        {
          retries: 1,
        }
      );

      expect(result).toEqual({ key: 'wizard', name: 'Wizard' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw after exhausting all retries', async () => {
      fetchSpy.mockResolvedValue(mockResponse({ error: 'Internal Server Error' }, 500));

      await expect(client.fetch('classes/fighter', undefined, { retries: 2 })).rejects.toThrow(
        'Open5E API error: 500'
      );

      // Initial attempt + 2 retries = 3 calls
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('should respect AbortSignal', async () => {
      const controller = new AbortController();
      fetchSpy.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      controller.abort();

      await expect(
        client.fetch('classes/fighter', undefined, {
          signal: controller.signal,
          retries: 3,
        })
      ).rejects.toThrow();

      // Should not retry on abort
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should build URL with trailing slash', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ key: 'test' }));

      await client.fetch('classes');

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/\/classes\/(\?|$)/);
    });
  });

  // --------------------------------------------------------------------------
  // Paginated fetch
  // --------------------------------------------------------------------------

  describe('fetchAll', () => {
    it('should fetch all pages of results', async () => {
      const page1 = paginatedResponse(
        [{ key: 'fighter', name: 'Fighter' }],
        'https://api.open5e.com/v2/classes/?page=2',
        3
      );
      const page2 = paginatedResponse(
        [{ key: 'wizard', name: 'Wizard' }],
        'https://api.open5e.com/v2/classes/?page=3',
        3
      );
      const page3 = paginatedResponse([{ key: 'rogue', name: 'Rogue' }], null, 3);

      fetchSpy
        .mockResolvedValueOnce(mockResponse(page1))
        .mockResolvedValueOnce(mockResponse(page2))
        .mockResolvedValueOnce(mockResponse(page3));

      const results = await client.fetchAll<{ key: string; name: string }>('classes');

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ key: 'fighter', name: 'Fighter' });
      expect(results[1]).toEqual({ key: 'wizard', name: 'Wizard' });
      expect(results[2]).toEqual({ key: 'rogue', name: 'Rogue' });
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle single page of results', async () => {
      const page = paginatedResponse(
        [
          { key: 'fighter', name: 'Fighter' },
          { key: 'wizard', name: 'Wizard' },
        ],
        null,
        2
      );

      fetchSpy.mockResolvedValueOnce(mockResponse(page));

      const results = await client.fetchAll<{ key: string; name: string }>('classes');

      expect(results).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle empty results', async () => {
      const page = paginatedResponse([], null, 0);
      fetchSpy.mockResolvedValueOnce(mockResponse(page));

      const results = await client.fetchAll<{ key: string; name: string }>('classes');

      expect(results).toHaveLength(0);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should use custom page size', async () => {
      const page = paginatedResponse([], null, 0);
      fetchSpy.mockResolvedValueOnce(mockResponse(page));

      await client.fetchAll('classes', undefined, { pageSize: 100 });

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=100');
    });

    it('should pass additional params alongside pagination', async () => {
      const page = paginatedResponse([], null, 0);
      fetchSpy.mockResolvedValueOnce(mockResponse(page));

      await client.fetchAll('classes', { document__key: 'wotc-srd' });

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('document__key=wotc-srd');
      expect(calledUrl).toContain('page=1');
    });
  });

  // --------------------------------------------------------------------------
  // Cached fetch
  // --------------------------------------------------------------------------

  describe('fetchCached', () => {
    it('should return data from cache on second call', async () => {
      const mockData = { key: 'fighter', name: 'Fighter' };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockData));

      // First call: fetches from API
      const result1 = await client.fetchCached<typeof mockData>('classes/fighter');
      expect(result1).toEqual(mockData);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Second call: should return from cache
      const result2 = await client.fetchCached<typeof mockData>('classes/fighter');
      expect(result2).toEqual(mockData);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // No additional fetch
    });

    it('should bypass cache when forceRefresh is true', async () => {
      const mockData1 = { key: 'fighter', name: 'Fighter' };
      const mockData2 = { key: 'fighter', name: 'Fighter (Updated)' };

      fetchSpy
        .mockResolvedValueOnce(mockResponse(mockData1))
        .mockResolvedValueOnce(mockResponse(mockData2));

      // First call: populates cache
      await client.fetchCached('classes/fighter');

      // Second call with forceRefresh: should fetch again
      const result = await client.fetchCached<typeof mockData2>('classes/fighter', undefined, {
        forceRefresh: true,
      });
      expect(result).toEqual(mockData2);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should store cache entries in IndexedDB', async () => {
      const mockData = { key: 'fighter', name: 'Fighter' };
      fetchSpy.mockResolvedValueOnce(mockResponse(mockData));

      await client.fetchCached('classes/fighter');

      const cacheEntries = await db.apiCache.toArray();
      expect(cacheEntries.length).toBeGreaterThan(0);
      expect(cacheEntries[0].data).toEqual(mockData);
    });
  });

  describe('fetchAllCached', () => {
    it('should cache all pages combined', async () => {
      const page1 = paginatedResponse(
        [{ key: 'fighter', name: 'Fighter' }],
        'https://api.open5e.com/v2/classes/?page=2',
        2
      );
      const page2 = paginatedResponse([{ key: 'wizard', name: 'Wizard' }], null, 2);

      fetchSpy
        .mockResolvedValueOnce(mockResponse(page1))
        .mockResolvedValueOnce(mockResponse(page2));

      // First call
      const result1 = await client.fetchAllCached<{ key: string; name: string }>('classes');
      expect(result1).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Second call: should come from cache (no additional fetches)
      const result2 = await client.fetchAllCached<{ key: string; name: string }>('classes');
      expect(result2).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should bypass cache with forceRefresh', async () => {
      const page = paginatedResponse([{ key: 'fighter' }], null, 1);

      fetchSpy.mockResolvedValueOnce(mockResponse(page)).mockResolvedValueOnce(mockResponse(page));

      await client.fetchAllCached('classes');
      await client.fetchAllCached('classes', undefined, { forceRefresh: true });

      // Two separate API calls
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  // --------------------------------------------------------------------------
  // Queue stats
  // --------------------------------------------------------------------------

  describe('queueStats', () => {
    it('should report queue statistics', () => {
      const stats = client.queueStats;
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('active');
      expect(stats.pending).toBe(0);
      expect(stats.active).toBe(0);
    });
  });
});
