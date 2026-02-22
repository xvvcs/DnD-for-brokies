/**
 * Step Wrapper Component
 *
 * Wraps wizard step content with consistent styling, validation display,
 * and accessibility (fieldset/legend).
 */

import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import type { ValidationError } from '@/stores/characterCreationStore';

interface StepWrapperProps {
  title: string;
  children: ReactNode;
  validationErrors?: ValidationError[];
  help?: ReactNode;
  className?: string;
  /** Ref for focus management on step change */
  stepRef?: React.RefObject<HTMLHeadingElement | null>;
}

export function StepWrapper({
  title,
  children,
  validationErrors = [],
  help,
  className,
  stepRef,
}: StepWrapperProps) {
  const hasErrors = validationErrors.length > 0;

  return (
    <fieldset className={cn('border-0 p-0 m-0 min-w-0', className)}>
      <legend className="sr-only">{title}</legend>

      <div className={cn('fantasy-card p-6 sm:p-8 text-card-foreground')}>
        <h2
          ref={stepRef}
          tabIndex={-1}
          className={cn(
            'font-[family-name:var(--font-cinzel)] text-2xl font-bold text-card-foreground mb-6',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded'
          )}
        >
          {title}
        </h2>

        {hasErrors && (
          <div
            role="alert"
            className="mb-6 rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="text-sm font-medium text-destructive mb-2">Please fix the following:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive/90">
              {validationErrors.map((err, i) => (
                <li key={i}>
                  {err.field ? `${err.field}: ` : ''}
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {help && (
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
            {help}
          </div>
        )}

        <div className="space-y-4">{children}</div>
      </div>
    </fieldset>
  );
}
