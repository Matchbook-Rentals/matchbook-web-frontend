'use client';

import type { StepProps } from './types';

export function StepConfirmation({ match, matchId }: StepProps) {
  return (
    <div className="booking-review__step-shell">
      <h2 className="booking-review__step-shell-title">Confirmation</h2>
      <p className="booking-review__step-shell-description">
        Your booking has been confirmed. Welcome home!
      </p>
    </div>
  );
}
