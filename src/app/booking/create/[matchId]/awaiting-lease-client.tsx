'use client';

import { useState } from 'react';
import { MatchWithRelations } from '@/types';
import { BookingLayout } from './components/booking-layout';
import { StepReviewBooking } from './components/step-review-booking';
import { StepSignLease } from './components/step-sign-lease';
import { StepPayAndBook } from './components/step-pay-and-book';
import { StepConfirmation } from './components/step-confirmation';
import type { StepProps, LeaseDocument } from './components/types';

interface AwaitingLeaseClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
  currentUserEmail: string;
  leaseDocument?: LeaseDocument | null;
}

const STEP_LABELS = ["Review Booking", "Sign Lease", "Pay and Book", "Confirmation"];

const STEP_COMPONENTS: React.ComponentType<StepProps>[] = [
  StepReviewBooking,
  StepSignLease,
  StepPayAndBook,
  StepConfirmation,
];

export function AwaitingLeaseClient({ match, matchId, isAdminDev = false, currentUserEmail, leaseDocument }: AwaitingLeaseClientProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    active: i === currentStep,
    completed: i < currentStep,
  }));

  const StepContent = STEP_COMPONENTS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_LABELS.length - 1;

  const stepProps: StepProps = { match, matchId, currentUserEmail, isAdminDev, leaseDocument };

  return (
    <BookingLayout
      steps={steps}
      onBack={isFirstStep ? undefined : () => setCurrentStep((s) => s - 1)}
      onContinue={isLastStep ? undefined : () => setCurrentStep((s) => s + 1)}
      backLabel={isFirstStep ? undefined : 'Back'}
      continueLabel={isLastStep ? 'Done' : 'Continue'}
    >
      <StepContent {...stepProps} />
    </BookingLayout>
  );
}
