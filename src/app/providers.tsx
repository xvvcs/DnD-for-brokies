'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Auth0ProviderClient } from '@/components/auth/Auth0ProviderClient';
import { ProtectedShell } from '@/components/auth/ProtectedShell';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <Auth0ProviderClient>
          <ProtectedShell>{children}</ProtectedShell>
        </Auth0ProviderClient>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
