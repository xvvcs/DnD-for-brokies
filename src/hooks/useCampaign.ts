import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

/**
 * Hook to fetch a single campaign by ID
 */
export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!id) return null;
      return db.campaigns.get(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
