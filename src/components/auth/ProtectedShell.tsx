'use client';

import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { checkAndSetOwner } from '@/lib/auth/owner';
import { LoginPage } from './LoginPage';
import { AccessDeniedPage } from './AccessDeniedPage';

interface ProtectedShellProps {
  children: React.ReactNode;
}

type OwnerStatus = 'checking' | 'allowed' | 'denied';

export function ProtectedShell({ children }: ProtectedShellProps): React.ReactElement {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const [ownerStatus, setOwnerStatus] = useState<OwnerStatus>('checking');

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) return;
    let cancelled = false;
    checkAndSetOwner(user.sub).then((allowed) => {
      if (!cancelled) setOwnerStatus(allowed ? 'allowed' : 'denied');
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.sub]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10 border-2 border-primary animate-pulse">
            <span className="text-primary text-2xl">⚔</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (ownerStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10 border-2 border-primary animate-pulse">
            <span className="text-primary text-2xl">⚔</span>
          </div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (ownerStatus === 'denied') {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
