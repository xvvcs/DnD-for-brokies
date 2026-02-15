import { useQuery } from '@tanstack/react-query';

/**
 * Generic hook for Open5E API queries
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useOpen5e<T>(_endpoint: string, _params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['open5e', _endpoint, _params],
    queryFn: async () => {
      // Implementation to be added in Phase 1
      throw new Error('Not implemented');
    },
    staleTime: 60 * 60 * 1000, // 1 hour - Open5E data is static
  });
}
