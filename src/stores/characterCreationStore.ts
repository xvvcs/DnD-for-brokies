/**
 * Character Creation Wizard Store
 *
 * Zustand store for the multi-step character creation wizard.
 * Persists to sessionStorage with skipHydration for Next.js static export.
 * @module stores/characterCreationStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { WizardSelections } from '@/types/character';

// ============================================================================
// Constants
// ============================================================================

export const WIZARD_STEP_COUNT = 9;
export const WIZARD_STEP_NAMES = [
  'Configuration',
  'Choose Class',
  'Choose Background',
  'Choose Species',
  'Ability Scores',
  'Equipment',
  'Spells',
  'Description',
  'Review',
] as const;

export type WizardStepName = (typeof WIZARD_STEP_NAMES)[number];

// ============================================================================
// Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

/** Stable empty array for selectors - avoids getSnapshot infinite loop */
export const EMPTY_VALIDATION_ERRORS: ValidationError[] = [];

export interface CharacterCreationStoreState {
  currentStep: number;
  selections: Partial<WizardSelections>;
  completedSteps: number[];
  validationErrors: Record<number, ValidationError[]>;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updateSelections: (step: number, data: Partial<WizardSelections[keyof WizardSelections]>) => void;
  setValidationErrors: (step: number, errors: ValidationError[]) => void;
  markStepComplete: (step: number) => void;
  canAccessStep: (step: number) => boolean;
  canProceed: (step: number) => boolean;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  currentStep: 0,
  selections: {} as Partial<WizardSelections>,
  completedSteps: [] as number[],
  validationErrors: {} as Record<number, ValidationError[]>,
};

// ============================================================================
// Store
// ============================================================================

export const useCharacterCreationStore = create<CharacterCreationStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => {
        const clamped = Math.max(0, Math.min(step, WIZARD_STEP_COUNT - 1));
        set({ currentStep: clamped });
      },

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < WIZARD_STEP_COUNT - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      goToStep: (step) => {
        const clamped = Math.max(0, Math.min(step, WIZARD_STEP_COUNT - 1));
        if (get().canAccessStep(clamped)) {
          set({ currentStep: clamped });
        }
      },

      updateSelections: (step, data) => {
        const stepKeys: (keyof WizardSelections)[] = [
          'config', // 0
          'class', // 1
          'background', // 2
          'species', // 3
          'abilityScores', // 4
          'equipment', // 5
          'spells', // 6
          'description', // 7
        ];
        const key = stepKeys[step];
        if (step < 0 || step >= stepKeys.length || !key) return;

        set((state) => ({
          selections: {
            ...state.selections,
            [key]: { ...(state.selections[key] ?? {}), ...data } as WizardSelections[typeof key],
          },
        }));
      },

      setValidationErrors: (step, errors) => {
        set((state) => {
          const current = state.validationErrors[step];
          if (
            current?.length === errors.length &&
            current.every(
              (e, i) => e.field === errors[i]?.field && e.message === errors[i]?.message
            )
          ) {
            return state;
          }
          return {
            validationErrors: {
              ...state.validationErrors,
              [step]: errors,
            },
          };
        });
      },

      markStepComplete: (step) => {
        set((state) => {
          if (state.completedSteps.includes(step)) return state;
          return {
            completedSteps: [...state.completedSteps, step].sort((a, b) => a - b),
          };
        });
      },

      canAccessStep: (step) => {
        const { completedSteps } = get();
        if (step === 0) return true;
        for (let i = 0; i < step; i++) {
          if (!completedSteps.includes(i)) return false;
        }
        return true;
      },

      canProceed: (step) => {
        const { validationErrors } = get();
        const errors = validationErrors[step];
        return !errors || errors.length === 0;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'dndnb-character-creation',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? sessionStorage
          : ({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as unknown as Storage)
      ),
      partialize: (state) => ({
        currentStep: state.currentStep,
        selections: state.selections,
        completedSteps: state.completedSteps,
      }),
      skipHydration: true,
    }
  )
);
