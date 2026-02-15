/**
 * React Query Hooks for Open5E API
 *
 * Custom hooks for fetching and caching Open5E API data.
 * Each hook handles loading, error, and cached states.
 * @module hooks/api
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import type {
  Open5eDocument,
  Open5eClass,
  Open5eRace,
  Open5eBackground,
  Open5eSpell,
  Open5eWeapon,
  Open5eArmor,
  Open5eItem,
  Open5eCondition,
  Open5eSkill,
  Open5eLanguage,
} from '@/types/open5e';
import type { SpellFilters } from '@/lib/api/endpoints/spells';
import {
  fetchDocuments,
  fetchClasses,
  fetchSpecies,
  fetchBackgrounds,
  fetchSpells,
  fetchWeapons,
  fetchArmor,
  fetchItems,
  fetchMagicItems,
  fetchConditions,
  fetchSkills,
  fetchLanguages,
  fetchAllEquipment,
  fetchAllReferenceData,
} from '@/lib/api';
import { useCallback } from 'react';

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  documents: ['documents'] as const,
  document: (key: string) => ['documents', key] as const,
  classes: (documentKeys: string[]) => ['classes', ...documentKeys.sort()] as const,
  class: (key: string) => ['class', key] as const,
  species: (documentKeys: string[]) => ['species', ...documentKeys.sort()] as const,
  singleSpecies: (key: string) => ['species', key] as const,
  backgrounds: (documentKeys: string[]) => ['backgrounds', ...documentKeys.sort()] as const,
  background: (key: string) => ['background', key] as const,
  spells: (documentKeys: string[], filters?: SpellFilters) =>
    ['spells', ...documentKeys.sort(), JSON.stringify(filters)] as const,
  spell: (key: string) => ['spell', key] as const,
  weapons: (documentKeys: string[]) => ['weapons', ...documentKeys.sort()] as const,
  armor: (documentKeys: string[]) => ['armor', ...documentKeys.sort()] as const,
  items: (documentKeys: string[]) => ['items', ...documentKeys.sort()] as const,
  magicItems: (documentKeys: string[]) => ['magicItems', ...documentKeys.sort()] as const,
  equipment: (documentKeys: string[]) => ['equipment', ...documentKeys.sort()] as const,
  conditions: ['conditions'] as const,
  skills: ['skills'] as const,
  languages: ['languages'] as const,
  reference: ['reference'] as const,
};

// ============================================================================
// Default Query Options
// ============================================================================

const STALE_TIME = 60 * 60 * 1000; // 1 hour - Open5E data is static
const GC_TIME = 24 * 60 * 60 * 1000; // 24 hours
const RETRY_DELAY = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000);

// ============================================================================
// Document Hooks
// ============================================================================

/**
 * Hook to fetch all available documents/rulebooks
 * @param options Optional query options
 * @returns Query result with documents array
 */
