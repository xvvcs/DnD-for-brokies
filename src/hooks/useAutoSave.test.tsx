/**
 * useAutoSave Hook Tests
 *
 * Verifies debounced auto-save, saveState transitions, error handling,
 * and pending changes flush on unmount.
 * @module hooks/useAutoSave.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useAutoSave } from './useAutoSave';
import type { Character } from '@/types/character';

// ============================================================================
// Mocks
// ============================================================================

const mockUpdateCharacter = vi.fn();
vi.mock('@/lib/db', () => ({
  updateCharacter: (...args: unknown[]) => mockUpdateCharacter(...args),
}));

// ============================================================================
// Test Helpers
// ============================================================================

const mockCharacter: Character = {
  id: 'char-1',
  name: 'Test Hero',
  playerName: 'Player',
  race: { key: 'human', name: 'Human' },
  classes: [{ key: 'fighter', name: 'Fighter', level: 5, hitDiceValue: 10, isPrimary: true }],
  background: { key: 'soldier', name: 'Soldier' },
  alignment: 'Neutral Good',
  level: 5,
  experiencePoints: 0,
  edition: '2014',
  abilityScores: {
    base: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
    racialBonus: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    asiBonus: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    otherBonus: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    override: { STR: null, DEX: null, CON: null, INT: null, WIS: null, CHA: null },
    total: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
    modifier: { STR: 2, DEX: 2, CON: 1, INT: 1, WIS: 0, CHA: -1 },
    generationMethod: 'standard',
  },
  skills: [],
  combat: {
    maxHp: 45,
    currentHp: 30,
    tempHp: 0,
    ac: { base: 10, dexModifier: 2, bonus: 0, total: 12 },
    initiative: 2,
    speed: 30,
    hitDice: { type: 'd10', total: 5, used: 0 },
    deathSaves: { successes: 0, failures: 0 },
  },
  proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
  spellcasting: null,
  inventory: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
  features: [],
  actions: [],
  conditions: [],
  personality: {
    traits: [],
    ideals: [],
    bonds: [],
    flaws: [],
    appearance: '',
    backstory: '',
    allies: '',
    enemies: '',
    notes: '',
  },
  appearance: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', other: '' },
  sessionNotes: [],
  overrides: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// Tests
// ============================================================================

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdateCharacter.mockReset();
    mockUpdateCharacter.mockResolvedValue({ ...mockCharacter, name: 'Updated' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with idle state and null lastSavedAt', () => {
      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 1000 }));

      expect(result.current.saveState).toBe('idle');
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockUpdateCharacter).not.toHaveBeenCalled();
    });
  });

  describe('debounce', () => {
    it('should not call updateCharacter before delay elapses', () => {
      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 1000 }));

      act(() => {
        result.current.save({ name: 'New Name' });
      });

      expect(mockUpdateCharacter).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(mockUpdateCharacter).not.toHaveBeenCalled();
    });

    it('should call updateCharacter after delay elapses', async () => {
      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 1000 }));

      act(() => {
        result.current.save({ name: 'New Name' });
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockUpdateCharacter).toHaveBeenCalledWith('char-1', { name: 'New Name' });
    });

    it('should merge rapid changes and save once', async () => {
      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 1000 }));

      act(() => {
        result.current.save({ name: 'First' });
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      act(() => {
        result.current.save({ combat: { ...mockCharacter.combat, currentHp: 25 } });
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      act(() => {
        result.current.save({ personality: { ...mockCharacter.personality, backstory: 'Hero' } });
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockUpdateCharacter).toHaveBeenCalledTimes(1);
      const [, changes] = mockUpdateCharacter.mock.calls[0];
      expect(changes).toMatchObject({
        name: 'First',
        combat: expect.objectContaining({ currentHp: 25 }),
        personality: expect.objectContaining({ backstory: 'Hero' }),
      });
    });

    it('should reset debounce timer on new save call', async () => {
      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 1000 }));

      act(() => {
        result.current.save({ name: 'First' });
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      act(() => {
        result.current.save({ name: 'Second' });
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockUpdateCharacter).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockUpdateCharacter).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({ name: 'Second' })
      );
    });
  });

  describe('saveState transitions', () => {
    it('should transition to saving then saved on success', async () => {
      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 100 }));

      act(() => {
        result.current.save({ name: 'Updated' });
      });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.saveState).toBe('saved');
      expect(result.current.lastSavedAt).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.saveState).toBe('idle');
    });

    it('should transition to error when updateCharacter fails', async () => {
      mockUpdateCharacter.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 100 }));

      act(() => {
        result.current.save({ name: 'Updated' });
      });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.saveState).toBe('error');
      expect(result.current.error?.message).toBe('Network error');
    });

    it('should call onSave when save succeeds', async () => {
      const onSave = vi.fn();
      const { result } = renderHook(() =>
        useAutoSave({ characterId: 'char-1', delay: 100, onSave })
      );

      act(() => {
        result.current.save({ name: 'Updated' });
      });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
    });

    it('should call onError when save fails', async () => {
      const err = new Error('DB error');
      mockUpdateCharacter.mockRejectedValueOnce(err);

      const onError = vi.fn();
      const { result } = renderHook(() =>
        useAutoSave({ characterId: 'char-1', delay: 100, onError })
      );

      act(() => {
        result.current.save({ name: 'Updated' });
      });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onError).toHaveBeenCalledWith(err);
    });
  });

  describe('reset', () => {
    it('should clear pending changes and reset state', async () => {
      const { result } = renderHook(() => useAutoSave({ characterId: 'char-1', delay: 1000 }));

      act(() => {
        result.current.save({ name: 'Pending' });
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockUpdateCharacter).not.toHaveBeenCalled();
      expect(result.current.saveState).toBe('idle');
      expect(result.current.error).toBeNull();
    });
  });

  describe('unmount', () => {
    it('should flush pending changes on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useAutoSave({ characterId: 'char-1', delay: 1000 })
      );

      act(() => {
        result.current.save({ name: 'Unmount Save' });
      });

      unmount();

      await Promise.resolve();
      await Promise.resolve();

      expect(mockUpdateCharacter).toHaveBeenCalledWith('char-1', { name: 'Unmount Save' });
    });
  });
});
