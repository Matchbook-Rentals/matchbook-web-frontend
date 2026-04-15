'use client';

import { useState } from 'react';
import { MatchWithRelations } from '@/types';
import { BookingLayout } from './components/booking-layout';
import { StepReviewBooking } from './components/step-review-booking';
import { StepSignLease } from './components/step-sign-lease';
import { StepPayAndBook } from './components/step-pay-and-book';
import { StepConfirmation } from './components/step-confirmation';
import type { StepProps, LeaseDocument } from './components/types';
import type { BookingReceipt } from './get-booking-receipt';

interface AwaitingLeaseClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
  currentUserEmail: string;
  leaseDocument?: LeaseDocument | null;
  /** Step index to mount the flow on, computed server-side from match state */
  initialStep?: number;
  /** Real-data receipt built server-side from RentPayment rows (confirmation step only) */
  bookingReceipt?: BookingReceipt | null;
}

const STEP_LABELS = ["Review Booking", "Sign Lease", "Pay and Book", "Confirmation"];

const STEP_COMPONENTS: React.ComponentType<StepProps>[] = [
  StepReviewBooking,
  StepSignLease,
  StepPayAndBook,
  StepConfirmation,
];

export function AwaitingLeaseClient({
  match,
  matchId,
  isAdminDev = false,
  currentUserEmail,
  leaseDocument,
  initialStep = 0,
  bookingReceipt = null,
}: AwaitingLeaseClientProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    active: i === currentStep,
    completed: i < currentStep,
  }));

  const StepContent = STEP_COMPONENTS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_LABELS.length - 1;

  const stepProps: StepProps = {
    match,
    matchId,
    currentUserEmail,
    isAdminDev,
    leaseDocument,
    onAdvanceStep: isLastStep ? undefined : () => setCurrentStep((s) => s + 1),
    bookingReceipt,
  };

  // Back navigation is only meaningful for the signing and payment steps.
  // - Step 0 (Review): nothing behind it
  // - Step 3 (Confirmation): booking is created, going back would be incoherent
  const hideBackButton = isFirstStep || isLastStep;

  return (
    <BookingLayout
      steps={steps}
      onBack={hideBackButton ? undefined : () => setCurrentStep((s) => s - 1)}
      onContinue={isLastStep ? undefined : () => setCurrentStep((s) => s + 1)}
      backLabel={hideBackButton ? undefined : 'Back'}
      continueLabel={isLastStep ? 'Done' : 'Continue'}
    >
      <StepContent {...stepProps} />
    </BookingLayout>
  );
}
