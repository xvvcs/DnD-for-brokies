'use client';

import { ShieldX } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';

export function AccessDeniedPage(): React.ReactElement {
  const { logout } = useAuth0();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-destructive/10 border-2 border-destructive/30">
          <ShieldX className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl font-bold text-foreground mb-4">
          Access denied
        </h1>
        <p className="text-muted-foreground mb-8">
          This app is locked to the account that first set it up. Only that account can access it.
          Please log out and contact the app owner if you need access.
        </p>
        <Button
          variant="outline"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
