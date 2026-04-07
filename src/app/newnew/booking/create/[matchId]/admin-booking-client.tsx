'use client';

import { useState } from 'react';
import { BookingStepper } from '@/app/booking/create/[matchId]/components/booking-stepper';
import { BookingFooter } from '@/app/booking/create/[matchId]/components/booking-footer';
import { AdminStepReview } from './admin-step-review';
import { StepSignLease } from '@/app/booking/create/[matchId]/components/step-sign-lease';
import { StepPayAndBook } from '@/app/booking/create/[matchId]/components/step-pay-and-book';
import { StepConfirmation } from '@/app/booking/create/[matchId]/components/step-confirmation';

const STEP_LABELS = ["Review Booking", "Sign Lease", "Pay and Book", "Confirmation"];

const STEP_COMPONENTS = [
  AdminStepReview,
  StepSignLease,
  StepPayAndBook,
  StepConfirmation,
];

interface AdminBookingClientProps {
  matchId: string;
}

export function AdminBookingClient({ matchId }: AdminBookingClientProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    active: i === currentStep,
    completed: i < currentStep,
  }));

  const StepContent = STEP_COMPONENTS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_LABELS.length - 1;

  return (
    <>
      <BookingStepper steps={steps} dotBgColor="#fafafa" />

      <div className="booking-review__content">
        <StepContent />
      </div>

      <BookingFooter
        onBack={isFirstStep ? undefined : () => setCurrentStep((s) => s - 1)}
        onContinue={isLastStep ? undefined : () => setCurrentStep((s) => s + 1)}
        backLabel={isFirstStep ? undefined : 'Back'}
        continueLabel={isLastStep ? 'Done' : 'Continue'}
      />
    </>
  );
}
