import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

/**
 * Hook to fetch a single character by ID
 */
export function useCharacter(id: string | null) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      if (!id) return null;
      return db.characters.get(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
