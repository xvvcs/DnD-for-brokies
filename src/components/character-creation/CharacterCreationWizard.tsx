/**
 * Character Creation Wizard
 *
 * Client component that orchestrates the multi-step character creation flow.
 * Reads step from URL (?step=N), syncs with store, handles navigation and accessibility.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import {
  EMPTY_VALIDATION_ERRORS,
  WIZARD_STEP_COUNT,
  WIZARD_STEP_NAMES,
  useCharacterCreationStore,
  type ValidationError,
} from '@/stores/characterCreationStore';

import { StepWrapper } from './StepWrapper';
import { WizardLayout } from './WizardLayout';
import { StepConfig } from './StepConfig';

function clampStep(step: number): number {
  return Math.max(0, Math.min(step, WIZARD_STEP_COUNT - 1));
}

export function CharacterCreationWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepRef = useRef<HTMLHeadingElement>(null);

  const setStep = useCharacterCreationStore((s) => s.setStep);
  const selections = useCharacterCreationStore((s) => s.selections);
  const updateSelections = useCharacterCreationStore((s) => s.updateSelections);
  const setValidationErrors = useCharacterCreationStore((s) => s.setValidationErrors);
  const markStepComplete = useCharacterCreationStore((s) => s.markStepComplete);
  const canAccessStep = useCharacterCreationStore((s) => s.canAccessStep);
  const canProceed = useCharacterCreationStore((s) => s.canProceed);

  const stepParam = searchParams.get('step');
  const urlStep = clampStep(parseInt(stepParam ?? '0', 10) || 0);

  const currentStep = urlStep;

  const goToStep = useCallback(
    (step: number) => {
      const clamped = clampStep(step);
      if (!canAccessStep(clamped)) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set('step', String(clamped));
      router.push(`${pathname}?${params.toString()}`);
      setStep(clamped);
    },
    [canAccessStep, pathname, router, searchParams, setStep]
  );

  const handleNext = useCallback(() => {
    if (currentStep < WIZARD_STEP_COUNT - 1) {
      markStepComplete(currentStep);
      goToStep(currentStep + 1);
    } else {
      // Step 8 (Review) - Create Character not implemented yet
      // TODO: implement character creation and redirect
    }
  }, [currentStep, goToStep, markStepComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handleSaveExit = useCallback(() => {
    router.push('/characters');
  }, [router]);

  const validationErrors = useCharacterCreationStore(
    (s) => s.validationErrors[currentStep] ?? EMPTY_VALIDATION_ERRORS
  );
  const canGoNext = canProceed(currentStep);

  const hasUnsavedChanges = useMemo(
    () => Object.keys(selections).length > 0 && (selections.config?.documentKeys?.length ?? 0) > 0,
    [selections]
  );
  useUnsavedChangesGuard(hasUnsavedChanges);

  useEffect(() => {
    const store = useCharacterCreationStore as unknown as { persist?: { rehydrate: () => void } };
    store.persist?.rehydrate?.();
  }, []);

  useEffect(() => {
    setStep(currentStep);
  }, [currentStep, setStep]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `Character Creation — Step ${currentStep + 1} of ${WIZARD_STEP_COUNT}: ${WIZARD_STEP_NAMES[currentStep]}`;
    stepRef.current?.focus();
  }, [currentStep]);

  const handleConfigUpdate = useCallback(
    (config: {
      documentKeys: string[];
      edition: '2014' | '2024';
      campaignId?: string;
      hpMethod: 'fixed' | 'manual';
    }) => {
      updateSelections(0, config);
      setValidationErrors(0, EMPTY_VALIDATION_ERRORS);
    },
    [updateSelections, setValidationErrors]
  );

  const handleValidationChange = useCallback(
    (errors: ValidationError[]) => {
      setValidationErrors(0, errors);
    },
    [setValidationErrors]
  );

  return (
    <WizardLayout
      currentStep={currentStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSaveExit={handleSaveExit}
      onGoToStep={goToStep}
      canGoNext={canGoNext}
    >
      {currentStep === 0 ? (
        <StepWrapper
          title={WIZARD_STEP_NAMES[0]}
          validationErrors={validationErrors}
          stepRef={stepRef}
        >
          <StepConfig
            documentKeys={selections.config?.documentKeys ?? []}
            edition={selections.config?.edition ?? '2014'}
            campaignId={selections.config?.campaignId}
            hpMethod={selections.config?.hpMethod ?? 'fixed'}
            onUpdate={handleConfigUpdate}
            onValidationChange={handleValidationChange}
          />
        </StepWrapper>
      ) : (
        <StepWrapper title={WIZARD_STEP_NAMES[currentStep]} stepRef={stepRef}>
          <p className="text-muted-foreground">Step {currentStep + 1} — Coming soon.</p>
        </StepWrapper>
      )}
    </WizardLayout>
  );
}
