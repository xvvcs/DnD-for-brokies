/**
 * Feats Endpoint
 *
 * Fetches feat data from the Open5E API.
 * @module api/endpoints/feats
 */

import type { Open5eFeat } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

/** API endpoint path for feats */
const ENDPOINT = 'feats';

/**
 * Fetch feats for a specific document.
 * Results are cached per document.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of feats from the specified document
 */
export async function fetchFeatsByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eFeat[]> {
  return open5eClient.fetchAllCached<Open5eFeat>(
    ENDPOINT,
    { document__key: documentKey },
    {
      documentKey,
      ttl: CACHE_TTL.default,
      forceRefresh,
    }
  );
}

/**
 * Fetch feats from multiple documents.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of feats from all specified documents
 */
export async function fetchFeats(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eFeat[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchFeatsByDocument(key, forceRefresh))
  );

  return results.flat();
}

/**
 * Fetch a single feat by key.
 * @param key Feat key (e.g., "sharpshooter")
 * @returns The feat or null if not found
 */
export async function fetchFeat(key: string): Promise<Open5eFeat | null> {
  try {
    return await open5eClient.fetchCached<Open5eFeat>(`${ENDPOINT}/${key}`, undefined, {
      documentKey: 'global',
      ttl: CACHE_TTL.default,
    });
  } catch {
    return null;
  }
}
