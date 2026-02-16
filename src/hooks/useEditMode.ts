/**
 * useEditMode Hook
 *
 * Simple hook for managing edit mode state in character sheet panels.
 * Provides toggle functionality and edit state tracking.
 */

import { useState, useCallback } from 'react';

export interface EditModeState {
  /** Whether the panel is in edit mode */
  isEditing: boolean;
  /** Enable edit mode */
  startEditing: () => void;
  /** Disable edit mode */
  stopEditing: () => void;
  /** Toggle edit mode */
  toggleEditing: () => void;
  /** Set edit mode to a specific value */
  setEditing: (value: boolean) => void;
}

/**
 * Hook to manage edit mode state for character sheet panels
 * @param initialState Initial edit mode state (default: false)
 * @returns Edit mode state and control functions
 */
export function useEditMode(initialState = false): EditModeState {
  const [isEditing, setIsEditing] = useState(initialState);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const setEditing = useCallback((value: boolean) => {
    setIsEditing(value);
  }, []);

  return {
    isEditing,
    startEditing,
    stopEditing,
    toggleEditing,
    setEditing,
  };
}
