'use client';

import { Auth0Provider } from '@auth0/auth0-react';

interface Auth0ProviderClientProps {
  children: React.ReactNode;
}

export function Auth0ProviderClient({ children }: Auth0ProviderClientProps): React.ReactElement {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

  if (!domain || !clientId) {
    throw new Error(
      'Auth0 is not configured. Set NEXT_PUBLIC_AUTH0_DOMAIN and NEXT_PUBLIC_AUTH0_CLIENT_ID in .env.local. See the Auth0 setup checklist in the plan.'
    );
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
      }}
    >
      {children}
    </Auth0Provider>
  );
}