export function useDocuments(options?: Partial<UseQueryOptions<Open5eDocument[]>>) {
  return useQuery<Open5eDocument[]>({
    queryKey: queryKeys.documents,
    queryFn: () => fetchDocuments(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Class Hooks
// ============================================================================

/**
 * Hook to fetch classes for selected documents
 * @param documentKeys Array of document keys to fetch classes from
 * @param options Optional query options
 * @returns Query result with classes array
 */
export function useClasses(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<Open5eClass[]>>
) {
  return useQuery<Open5eClass[]>({
    queryKey: queryKeys.classes(documentKeys),
    queryFn: () => fetchClasses(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Species (Races) Hooks
// ============================================================================

/**
 * Hook to fetch species for selected documents
 * @param documentKeys Array of document keys to fetch species from
 * @param options Optional query options
 * @returns Query result with species array
 */
export function useSpecies(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<Open5eRace[]>>
) {
  return useQuery<Open5eRace[]>({
    queryKey: queryKeys.species(documentKeys),
    queryFn: () => fetchSpecies(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Background Hooks
// ============================================================================

/**
 * Hook to fetch backgrounds for selected documents
 * @param documentKeys Array of document keys to fetch backgrounds from
 * @param options Optional query options
 * @returns Query result with backgrounds array
 */
export function useBackgrounds(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<Open5eBackground[]>>
) {
  return useQuery<Open5eBackground[]>({
    queryKey: queryKeys.backgrounds(documentKeys),
    queryFn: () => fetchBackgrounds(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Spell Hooks
// ============================================================================

/**
 * Hook to fetch spells for selected documents with optional filters
 * @param documentKeys Array of document keys to fetch spells from
 * @param filters Optional spell filters (level, school, search, etc.)
 * @param options Optional query options
 * @returns Query result with spells array
 */
export function useSpells(
  documentKeys: string[],
  filters?: SpellFilters,
  options?: Partial<UseQueryOptions<Open5eSpell[]>>
) {
  return useQuery<Open5eSpell[]>({
    queryKey: queryKeys.spells(documentKeys, filters),
    queryFn: () => fetchSpells(documentKeys, filters),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Equipment Hooks
// ============================================================================

interface EquipmentData {
  weapons: Open5eWeapon[];
  armor: Open5eArmor[];
  items: Open5eItem[];
  magicItems: Open5eItem[];
}

/**
 * Hook to fetch weapons for selected documents
 * @param documentKeys Array of document keys to fetch weapons from
 * @param options Optional query options
 * @returns Query result with weapons array
 */
export function useWeapons(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<Open5eWeapon[]>>
) {
  return useQuery<Open5eWeapon[]>({
    queryKey: queryKeys.weapons(documentKeys),
    queryFn: () => fetchWeapons(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

/**
 * Hook to fetch armor for selected documents
 * @param documentKeys Array of document keys to fetch armor from
 * @param options Optional query options
 * @returns Query result with armor array
 */
export function useArmor(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<Open5eArmor[]>>
) {
  return useQuery<Open5eArmor[]>({
    queryKey: queryKeys.armor(documentKeys),
    queryFn: () => fetchArmor(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

/**
 * Hook to fetch items for selected documents
 * @param documentKeys Array of document keys to fetch items from
 * @param options Optional query options
 * @returns Query result with items array
 */
export function useItems(documentKeys: string[], options?: Partial<UseQueryOptions<Open5eItem[]>>) {
  return useQuery<Open5eItem[]>({
    queryKey: queryKeys.items(documentKeys),
    queryFn: () => fetchItems(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

/**
 * Hook to fetch magic items for selected documents
 * @param documentKeys Array of document keys to fetch magic items from
 * @param options Optional query options
 * @returns Query result with magic items array
 */
export function useMagicItems(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<Open5eItem[]>>
) {
  return useQuery<Open5eItem[]>({
    queryKey: queryKeys.magicItems(documentKeys),
    queryFn: () => fetchMagicItems(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

/**
 * Hook to fetch all equipment (weapons, armor, items, magic items) for selected documents
 * @param documentKeys Array of document keys to fetch equipment from
 * @param options Optional query options
 * @returns Query result with all equipment
 */
export function useEquipment(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<EquipmentData>>
) {
  return useQuery<EquipmentData>({
    queryKey: queryKeys.equipment(documentKeys),
    queryFn: () => fetchAllEquipment(documentKeys),
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Reference Data Hooks
// ============================================================================

/**
 * Hook to fetch all conditions
 * @param options Optional query options
 * @returns Query result with conditions array
 */
export function useConditions(options?: Partial<UseQueryOptions<Open5eCondition[]>>) {
  return useQuery<Open5eCondition[]>({
    queryKey: queryKeys.conditions,
    queryFn: () => fetchConditions(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

/**
 * Hook to fetch all skills
 * @param options Optional query options
 * @returns Query result with skills array
 */
export function useSkills(options?: Partial<UseQueryOptions<Open5eSkill[]>>) {
  return useQuery<Open5eSkill[]>({
    queryKey: queryKeys.skills,
    queryFn: () => fetchSkills(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

/**
 * Hook to fetch all languages
 * @param options Optional query options
 * @returns Query result with languages array
 */
export function useLanguages(options?: Partial<UseQueryOptions<Open5eLanguage[]>>) {
  return useQuery<Open5eLanguage[]>({
    queryKey: queryKeys.languages,
    queryFn: () => fetchLanguages(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

interface ReferenceData {
  conditions: Open5eCondition[];
  skills: Open5eSkill[];
  languages: Open5eLanguage[];
  damageTypes: { key: string; name: string; url: string; document: string; description: string }[];
}

/**
 * Hook to fetch all reference data (conditions, skills, languages, damage types)
 * @param options Optional query options
 * @returns Query result with all reference data
 */
export function useReferenceData(options?: Partial<UseQueryOptions<ReferenceData>>) {
  return useQuery<ReferenceData>({
    queryKey: queryKeys.reference,
    queryFn: () => fetchAllReferenceData(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Combined Data Hook
// ============================================================================

export interface AllOpen5eData {
  documents: Open5eDocument[];
  classes: Open5eClass[];
  species: Open5eRace[];
  backgrounds: Open5eBackground[];
  spells: Open5eSpell[];
  weapons: Open5eWeapon[];
  armor: Open5eArmor[];
  items: Open5eItem[];
  magicItems: Open5eItem[];
  conditions: Open5eCondition[];
  skills: Open5eSkill[];
  languages: Open5eLanguage[];
}

/**
 * Hook to fetch all Open5E data for selected documents
 * Useful for character creation when you need everything at once
 * @param documentKeys Array of document keys to fetch data from
 * @param options Optional query options
 * @returns Query result with all Open5E data
 */
export function useAllOpen5eData(
  documentKeys: string[],
  options?: Partial<UseQueryOptions<AllOpen5eData>>
) {
  return useQuery<AllOpen5eData>({
    queryKey: ['allOpen5e', ...documentKeys.sort()],
    queryFn: async () => {
      const [documents, classes, species, backgrounds, spells, equipment, reference] =
        await Promise.all([
          fetchDocuments(),
          fetchClasses(documentKeys),
          fetchSpecies(documentKeys),
          fetchBackgrounds(documentKeys),
          fetchSpells(documentKeys),
          fetchAllEquipment(documentKeys),
          fetchAllReferenceData(),
        ]);

      return {
        documents,
        classes,
        species,
        backgrounds,
        spells,
        weapons: equipment.weapons,
        armor: equipment.armor,
        items: equipment.items,
        magicItems: equipment.magicItems,
        conditions: reference.conditions,
        skills: reference.skills,
        languages: reference.languages,
      };
    },
    enabled: documentKeys.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
    retryDelay: RETRY_DELAY,
    ...options,
  });
}

// ============================================================================
// Cache Management Hooks
// ============================================================================

/**
 * Hook to get cache status and provide cache management functions
 * @returns Object with cache status and management functions
 */
export function useCacheStatus() {
  const queryClient = useQueryClient();

  const isCached = useCallback(
    (queryKey: readonly string[]) => {
      return queryClient.getQueryData(queryKey) !== undefined;
    },
    [queryClient]
  );

  const getCachedData = useCallback(
    <T>(queryKey: readonly string[]) => {
      return queryClient.getQueryData<T>(queryKey);
    },
    [queryClient]
  );

  const getQueryState = useCallback(
    (queryKey: readonly string[]) => {
      return queryClient.getQueryState(queryKey);
    },
    [queryClient]
  );

  return {
    isCached,
    getCachedData,
    getQueryState,
  };
}

/**
 * Hook to refresh cached data
 * @returns Object with refresh functions
 */
export function useRefreshCache() {
  const queryClient = useQueryClient();

  const refreshQuery = useCallback(
    async (queryKey: readonly string[]) => {
      await queryClient.invalidateQueries({ queryKey });
      return queryClient.refetchQueries({ queryKey });
    },
    [queryClient]
  );

  const refreshDocuments = useCallback(() => {
    return refreshQuery(queryKeys.documents);
  }, [refreshQuery]);

  const refreshClasses = useCallback(
    (documentKeys: string[]) => {
      return refreshQuery(queryKeys.classes(documentKeys));
    },
    [refreshQuery]
  );

  const refreshSpecies = useCallback(
    (documentKeys: string[]) => {
      return refreshQuery(queryKeys.species(documentKeys));
    },
    [refreshQuery]
  );

  const refreshBackgrounds = useCallback(
    (documentKeys: string[]) => {
      return refreshQuery(queryKeys.backgrounds(documentKeys));
    },
    [refreshQuery]
  );

  const refreshSpells = useCallback(
    (documentKeys: string[], filters?: SpellFilters) => {
      return refreshQuery(queryKeys.spells(documentKeys, filters));
    },
    [refreshQuery]
  );

  const refreshAll = useCallback(() => {
    return queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    refreshQuery,
    refreshDocuments,
    refreshClasses,
    refreshSpecies,
    refreshBackgrounds,
    refreshSpells,
    refreshAll,
  };
}

/**
 * Hook to clear cached data
 * @returns Object with clear functions
 */
export function useClearCache() {
  const queryClient = useQueryClient();

  const clearQuery = useCallback(
    (queryKey: readonly string[]) => {
      queryClient.removeQueries({ queryKey });
    },
    [queryClient]
  );

  const clearDocuments = useCallback(() => {
    clearQuery(queryKeys.documents);
  }, [clearQuery]);

  const clearClasses = useCallback(
    (documentKeys: string[]) => {
      clearQuery(queryKeys.classes(documentKeys));
    },
    [clearQuery]
  );

  const clearSpecies = useCallback(
    (documentKeys: string[]) => {
      clearQuery(queryKeys.species(documentKeys));
    },
    [clearQuery]
  );

  const clearBackgrounds = useCallback(
    (documentKeys: string[]) => {
      clearQuery(queryKeys.backgrounds(documentKeys));
    },
    [clearQuery]
  );

  const clearSpells = useCallback(
    (documentKeys: string[], filters?: SpellFilters) => {
      clearQuery(queryKeys.spells(documentKeys, filters));
    },
    [clearQuery]
  );

  const clearAll = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  return {
    clearQuery,
    clearDocuments,
    clearClasses,
    clearSpecies,
    clearBackgrounds,
    clearSpells,
    clearAll,
  };
}
