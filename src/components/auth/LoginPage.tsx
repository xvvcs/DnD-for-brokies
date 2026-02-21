'use client';

import { Shield } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';

export function LoginPage(): React.ReactElement {
  const { loginWithRedirect, isLoading, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10 border-2 border-primary animate-pulse">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-lg border-2 border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium mb-2">Authentication error</p>
          <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
          <Button onClick={() => loginWithRedirect()} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-primary/10 border-2 border-primary">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-foreground mb-4">
          DnDnB
        </h1>
        <p className="text-muted-foreground mb-8">
          Sign in to access your D&D character manager. Create an account or log in with Auth0.
        </p>
        <Button
          size="lg"
          className="font-[family-name:var(--font-cinzel)] text-lg px-8"
          onClick={() => loginWithRedirect()}
        >
          Log in
        </Button>
      </div>
    </div>
  );
}
