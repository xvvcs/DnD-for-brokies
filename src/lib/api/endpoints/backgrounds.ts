/**
 * Backgrounds Endpoint
 *
 * Fetches background data from the Open5E API.
 * Supports multi-document filtering and caching per document key.
 * @module api/endpoints/backgrounds
 */

import type { Open5eBackground } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

/** API endpoint path for backgrounds */
const ENDPOINT = 'backgrounds';

/**
 * Fetch backgrounds for a specific document.
 * Results are cached per document with a 7-day TTL.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of backgrounds from the specified document
 */
export async function fetchBackgroundsByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eBackground[]> {
  return open5eClient.fetchAllCached<Open5eBackground>(
    ENDPOINT,
    { document__key: documentKey },
    {
      documentKey,
      ttl: CACHE_TTL.content,
      forceRefresh,
    }
  );
}

/**
 * Fetch backgrounds from multiple documents and merge results.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of backgrounds from all specified documents
 */
export async function fetchBackgrounds(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eBackground[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchBackgroundsByDocument(key, forceRefresh))
  );

  return results.flat();
}

/**
 * Fetch a single background by key.
 * @param key Background key (e.g., "acolyte", "criminal")
 * @returns The background or null if not found
 */
export async function fetchBackground(key: string): Promise<Open5eBackground | null> {
  try {
    return await open5eClient.fetchCached<Open5eBackground>(`${ENDPOINT}/${key}`, undefined, {
      documentKey: 'global',
      ttl: CACHE_TTL.content,
    });
  } catch {
    return null;
  }
}
