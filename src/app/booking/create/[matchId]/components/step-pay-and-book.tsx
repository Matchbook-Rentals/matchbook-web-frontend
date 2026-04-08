'use client';

import type { StepProps } from './types';

export function StepPayAndBook({ match, matchId, currentUserEmail }: StepProps) {
  return (
    <div className="booking-review__step-shell">
      <h2 className="booking-review__step-shell-title">Pay and Book</h2>
      <p className="booking-review__step-shell-description">
        Complete your payment to confirm your booking.
      </p>
    </div>
  );
}
