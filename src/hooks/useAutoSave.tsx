/**
 * Auto-save Hook
 *
 * Provides debounced auto-save functionality for character editing.
 * @module hooks/useAutoSave
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { updateCharacter } from '@/lib/db';
import type { Character, CharacterUpdate } from '@/types/character';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  /** Character ID to save */
  characterId: string;
  /** Debounce delay in milliseconds (default: 1000ms) */
  delay?: number;
  /** Callback when save succeeds */
  onSave?: (character: Character) => void;
  /** Callback when save fails */
  onError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  /** Current save state */
  saveState: SaveState;
  /** Last save timestamp */
  lastSavedAt: Date | null;
  /** Error message if save failed */
  error: Error | null;
  /** Trigger a manual save */
  save: (changes: CharacterUpdate) => Promise<void>;
  /** Reset save state to idle */
  reset: () => void;
}

/**
 * Hook for auto-saving character changes with debouncing
 *
 * @example
 * ```tsx
 * const { saveState, lastSavedAt, save } = useAutoSave({
 *   characterId: character.id,
 *   onSave: (char) => console.log('Saved:', char.name),
 * });
 *
 * // Auto-save when HP changes
 * useEffect(() => {
 *   save({ combat: { ...character.combat, currentHp: newHp } });
 * }, [newHp]);
 * ```
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const { characterId, delay = 1000, onSave, onError } = options;

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<CharacterUpdate | null>(null);
  const saveStateRef = useRef<SaveState>(saveState);
  const performSaveRef = useRef<((changes: CharacterUpdate) => Promise<void>) | undefined>(
    undefined
  );

  // Keep refs in sync with state/callbacks
  saveStateRef.current = saveState;

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(
    async (changes: CharacterUpdate): Promise<void> => {
      setSaveState('saving');
      setError(null);

      try {
        const updated = await updateCharacter(characterId, changes);

        if (updated) {
          setSaveState('saved');
          setLastSavedAt(new Date());
          onSave?.(updated);

          // Reset to idle after showing "saved" state briefly
          setTimeout(() => {
            setSaveState('idle');
          }, 2000);
        } else {
          throw new Error('Character not found');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Save failed');
        setSaveState('error');
        setError(error);
        onError?.(error);
      }
    },
    [characterId, onSave, onError]
  );

  // Store performSave in ref for useEffect access
  performSaveRef.current = performSave;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Save any pending changes on unmount
      if (pendingChangesRef.current && saveStateRef.current === 'idle') {
        void performSaveRef.current?.(pendingChangesRef.current);
      }
    };
  }, []);

  /**
   * Trigger a save (debounced)
   */
  const save = useCallback(
    async (changes: CharacterUpdate): Promise<void> => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Store pending changes
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        ...changes,
      };

      // Set up debounced save
      debounceTimerRef.current = setTimeout(() => {
        if (pendingChangesRef.current) {
          void performSave(pendingChangesRef.current);
          pendingChangesRef.current = null;
        }
      }, delay);
    },
    [delay, performSave]
  );

  /**
   * Reset save state
   */
  const reset = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    pendingChangesRef.current = null;
    setSaveState('idle');
    setError(null);
  }, []);

  return {
    saveState,
    lastSavedAt,
    error,
    save,
    reset,
  };
}

/**
 * Hook for optimistic updates with rollback on error
 *
 * @example
 * ```tsx
 * const { optimisticData, update, rollback } = useOptimisticUpdate({
 *   data: character,
 *   onUpdate: async (changes) => {
 *     await updateCharacter(character.id, changes);
 *   },
 * });
 * ```
 */
export function useOptimisticUpdate<T extends Record<string, unknown>>(options: {
  data: T;
  onUpdate: (updatedData: T) => Promise<void>;
}): {
  optimisticData: T;
  update: (changes: Partial<T>) => Promise<void>;
  rollback: () => void;
  isUpdating: boolean;
} {
  const { data, onUpdate } = options;
  const [optimisticData, setOptimisticData] = useState<T>(data);
  const [isUpdating, setIsUpdating] = useState(false);
  const originalDataRef = useRef<T>(data);

  // Sync with external data changes
  useEffect(() => {
    setOptimisticData(data);
    originalDataRef.current = data;
  }, [data]);

  const update = useCallback(
    async (changes: Partial<T>): Promise<void> => {
      // Store original data for rollback
      originalDataRef.current = { ...optimisticData };

      // Apply optimistic update
      const updated = { ...optimisticData, ...changes };
      setOptimisticData(updated);
      setIsUpdating(true);

      try {
        await onUpdate(updated);
      } catch (error) {
        // Rollback on error
        setOptimisticData(originalDataRef.current);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [optimisticData, onUpdate]
  );

  const rollback = useCallback(() => {
    setOptimisticData(originalDataRef.current);
    setIsUpdating(false);
  }, []);

  return {
    optimisticData,
    update,
    rollback,
    isUpdating,
  };
}

/**
 * Component to display save state indicator
 * Shows "Saving...", "Saved", or error state
 */
export function SaveIndicator({
  state,
  lastSavedAt,
  error,
}: {
  state: SaveState;
  lastSavedAt: Date | null;
  error: Error | null;
}): React.ReactElement {
  const getContent = (): { text: string; className: string } => {
    switch (state) {
      case 'saving':
        return {
          text: 'Saving...',
          className: 'text-muted-foreground animate-pulse',
        };
      case 'saved':
        return {
          text: lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : 'Saved',
          className: 'text-green-600',
        };
      case 'error':
        return {
          text: error?.message || 'Save failed',
          className: 'text-destructive',
        };
      case 'idle':
      default:
        return {
          text: lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : '',
          className: 'text-muted-foreground text-sm',
        };
    }
  };

  const { text, className } = getContent();

  return <span className={`text-xs transition-all duration-300 ${className}`}>{text}</span>;
}
