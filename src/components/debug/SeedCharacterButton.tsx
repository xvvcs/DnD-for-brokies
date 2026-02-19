/**
 * SeedCharacterButton
 *
 * Client component that writes a mock character into IndexedDB and then
 * navigates to its live character sheet. Used only in the dev/debug section
 * of the home page.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCharacter } from '@/lib/db/characters';
import { characterSheetUrl } from '@/lib/routes';
import { mockCharacter, mockSpellcaster } from '@/lib/debug/mockCharacters';
import { Button } from '@/components/ui/button';
import type { Character } from '@/types/character';

interface SeedCharacterButtonProps {
  /** Which mock to seed */
  variant: 'fighter' | 'wizard';
  className?: string;
}

export function SeedCharacterButton({ variant, className }: SeedCharacterButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const label = variant === 'fighter' ? 'Fighter (Level 5)' : 'Wizard (Level 5)';

  const handleClick = async () => {
    setStatus('loading');
    try {
      const template: Character = variant === 'fighter' ? mockCharacter : mockSpellcaster;

      // Strip the fixed debug ID / timestamps so createCharacter assigns fresh ones.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = template;
      const seeded = await createCharacter({
        ...rest,
        name: `${rest.name} (test ${new Date().toLocaleTimeString()})`,
      });

      router.push(characterSheetUrl(seeded.id));
    } catch (err) {
      console.error('Failed to seed character:', err);
      setStatus('error');
    }
  };

  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => void handleClick()}
      disabled={status === 'loading'}
    >
      {status === 'loading'
        ? 'Creating…'
        : status === 'error'
          ? 'Error – try again'
          : `Load ${label} into DB`}
    </Button>
  );
}
