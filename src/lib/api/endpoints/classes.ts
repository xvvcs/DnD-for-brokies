/**
 * Classes Endpoint
 *
 * Fetches D&D class data from the Open5E API.
 * Supports pagination, multi-document filtering, and caching per document key.
 * @module api/endpoints/classes
 */

import type { Open5eClass } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

/** API endpoint path for classes */
const ENDPOINT = 'classes';

/**
 * Fetch classes for a specific document.
 * Results are cached per document with a 7-day TTL.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of classes from the specified document
 */
export async function fetchClassesByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eClass[]> {
  return open5eClient.fetchAllCached<Open5eClass>(
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
 * Fetch classes from multiple documents and merge results.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of classes from all specified documents
 */
export async function fetchClasses(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eClass[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchClassesByDocument(key, forceRefresh))
  );

  return results.flat();
}

/**
 * Fetch a single class by key.
 * @param key Class key (e.g., "fighter", "wizard")
 * @returns The class or null if not found
 */
export async function fetchClass(key: string): Promise<Open5eClass | null> {
  try {
    return await open5eClient.fetchCached<Open5eClass>(`${ENDPOINT}/${key}`, undefined, {
      documentKey: 'global',
      ttl: CACHE_TTL.content,
    });
  } catch {
    return null;
  }
}
