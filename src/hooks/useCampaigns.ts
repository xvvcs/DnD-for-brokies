import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import type { CampaignSummary } from '@/types/campaign';

/**
 * Hook to fetch all campaigns (summary view)
 */
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const campaigns = await db.campaigns.toArray();
      return campaigns.map(
        (camp): CampaignSummary => ({
          id: camp.id,
          name: camp.name,
          description: camp.description,
          characterCount: camp.characterIds.length,
          edition: camp.edition,
          updatedAt: camp.updatedAt,
        })
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
