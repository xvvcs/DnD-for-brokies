/**
 * Species (Races) Endpoint
 *
 * Fetches species/race data from the Open5E API.
 * Handles subspecies relationships and caching per document key.
 * @module api/endpoints/species
 */

import type { Open5eRace } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

/** API endpoint path for species (Open5E v2 uses "species", not "races") */
const ENDPOINT = 'species';

/**
 * Fetch species for a specific document.
 * Results are cached per document with a 7-day TTL.
 * @param documentKey Document key (e.g., "wotc-srd")
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of species from the specified document
 */
export async function fetchSpeciesByDocument(
  documentKey: string,
  forceRefresh = false
): Promise<Open5eRace[]> {
  return open5eClient.fetchAllCached<Open5eRace>(
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
 * Fetch species from multiple documents and merge results.
 * @param documentKeys Array of document keys
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Merged array of species from all specified documents
 */
export async function fetchSpecies(
  documentKeys: string[],
  forceRefresh = false
): Promise<Open5eRace[]> {
  const results = await Promise.all(
    documentKeys.map((key) => fetchSpeciesByDocument(key, forceRefresh))
  );

  return results.flat();
}

/**
 * Fetch a single species by key.
 * @param key Species key (e.g., "elf", "dwarf")
 * @returns The species or null if not found
 */
export async function fetchSingleSpecies(key: string): Promise<Open5eRace | null> {
  try {
    return await open5eClient.fetchCached<Open5eRace>(`${ENDPOINT}/${key}`, undefined, {
      documentKey: 'global',
      ttl: CACHE_TTL.content,
    });
  } catch {
    return null;
  }
}

/**
 * Get species with their subspecies flattened for selection UI.
 * Each subspecies is returned as a separate entry with parent info.
 * @param species Array of species to flatten
 * @returns Flattened array of species options including subspecies
 */
export function flattenSpeciesWithSubspecies(species: Open5eRace[]): SpeciesOption[] {
  const options: SpeciesOption[] = [];

  for (const race of species) {
    // Add the base species
    options.push({
      key: race.key,
      name: race.name,
      parentKey: null,
      parentName: null,
      speed: race.speed,
      size: race.size,
      traits: race.traits,
      languages: race.languages,
    });

    // Add subspecies as separate entries
    for (const subrace of race.subraces) {
      options.push({
        key: subrace.key,
        name: subrace.name,
        parentKey: race.key,
        parentName: race.name,
        speed: race.speed,
        size: race.size,
        traits: [...race.traits, ...subrace.traits],
        languages: race.languages,
      });
    }
  }

  return options;
}

/** Flattened species option for selection UI */
export interface SpeciesOption {
  key: string;
  name: string;
  parentKey: string | null;
  parentName: string | null;
  speed: number;
  size: string;
  traits: Array<{ name: string; description: string }>;
  languages: string[];
}
