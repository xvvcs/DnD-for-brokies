/**
 * Character Creation Wizard Page
 *
 * Server component shell with Suspense boundary for the client wizard.
 * Required for useSearchParams with static export.
 */

import { Suspense } from 'react';

import { Navbar, PageWrapper } from '@/components/shared';
import { CharacterCreationWizard } from '@/components/character-creation/CharacterCreationWizard';

function WizardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="h-64 bg-muted rounded" />
      <div className="h-12 bg-muted rounded w-full" />
    </div>
  );
}

export default function NewCharacterPage() {
  return (
    <>
      <Navbar />
      <PageWrapper>
        <Suspense fallback={<WizardSkeleton />}>
          <CharacterCreationWizard />
        </Suspense>
      </PageWrapper>
    </>
  );
}
