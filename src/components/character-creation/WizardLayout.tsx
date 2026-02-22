/**
 * Wizard Layout Component
 *
 * Step indicator, navigation (Back/Next/Save & Exit), and content area.
 * Mobile-responsive: full stepper on desktop, compact on mobile.
 * Fixed bottom nav on mobile for thumb reach.
 */

'use client';

import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  WIZARD_STEP_COUNT,
  WIZARD_STEP_NAMES,
  useCharacterCreationStore,
} from '@/stores/characterCreationStore';

import { cn } from '@/lib/utils';

interface WizardLayoutProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSaveExit: () => void;
  onGoToStep: (step: number) => void;
  canGoNext: boolean;
  children: React.ReactNode;
}

export function WizardLayout({
  currentStep,
  onNext,
  onPrev,
  onSaveExit,
  onGoToStep,
  canGoNext,
  children,
}: WizardLayoutProps) {
  const completedSteps = useCharacterCreationStore((s) => s.completedSteps);

  return (
    <div className="flex flex-col min-h-[60vh]">
      {/* Step indicator - desktop: full stepper, mobile: compact */}
      <nav aria-label="Character creation progress" className="mb-8">
        <div className="hidden md:block">
          <ol className="flex items-center justify-between gap-2" role="list">
            {WIZARD_STEP_NAMES.map((name, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(index);
              const isPast = index < currentStep;

              return (
                <li
                  key={index}
                  className={cn(
                    'flex flex-1 items-center',
                    index < WIZARD_STEP_COUNT - 1 &&
                      'after:content-[""] after:flex-1 after:h-0.5 after:mx-1',
                    isPast && 'after:bg-primary',
                    !isPast && 'after:bg-muted'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <button
                    type="button"
                    onClick={() => onGoToStep(index)}
                    disabled={!isCompleted && !isActive}
                    className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-primary rounded disabled:cursor-not-allowed group"
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 transition-colors',
                        isActive &&
                          'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                        isCompleted &&
                          !isActive &&
                          'bg-primary/20 text-primary group-hover:bg-primary/30',
                        !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted && !isActive ? '✓' : index + 1}
                    </span>
                    <span
                      className={cn(
                        'ml-2 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none transition-colors',
                        isActive ? 'font-semibold text-foreground' : 'text-muted-foreground',
                        isCompleted && !isActive && 'group-hover:text-foreground'
                      )}
                    >
                      {name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="md:hidden text-center py-2">
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {WIZARD_STEP_COUNT}
          </p>
          <p className="font-[family-name:var(--font-cinzel)] font-semibold text-foreground">
            {WIZARD_STEP_NAMES[currentStep]}
          </p>
        </div>
      </nav>

      {/* Step content */}
      <div className="flex-1 pb-24 md:pb-8">{children}</div>

      {/* Navigation - fixed on mobile */}
      <div
        className={cn(
          'flex items-center justify-between gap-4 pt-4 border-t border-border',
          'md:relative md:border-t md:pt-6',
          'fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-4 md:static md:bg-transparent md:backdrop-blur-none'
        )}
      >
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={currentStep === 0}
            className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveExit}
            className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
          >
            <Save className="w-4 h-4 mr-1" />
            Save & Exit
          </Button>
        </div>
        <Button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
        >
          {currentStep === WIZARD_STEP_COUNT - 1 ? 'Create Character' : 'Next'}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
