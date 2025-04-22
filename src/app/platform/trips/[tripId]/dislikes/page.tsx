'use client';

import { useParams } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';
import { PAGE_MARGIN } from '@/constants/styles';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DislikeListingGrid from './dislike-listing-grid';

export default function DislikesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip, dislikedListings } } = useTripContext();

  return (
    <div className={PAGE_MARGIN}>
      <Link href="/platform/trips" className="inline-flex items-center text-gray-600 hover:text-gray-900 my-6">
        <ArrowLeft className="w-7 h-7" />
      </Link>
      <DislikeListingGrid listings={dislikedListings} />

    </div>
  );
}
