/**
 * React Query Hooks Tests
 *
 * Tests for Open5E API React Query hooks covering:
 * - Hook rendering and data fetching
 * - Loading and error states
 * - Cache management
 * @module hooks/api/useOpen5e.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import {
  useDocuments,
  useClasses,
  useSpecies,
  useBackgrounds,
  useSpells,
  useEquipment,
  useConditions,
  useCacheStatus,
  useRefreshCache,
  useClearCache,
  queryKeys,
} from './useOpen5e';
import {
  fetchDocuments,
  fetchClasses,
  fetchSpecies,
  fetchBackgrounds,
  fetchSpells,
  fetchAllEquipment,
  fetchConditions,
} from '@/lib/api';
import type {
  Open5eDocument,
  Open5eClass,
  Open5eRace,
  Open5eBackground,
  Open5eSpell,
  Open5eCondition,
} from '@/types/open5e';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/lib/api', () => ({
  fetchDocuments: vi.fn(),
  fetchClasses: vi.fn(),
  fetchSpecies: vi.fn(),
  fetchBackgrounds: vi.fn(),
  fetchSpells: vi.fn(),
  fetchWeapons: vi.fn(),
  fetchArmor: vi.fn(),
  fetchItems: vi.fn(),
  fetchMagicItems: vi.fn(),
  fetchAllEquipment: vi.fn(),
  fetchConditions: vi.fn(),
  fetchSkills: vi.fn(),
  fetchLanguages: vi.fn(),
  fetchAllReferenceData: vi.fn(),
}));

// ============================================================================
// Test Helpers
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockDocument: Open5eDocument = {
  key: 'wotc-srd',
  name: "Wizards of the Coast's System Reference Document",
  url: 'https://api.open5e.com/v2/documents/wotc-srd/',
  desc: 'SRD',
  license_url: '',
  author: 'Wizards of the Coast',
  published_at: '2024-01-01',
};

const mockClass: Open5eClass = {
  key: 'fighter',
  name: 'Fighter',
  url: 'https://api.open5e.com/v2/classes/fighter/',
  document: 'wotc-srd',
  description: 'A master of martial combat',
  hit_dice: '1d10',
  hp_at_1st_level: '10 + your Constitution modifier',
  hp_at_higher_levels: '1d10 (or 6) + your Constitution modifier per Fighter level after 1st',
  prof_armor: 'All armor, shields',
  prof_weapons: 'Simple weapons, martial weapons',
  prof_tools: 'None',
  prof_saving_throws: ['STR', 'CON'],
  prof_skills:
    'Choose two from Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, and Survival',
  equipment: 'Chain mail and a longsword',
  spellcasting_ability: null,
  subtypes_name: 'Martial Archetype',
  archetypes: [],
  class_features: [],
};

const mockSpecies: Open5eRace = {
  key: 'human',
  name: 'Human',
  url: 'https://api.open5e.com/v2/races/human/',
  document: 'wotc-srd',
  description: 'Versatile and ambitious',
  speed: 30,
  size: 'medium',
  languages: ['Common'],
  language_desc: 'You can speak, read, and write Common',
  traits: [],
  subraces: [],
};

const mockBackground: Open5eBackground = {
  key: 'acolyte',
  name: 'Acolyte',
  url: 'https://api.open5e.com/v2/backgrounds/acolyte/',
  document: 'wotc-srd',
  description: 'You have spent your life in service to a temple',
  skill_proficiencies: ['Insight', 'Religion'],
  tool_proficiencies: [],
  languages: ['Two of your choice'],
  equipment: 'A holy symbol, a prayer book',
  feature: 'Shelter of the Faithful',
  feature_description: 'You can perform religious ceremonies',
  personality_traits: [],
  ideals: [],
  bonds: [],
  flaws: [],
};

const mockSpell: Open5eSpell = {
  key: 'fireball',
  name: 'Fireball',
  url: 'https://api.open5e.com/v2/spells/fireball/',
  document: 'wotc-srd',
  level: 3,
  school: 'evocation',
  casting_time: '1 action',
  range: '150 feet',
  duration: 'Instantaneous',
  concentration: false,
  ritual: false,
  components: ['V', 'S', 'M'],
  material: 'A tiny ball of bat guano and sulfur',
  desc: 'A bright streak flashes from your pointing finger',
  higher_levels: 'When you cast this spell using a spell slot of 4th level or higher',
  classes: ['Wizard', 'Sorcerer'],
  circles: null,
  archetypes: null,
};

const mockCondition: Open5eCondition = {
  key: 'blinded',
  name: 'Blinded',
  url: 'https://api.open5e.com/v2/conditions/blinded/',
  document: 'wotc-srd',
  description: "A blinded creature can't see",
};

// ============================================================================
// Tests
// ============================================================================

describe('React Query Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // --------------------------------------------------------------------------
  // useDocuments
  // --------------------------------------------------------------------------

  describe('useDocuments', () => {
    it('should fetch documents successfully', async () => {
      vi.mocked(fetchDocuments).mockResolvedValueOnce([mockDocument]);

      const { result } = renderHook(() => useDocuments(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockDocument]);
      expect(fetchDocuments).toHaveBeenCalledTimes(1);
    });

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch');
      vi.mocked(fetchDocuments).mockRejectedValue(error);

      const testClient = createTestQueryClient();
      const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={testClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useDocuments({ retry: false }), {
        wrapper: Wrapper,
      });

      // Wait for the error state
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 2000 }
      );

      expect(result.current.error?.message).toEqual(error.message);
    });
  });

  // --------------------------------------------------------------------------
  // useClasses
  // --------------------------------------------------------------------------

  describe('useClasses', () => {
    it('should fetch classes for document keys', async () => {
      vi.mocked(fetchClasses).mockResolvedValueOnce([mockClass]);

      const { result } = renderHook(() => useClasses(['wotc-srd']), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockClass]);
      expect(fetchClasses).toHaveBeenCalledWith(['wotc-srd']);
    });

    it('should be disabled when no document keys provided', async () => {
      vi.mocked(fetchClasses).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useClasses([]), {
        wrapper: createWrapper(),
      });

      // Should be disabled, not loading
      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should refetch when document keys change', async () => {
      vi.mocked(fetchClasses).mockResolvedValueOnce([mockClass]).mockResolvedValueOnce([]);

      const { result, rerender } = renderHook(({ keys }) => useClasses(keys), {
        wrapper: createWrapper(),
        initialProps: { keys: ['wotc-srd'] },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetchClasses).toHaveBeenCalledTimes(1);

      // Change document keys
      rerender({ keys: ['a5e'] });

      await waitFor(() => {
        expect(fetchClasses).toHaveBeenCalledTimes(2);
      });
    });
  });

  // --------------------------------------------------------------------------
  // useSpecies
  // --------------------------------------------------------------------------

  describe('useSpecies', () => {
    it('should fetch species for document keys', async () => {
      vi.mocked(fetchSpecies).mockResolvedValueOnce([mockSpecies]);

      const { result } = renderHook(() => useSpecies(['wotc-srd']), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockSpecies]);
    });

    it('should be disabled when no document keys provided', () => {
      vi.mocked(fetchSpecies).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useSpecies([]), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // useBackgrounds
  // --------------------------------------------------------------------------

  describe('useBackgrounds', () => {
    it('should fetch backgrounds for document keys', async () => {
      vi.mocked(fetchBackgrounds).mockResolvedValueOnce([mockBackground]);

      const { result } = renderHook(() => useBackgrounds(['wotc-srd']), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockBackground]);
    });
  });

  // --------------------------------------------------------------------------
  // useSpells
  // --------------------------------------------------------------------------

  describe('useSpells', () => {
    it('should fetch spells for document keys', async () => {
      vi.mocked(fetchSpells).mockResolvedValueOnce([mockSpell]);

      const { result } = renderHook(() => useSpells(['wotc-srd']), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockSpell]);
    });

    it('should pass filters to fetch function', async () => {
      vi.mocked(fetchSpells).mockResolvedValueOnce([mockSpell]);

      const filters = { level: 3, school: 'evocation' };
      const { result } = renderHook(() => useSpells(['wotc-srd'], filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetchSpells).toHaveBeenCalledWith(['wotc-srd'], filters);
    });
  });

  // --------------------------------------------------------------------------
  // useEquipment
  // --------------------------------------------------------------------------

  describe('useEquipment', () => {
    it('should fetch all equipment types', async () => {
      const mockEquipment = {
        weapons: [],
        armor: [],
        items: [],
        magicItems: [],
      };
      vi.mocked(fetchAllEquipment).mockResolvedValueOnce(mockEquipment);

      const { result } = renderHook(() => useEquipment(['wotc-srd']), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEquipment);
      expect(fetchAllEquipment).toHaveBeenCalledWith(['wotc-srd']);
    });
  });

  // --------------------------------------------------------------------------
  // useConditions
  // --------------------------------------------------------------------------

  describe('useConditions', () => {
    it('should fetch conditions', async () => {
      vi.mocked(fetchConditions).mockResolvedValueOnce([mockCondition]);

      const { result } = renderHook(() => useConditions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockCondition]);
    });
  });

  // --------------------------------------------------------------------------
  // useCacheStatus
  // --------------------------------------------------------------------------

  describe('useCacheStatus', () => {
    it('should check if query is cached', async () => {
      vi.mocked(fetchDocuments).mockResolvedValueOnce([mockDocument]);

      const { result: hookResult } = renderHook(
        () => {
          const query = useDocuments();
          const cache = useCacheStatus();
          return { query, cache };
        },
        { wrapper: createWrapper() }
      );

      // Initially not cached
      expect(hookResult.current.cache.isCached(queryKeys.documents)).toBe(false);

      // Wait for data to load
      await waitFor(() => {
        expect(hookResult.current.query.isSuccess).toBe(true);
      });

      // Now should be cached
      expect(hookResult.current.cache.isCached(queryKeys.documents)).toBe(true);
    });

    it('should return cached data', async () => {
      vi.mocked(fetchDocuments).mockResolvedValueOnce([mockDocument]);

      const { result: hookResult } = renderHook(
        () => {
          const query = useDocuments();
          const cache = useCacheStatus();
          return { query, cache };
        },
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(hookResult.current.query.isSuccess).toBe(true);
      });

      const cachedData = hookResult.current.cache.getCachedData<Open5eDocument[]>(
        queryKeys.documents
      );
      expect(cachedData).toEqual([mockDocument]);
    });
  });

  // --------------------------------------------------------------------------
  // useRefreshCache
  // --------------------------------------------------------------------------

  describe('useRefreshCache', () => {
    it('should refresh documents query', async () => {
      vi.mocked(fetchDocuments).mockResolvedValue([mockDocument]);

      const { result: hookResult } = renderHook(
        () => {
          const query = useDocuments();
          const refresh = useRefreshCache();
          return { query, refresh };
        },
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(hookResult.current.query.isSuccess).toBe(true);
      });

      expect(fetchDocuments).toHaveBeenCalledTimes(1);

      // Trigger refresh
      await hookResult.current.refresh.refreshDocuments();

      // Should have fetched at least once more after refresh
      await waitFor(() => {
        expect(vi.mocked(fetchDocuments).mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should refresh all queries', async () => {
      vi.mocked(fetchDocuments).mockResolvedValue([mockDocument]);
      vi.mocked(fetchConditions).mockResolvedValue([mockCondition]);

      const { result: hookResult } = renderHook(
        () => {
          const documents = useDocuments();
          const conditions = useConditions();
          const refresh = useRefreshCache();
          return { documents, conditions, refresh };
        },
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(hookResult.current.documents.isSuccess).toBe(true);
        expect(hookResult.current.conditions.isSuccess).toBe(true);
      });

      // Refresh all
      await hookResult.current.refresh.refreshAll();

      // Both should refetch
      await waitFor(() => {
        expect(fetchDocuments).toHaveBeenCalledTimes(2);
        expect(fetchConditions).toHaveBeenCalledTimes(2);
      });
    });
  });

  // --------------------------------------------------------------------------
  // useClearCache
  // --------------------------------------------------------------------------

  describe('useClearCache', () => {
    it('should clear specific query cache', async () => {
      vi.mocked(fetchDocuments).mockResolvedValueOnce([mockDocument]);

      const { result: hookResult } = renderHook(
        () => {
          const query = useDocuments();
          const cache = useCacheStatus();
          const clear = useClearCache();
          return { query, cache, clear };
        },
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(hookResult.current.query.isSuccess).toBe(true);
      });

      expect(hookResult.current.cache.isCached(queryKeys.documents)).toBe(true);

      // Clear cache
      hookResult.current.clear.clearDocuments();

      expect(hookResult.current.cache.isCached(queryKeys.documents)).toBe(false);
    });

    it('should clear all cache', async () => {
      vi.mocked(fetchDocuments).mockResolvedValue([mockDocument]);
      vi.mocked(fetchConditions).mockResolvedValue([mockCondition]);

      const { result: hookResult } = renderHook(
        () => {
          const documents = useDocuments();
          const conditions = useConditions();
          const cache = useCacheStatus();
          const clear = useClearCache();
          return { documents, conditions, cache, clear };
        },
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(hookResult.current.documents.isSuccess).toBe(true);
        expect(hookResult.current.conditions.isSuccess).toBe(true);
      });

      expect(hookResult.current.cache.isCached(queryKeys.documents)).toBe(true);
      expect(hookResult.current.cache.isCached(queryKeys.conditions)).toBe(true);

      // Clear all
      hookResult.current.clear.clearAll();

      expect(hookResult.current.cache.isCached(queryKeys.documents)).toBe(false);
      expect(hookResult.current.cache.isCached(queryKeys.conditions)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Query Keys
  // --------------------------------------------------------------------------

  describe('queryKeys', () => {
    it('should generate consistent query keys', () => {
      const keys1 = queryKeys.classes(['wotc-srd', 'a5e']);
      const keys2 = queryKeys.classes(['a5e', 'wotc-srd']);

      // Should be sorted, so same result regardless of order
      expect(keys1).toEqual(keys2);
    });

    it('should include filters in spell keys', () => {
      const filters = { level: 3, school: 'evocation' };
      const keys = queryKeys.spells(['wotc-srd'], filters);

      expect(keys).toContain('spells');
      expect(keys).toContain('wotc-srd');
      expect(keys).toContain(JSON.stringify(filters));
    });
  });
});
