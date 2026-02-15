/**
 * Documents Endpoint
 *
 * Fetches available documents/rulebooks from the Open5E API.
 * Documents are cached globally with long TTL since they rarely change.
 * @module api/endpoints/documents
 */

import type { Open5eDocument } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

/** API endpoint path for documents */
const ENDPOINT = 'documents';

/**
 * Fetch all available documents/rulebooks.
 * Results are cached globally with a 30-day TTL.
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of all available documents
 */
export async function fetchDocuments(forceRefresh = false): Promise<Open5eDocument[]> {
  return open5eClient.fetchAllCached<Open5eDocument>(ENDPOINT, undefined, {
    documentKey: 'global',
    ttl: CACHE_TTL.documents,
    forceRefresh,
  });
}

/**
 * Fetch a single document by key.
 * @param key Document key (e.g., "wotc-srd", "a5e")
 * @returns The document or null if not found
 */
export async function fetchDocument(key: string): Promise<Open5eDocument | null> {
  try {
    return await open5eClient.fetchCached<Open5eDocument>(`${ENDPOINT}/${key}`, undefined, {
      documentKey: 'global',
      ttl: CACHE_TTL.documents,
    });
  } catch {
    return null;
  }
}

/**
 * Extract document metadata for display.
 * @param documents Array of documents
 * @returns Simplified metadata for UI display
 */
export function extractDocumentMetadata(documents: Open5eDocument[]): DocumentMetadata[] {
  return documents.map((doc) => ({
    key: doc.key,
    name: doc.name,
    author: doc.author,
    description: doc.desc,
    publishedAt: doc.published_at,
  }));
}

/** Simplified document metadata for UI */
export interface DocumentMetadata {
  key: string;
  name: string;
  author: string;
  description: string;
  publishedAt: string;
}
