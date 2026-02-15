/**
 * API React Query Hooks
 *
 * Custom hooks for fetching and caching Open5E API data using React Query.
 * @module hooks/api
 */

export {
  // Query keys for external use
  queryKeys,

  // Document hooks
  useDocuments,

  // Class hooks
  useClasses,

  // Species hooks
  useSpecies,

  // Background hooks
  useBackgrounds,

  // Spell hooks
  useSpells,

  // Equipment hooks
  useWeapons,
  useArmor,
  useItems,
  useMagicItems,
  useEquipment,

  // Reference data hooks
  useConditions,
  useSkills,
  useLanguages,
  useReferenceData,

  // Combined data hook
  useAllOpen5eData,
  type AllOpen5eData,

  // Cache management hooks
  useCacheStatus,
  useRefreshCache,
  useClearCache,
} from './useOpen5e';
