/**
 * useUnsavedChangesGuard
 *
 * Warns the user when they try to leave the page with unsaved changes.
 * Uses beforeunload for refresh/close; does not intercept in-app navigation.
 */

import { useEffect } from 'react';

export function useUnsavedChangesGuard(hasUnsavedChanges: boolean): void {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);
}
