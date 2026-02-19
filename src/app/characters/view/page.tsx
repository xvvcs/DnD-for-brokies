/**
 * Character Sheet View Page (Static)
 *
 * Renders the character sheet for live DB characters. The ID is read from
 * the URL query param (?id=xxx) by CharacterViewClient. This page does NOT
 * use searchParams, so it stays statically renderable with output: 'export'.
 */

import { Suspense } from 'react';

import { CharacterViewClient } from '@/components/character-sheet/CharacterViewClient';

export default function CharacterViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground animate-pulse">Loading…</div>
        </div>
      }
    >
      <CharacterViewClient />
    </Suspense>
  );
}
