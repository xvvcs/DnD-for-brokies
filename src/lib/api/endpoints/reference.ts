/**
 * Reference Data Endpoints
 *
 * Fetches global reference data from the Open5E API:
 * conditions, skills, languages, damage types.
 * These are cached globally with long TTL since they rarely change.
 * @module api/endpoints/reference
 */

import type { Open5eCondition, Open5eSkill, Open5eLanguage } from '@/types/open5e';
import { open5eClient } from '../client';
import { CACHE_TTL } from '@/lib/db/schema';

// ============================================================================
// Conditions
// ============================================================================

/** API endpoint path for conditions */
const CONDITIONS_ENDPOINT = 'conditions';

/**
 * Fetch all conditions.
 * Results are cached globally with a 30-day TTL.
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of all conditions
 */
export async function fetchConditions(forceRefresh = false): Promise<Open5eCondition[]> {
  return open5eClient.fetchAllCached<Open5eCondition>(CONDITIONS_ENDPOINT, undefined, {
    documentKey: 'global',
    ttl: CACHE_TTL.reference,
    forceRefresh,
  });
}

// ============================================================================
// Skills
// ============================================================================

/** API endpoint path for skills */
const SKILLS_ENDPOINT = 'skills';

/**
 * Fetch all skills.
 * Results are cached globally with a 30-day TTL.
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of all skills
 */
export async function fetchSkills(forceRefresh = false): Promise<Open5eSkill[]> {
  return open5eClient.fetchAllCached<Open5eSkill>(SKILLS_ENDPOINT, undefined, {
    documentKey: 'global',
    ttl: CACHE_TTL.reference,
    forceRefresh,
  });
}

// ============================================================================
// Languages
// ============================================================================

/** API endpoint path for languages */
const LANGUAGES_ENDPOINT = 'languages';

/**
 * Fetch all languages.
 * Results are cached globally with a 30-day TTL.
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of all languages
 */
export async function fetchLanguages(forceRefresh = false): Promise<Open5eLanguage[]> {
  return open5eClient.fetchAllCached<Open5eLanguage>(LANGUAGES_ENDPOINT, undefined, {
    documentKey: 'global',
    ttl: CACHE_TTL.reference,
    forceRefresh,
  });
}

// ============================================================================
// Damage Types
// ============================================================================

/** Damage type from the Open5E API */
export interface Open5eDamageType {
  key: string;
  name: string;
  url: string;
  document: string;
  description: string;
}

/** API endpoint path for damage types */
const DAMAGE_TYPES_ENDPOINT = 'damagetypes';

/**
 * Fetch all damage types.
 * Results are cached globally with a 30-day TTL.
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Array of all damage types
 */
export async function fetchDamageTypes(forceRefresh = false): Promise<Open5eDamageType[]> {
  return open5eClient.fetchAllCached<Open5eDamageType>(DAMAGE_TYPES_ENDPOINT, undefined, {
    documentKey: 'global',
    ttl: CACHE_TTL.reference,
    forceRefresh,
  });
}

// ============================================================================
// Combined Reference Data
// ============================================================================

/** All reference data combined */
export interface AllReferenceData {
  conditions: Open5eCondition[];
  skills: Open5eSkill[];
  languages: Open5eLanguage[];
  damageTypes: Open5eDamageType[];
}

/**
 * Fetch all reference data in parallel.
 * @param forceRefresh Skip cache and fetch fresh data
 * @returns Object containing all reference data types
 */
export async function fetchAllReferenceData(forceRefresh = false): Promise<AllReferenceData> {
  const [conditions, skills, languages, damageTypes] = await Promise.all([
    fetchConditions(forceRefresh),
    fetchSkills(forceRefresh),
    fetchLanguages(forceRefresh),
    fetchDamageTypes(forceRefresh),
  ]);

  return { conditions, skills, languages, damageTypes };
}
