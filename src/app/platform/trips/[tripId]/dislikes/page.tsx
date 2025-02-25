'use client';

import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getTripLocationString } from '@/utils/trip-helpers';
import { useTripContext } from '@/contexts/trip-context-provider';
import { PAGE_MARGIN } from '@/constants/styles';
import DislikeListingGrid from './dislike-listing-grid';

export default function DislikesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip, dislikedListings } } = useTripContext();

  return (
    <div className={PAGE_MARGIN}>
      <Breadcrumbs
        links={[
          { label: getTripLocationString(trip), url: `/platform/trips/${tripId}` },
          { label: 'Disliked Properties' }
        ]} />
      <DislikeListingGrid listings={dislikedListings} />

    </div>
  );
}