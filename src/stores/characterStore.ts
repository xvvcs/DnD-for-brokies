import { create } from 'zustand';
import type { Character, CharacterUpdate } from '@/types/character';

interface CharacterState {
  // Currently edited character (for creation/editing)
  draft: Partial<Character> | null;
  // Original character before edits (for cancel/reset)
  original: Character | null;
  // Whether there are unsaved changes
  hasChanges: boolean;

  // Actions
  setDraft: (draft: Partial<Character>) => void;
  updateDraft: (update: CharacterUpdate) => void;
  setOriginal: (character: Character) => void;
  reset: () => void;
  markSaved: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  draft: null,
  original: null,
  hasChanges: false,

  setDraft: (draft) => set({ draft, hasChanges: true }),

  updateDraft: (update) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, ...update } : update,
      hasChanges: true,
    })),

  setOriginal: (character) =>
    set({
      original: character,
      draft: character,
      hasChanges: false,
    }),

  reset: () =>
    set((state) => ({
      draft: state.original,
      hasChanges: false,
    })),

  markSaved: () =>
    set((state) => ({
      original: state.draft as Character,
      hasChanges: false,
    })),
}));
