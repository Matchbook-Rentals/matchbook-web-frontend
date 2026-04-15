'use client';

import { BookingSummary } from './booking-summary';
import { ConfirmationHeader } from './confirmation-header';
import type { StepProps } from './types';

export function StepConfirmation({ match, matchId }: StepProps) {
  return (
    <>
      <ConfirmationHeader />
      <BookingSummary match={match} />
    </>
  );
}
