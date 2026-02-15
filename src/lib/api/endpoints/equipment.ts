/**
 * Equipment Endpoints
 *
 * Fetches weapon, armor, and item data from the Open5E API.
 * Supports multi-document filtering and caching per document and type.
 * @module api/endpoints/equipment
 */

import type { Open5eItem, Open5eArmor, Open5eWeapon } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

// ============================================================================
// Weapons
// ============================================================================

/** API endpoint path for weapons */
const WEAPONS_ENDPOINT = 'weapons';

/**
 * Fetch weapons for a specific document.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of weapons from the specified document
 */
export async function fetchWeaponsByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eWeapon[]> {
  return open5eClient.fetchAllCached<Open5eWeapon>(
    WEAPONS_ENDPOINT,
    { document__key: documentKey },
    {
      documentKey,
      ttl: CACHE_TTL.content,
      forceRefresh,
    }
  );
}

/**
 * Fetch weapons from multiple documents and merge results.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of weapons
 */
export async function fetchWeapons(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eWeapon[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchWeaponsByDocument(key, forceRefresh))
  );

  return results.flat();
}

// ============================================================================
// Armor
// ============================================================================

/** API endpoint path for armor */
const ARMOR_ENDPOINT = 'armor';

/**
 * Fetch armor for a specific document.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of armor from the specified document
 */
export async function fetchArmorByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eArmor[]> {
  return open5eClient.fetchAllCached<Open5eArmor>(
    ARMOR_ENDPOINT,
    { document__key: documentKey },
    {
      documentKey,
      ttl: CACHE_TTL.content,
      forceRefresh,
    }
  );
}

/**
 * Fetch armor from multiple documents and merge results.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of armor
 */
export async function fetchArmor(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eArmor[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchArmorByDocument(key, forceRefresh))
  );

  return results.flat();
}

// ============================================================================
// Items (General Equipment)
// ============================================================================

/** API endpoint path for items */
const ITEMS_ENDPOINT = 'items';

/**
 * Fetch general items for a specific document.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of items from the specified document
 */
export async function fetchItemsByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eItem[]> {
  return open5eClient.fetchAllCached<Open5eItem>(
    ITEMS_ENDPOINT,
    { document__key: documentKey },
    {
      documentKey,
      ttl: CACHE_TTL.content,
      forceRefresh,
    }
  );
}

/**
 * Fetch items from multiple documents and merge results.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of items
 */
export async function fetchItems(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eItem[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchItemsByDocument(key, forceRefresh))
  );

  return results.flat();
}

// ============================================================================
// Magic Items
// ============================================================================

/** API endpoint path for magic items */
const MAGIC_ITEMS_ENDPOINT = 'magicitems';

/**
 * Fetch magic items for a specific document.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of magic items from the specified document
 */
export async function fetchMagicItemsByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eItem[]> {
  return open5eClient.fetchAllCached<Open5eItem>(
    MAGIC_ITEMS_ENDPOINT,
    { document__key: documentKey },
    {
      documentKey,
      ttl: CACHE_TTL.content,
      forceRefresh,
    }
  );
}

/**
 * Fetch magic items from multiple documents and merge results.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of magic items
 */
export async function fetchMagicItems(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eItem[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchMagicItemsByDocument(key, forceRefresh))
  );

  return results.flat();
}

// ============================================================================
// Combined Equipment Fetch
// ============================================================================

/** All equipment types combined */
export interface AllEquipment {
  weapons: Open5eWeapon[];
  armor: Open5eArmor[];
  items: Open5eItem[];
  magicItems: Open5eItem[];
}

/**
 * Fetch all equipment types for multiple documents.
 * Runs all requests in parallel for efficiency.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Object containing all equipment types
 */
export async function fetchAllEquipment(
  documentKeys: string[],
  forceRefresh = false
): Promise<AllEquipment> {
  const [weapons, armor, items, magicItems] = await Promise.all([
    fetchWeapons(documentKeys, forceRefresh),
    fetchArmor(documentKeys, forceRefresh),
    fetchItems(documentKeys, forceRefresh),
    fetchMagicItems(documentKeys, forceRefresh),
  ]);

  return { weapons, armor, items, magicItems };
}
