'use client';

import { BookingSummary } from './booking-summary';
import type { StepProps } from './types';

export function StepReviewBooking({ match }: StepProps) {
  return <BookingSummary match={match} />;
}
