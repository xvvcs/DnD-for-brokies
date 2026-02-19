/**
 * Character View Client
 *
 * Client component that reads the character ID from the URL query param
 * and renders the character sheet. Used by /characters/view for static export
 * compatibility (searchParams in server components opts into dynamic rendering).
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { CharacterSheetClient } from './CharacterSheetClient';

export function CharacterViewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id')?.trim();

  useEffect(() => {
    if (searchParams !== null && (!id || id === '')) {
      router.replace('/');
    }
  }, [searchParams, id, router]);

  if (searchParams === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!id || id === '') {
    return null;
  }

  return <CharacterSheetClient characterId={id} />;
}
