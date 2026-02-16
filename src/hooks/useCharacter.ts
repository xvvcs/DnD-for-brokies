import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCharacter, updateCharacter } from '@/lib/db/characters';
import type { CharacterUpdate } from '@/types/character';

/**
 * Query key for character queries
 */
export const characterKeys = {
  all: ['characters'] as const,
  detail: (id: string) => ['character', id] as const,
};

/**
 * Hook to fetch a single character by ID
 */
export function useCharacter(id: string | null) {
  return useQuery({
    queryKey: characterKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null;
      return getCharacter(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update a character with auto-save functionality
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: CharacterUpdate }) => {
      const updated = await updateCharacter(id, changes);
      if (!updated) {
        throw new Error(`Character with id ${id} not found`);
      }
      return updated;
    },
    onSuccess: (updatedCharacter) => {
      // Update the cache with the new data
      queryClient.setQueryData(characterKeys.detail(updatedCharacter.id), updatedCharacter);
      // Invalidate the characters list to reflect changes
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });
}
