'use client';

import { ReactNode } from 'react';
import { BookingStepper } from './booking-stepper';
import { BookingFooter } from './booking-footer';

interface Step {
  label: string;
  active: boolean;
  completed: boolean;
}

interface BookingLayoutProps {
  children: ReactNode;
  steps: Step[];
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
}

export function BookingLayout({
  children,
  steps,
  onBack,
  onContinue,
  backLabel,
  continueLabel,
}: BookingLayoutProps) {
  return (
    <>
      <BookingStepper steps={steps} />

      {/* MOBILE WIP — content + footer temporarily muted.
          Restore by uncommenting. */}
      {/*
      <div className="booking-review__content">
        {children}
      </div>

      <BookingFooter
        onBack={onBack}
        onContinue={onContinue}
        backLabel={backLabel}
        continueLabel={continueLabel}
      />
      */}
    </>
  );
}
