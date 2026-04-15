'use client';

import { BookingSummary } from './booking-summary';
import { ConfirmationHeader } from './confirmation-header';
import { DownloadableDocuments } from './downloadable-documents';
import type { StepProps } from './types';

export function StepConfirmation({ match, bookingReceipt }: StepProps) {
  return (
    <>
      <ConfirmationHeader />
      <BookingSummary match={match} variant="receipt" receipt={bookingReceipt} />
      <div className="mt-8">
        <DownloadableDocuments match={match} />
      </div>
    </>
  );
}
