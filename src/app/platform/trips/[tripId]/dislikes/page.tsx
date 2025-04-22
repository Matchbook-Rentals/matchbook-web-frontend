'use client';

import { useParams } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';
import { PAGE_MARGIN } from '@/constants/styles';
import DislikeListingGrid from './dislike-listing-grid';

export default function DislikesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip, dislikedListings } } = useTripContext();

  return (
    <div className={PAGE_MARGIN}>
      <DislikeListingGrid listings={dislikedListings} />

    </div>
  );
}
