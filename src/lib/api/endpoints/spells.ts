/**
 * Spells Endpoint
 *
 * Fetches spell data from the Open5E API.
 * Supports filtering by level, school, class, and document.
 * Handles large datasets with pagination.
 * @module api/endpoints/spells
 */

import type { Open5eSpell } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

/** API endpoint path for spells */
const ENDPOINT = 'spells';

/** Filter options for spell queries */
export interface SpellFilters {
  /** Filter by spell level (0-9, where 0 = cantrip) */
  level?: number;
  /** Filter by spell school (e.g., "evocation", "abjuration") */
  school?: string;
  /** Search by name */
  search?: string;
  /** Filter by class name */
  className?: string;
  /** Whether the spell requires concentration */
  concentration?: boolean;
  /** Whether the spell can be cast as a ritual */
  ritual?: boolean;
  /** Ordering field */
  ordering?: string;
}

/**
 * Build query parameters from spell filters.
 */
function buildSpellParams(
  documentKey: string | undefined,
  filters?: SpellFilters
): Record<string, string | number | boolean | undefined> {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (documentKey) {
    params.document__key = documentKey;
  }

  if (filters) {
    if (filters.level !== undefined) {
      params.spell_level = filters.level;
    }
    if (filters.school) {
      params.school = filters.school;
    }
    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.concentration !== undefined) {
      params.concentration = filters.concentration;
    }
    if (filters.ritual !== undefined) {
      params.ritual = filters.ritual;
    }
    if (filters.ordering) {
      params.ordering = filters.ordering;
    }
  }

  return params;
}

/**
 * Fetch spells for a specific document.
 * Results are cached per document with a 7-day TTL.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param filters Optional spell filters
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of spells from the specified document
 */
export async function fetchSpellsByDocument(
  documentKey: string,
  filters?: SpellFilters,
  forceRefresh = false
): Promise<Open5eSpell[]> {
  const params = buildSpellParams(documentKey, filters);

  return open5eClient.fetchAllCached<Open5eSpell>(ENDPOINT, params, {
    documentKey,
    ttl: CACHE_TTL.spells,
    forceRefresh,
  });
}

/**
 * Fetch spells from multiple documents with optional filters.
 * @param documentKeys Array of document keys
 * @param filters Optional spell filters (applied to each document query)
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of spells from all specified documents
 */
export async function fetchSpells(
  documentKeys: string[],
  filters?: SpellFilters,
  forceRefresh = false
): Promise<Open5eSpell[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchSpellsByDocument(key, filters, forceRefresh))
  );

  return results.flat();
}

/**
 * Fetch a single spell by key.
 * @param key Spell key (e.g., "fireball", "cure-wounds")
 * @returns The spell or null if not found
 */
export async function fetchSpell(key: string): Promise<Open5eSpell | null> {
  try {
    return await open5eClient.fetchCached<Open5eSpell>(`${ENDPOINT}/${key}`, undefined, {
      documentKey: 'global',
      ttl: CACHE_TTL.spells,
    });
  } catch {
    return null;
  }
}

/**
 * Filter spells by class name (client-side filtering).
 * Used after fetching all spells to filter by a specific class.
 * @param spells Array of spells to filter
 * @param className Class name to filter by (e.g., "Wizard", "Cleric")
 * @returns Spells available to the specified class
 */
export function filterSpellsByClass(spells: Open5eSpell[], className: string): Open5eSpell[] {
  const lowerClassName = className.toLowerCase();
  return spells.filter((spell) =>
    spell.classes.some((cls) => cls.toLowerCase() === lowerClassName)
  );
}

/**
 * Group spells by level for display.
 * @param spells Array of spells to group
 * @returns Map of spell level to array of spells (0 = cantrips)
 */
export function groupSpellsByLevel(spells: Open5eSpell[]): Map<number, Open5eSpell[]> {
  const grouped = new Map<number, Open5eSpell[]>();

  for (const spell of spells) {
    const level = spell.level;
    const existing = grouped.get(level) ?? [];
    existing.push(spell);
    grouped.set(level, existing);
  }

  // Sort spells within each level by name
  for (const [level, levelSpells] of grouped) {
    grouped.set(
      level,
      levelSpells.sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  return grouped;
}
