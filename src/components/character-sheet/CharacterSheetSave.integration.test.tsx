/**
 * Character Sheet Save Integration Tests
 *
 * Verifies that character sheet field changes persist to IndexedDB via the
 * full flow: UI → handleUpdate → useAutoSave → updateCharacter → DB.
 * Uses real fake-indexeddb (no mocks) to catch integration issues.
 * @module character-sheet/CharacterSheetSave.integration.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';

import { db } from '@/lib/db';
import { createCharacter } from '@/lib/db/characters';
import type { CharacterTableEntry } from '@/lib/db/schema';
import React, { useEffect } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCharacterStore } from '@/stores/characterStore';
import { mockCharacter } from '@/lib/debug/mockCharacters';
import type { Character, CharacterUpdate } from '@/types/character';

const mockUseCharacter = vi.fn();
vi.mock('@/hooks/useCharacter', () => ({
  useCharacter: (id: string | null) => mockUseCharacter(id),
}));

/** Workaround for fake-indexeddb get() limitation */
async function getCharacterById(id: string): Promise<CharacterTableEntry | undefined> {
  const all = await db.characters.toArray();
  return all.find((c) => c.id === id);
}

// ============================================================================
// Test Harness Component
// ============================================================================

/**
 * Minimal component that replicates the LiveCharacterSheet save flow:
 * useCharacter + useAutoSave + useCharacterStore + handleUpdate.
 */
function SaveTestHarness({ characterId }: { characterId: string }) {
  const { data: loadedCharacter, isLoading } = mockUseCharacter(characterId);
  const { draft, setOriginal, updateDraft, markSaved } = useCharacterStore();
  const { save } = useAutoSave({
    characterId,
    delay: 50,
    onSave: () => markSaved(),
  });

  useEffect(() => {
    if (loadedCharacter) setOriginal(loadedCharacter);
  }, [loadedCharacter, setOriginal]);

  const handleUpdate = (patch: Partial<Character>) => {
    updateDraft(patch as CharacterUpdate);
    void save(patch as CharacterUpdate);
  };

  if (isLoading || !loadedCharacter) {
    return <div>Loading…</div>;
  }

  const character = (draft as Character | null) ?? loadedCharacter;

  return (
    <div>
      <label htmlFor="name-input">Character Name</label>
      <input
        id="name-input"
        data-testid="name-input"
        value={character.name}
        onChange={(e) => handleUpdate({ name: e.target.value })}
      />
      <label htmlFor="hp-input">Current HP</label>
      <input
        id="hp-input"
        data-testid="hp-input"
        type="number"
        value={character.combat.currentHp}
        onChange={(e) =>
          handleUpdate({
            combat: { ...character.combat, currentHp: Number(e.target.value) },
          })
        }
      />
    </div>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('Character Sheet Save Integration', () => {
  let characterId: string;
  let initialCharacter: Character;

  beforeEach(async () => {
    await db.characters.clear();
    await db.campaigns.clear();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure to exclude from createCharacter
    const { id, createdAt, updatedAt, ...rest } = mockCharacter;
    const created = await createCharacter({
      ...rest,
      name: 'Original Name',
    });
    characterId = created.id;
    initialCharacter = created;

    mockUseCharacter.mockReturnValue({
      data: initialCharacter,
      isLoading: false,
      error: null,
    });
  });

  it('should persist name change to IndexedDB after debounce', async () => {
    render(<SaveTestHarness characterId={characterId} />);

    const nameInput = screen.getByTestId('name-input');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    });

    const beforeSave = await getCharacterById(characterId);
    expect(beforeSave?.name).toBe('Original Name');

    await waitFor(
      async () => {
        const updated = await getCharacterById(characterId);
        expect(updated?.name).toBe('Updated Name');
      },
      { timeout: 2000 }
    );
  }, 10000);

  it('should persist HP change to IndexedDB after debounce', async () => {
    render(<SaveTestHarness characterId={characterId} />);

    const hpInput = screen.getByTestId('hp-input');
    await act(async () => {
      fireEvent.change(hpInput, { target: { value: '25' } });
    });

    await waitFor(
      async () => {
        const updated = await getCharacterById(characterId);
        expect(updated?.combat.currentHp).toBe(25);
      },
      { timeout: 2000 }
    );
  }, 10000);
});
