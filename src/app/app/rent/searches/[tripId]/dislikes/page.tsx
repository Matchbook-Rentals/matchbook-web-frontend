'use client';

import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { useTripContext } from '@/contexts/trip-context-provider';
import { PAGE_MARGIN } from '@/constants/styles';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DislikeListingGrid from './dislike-listing-grid';
import { Button } from '@/components/ui/button'; // Added Button

export default function DislikesPage() {
  const params = useParams();
  const router = useRouter(); // Added router hook
  const tripId = params.tripId as string;
  const { state: { trip, dislikedListings } } = useTripContext();

  const handleGoToSearch = () => {
    router.push(`/app/rent/searches/${tripId}`);
  };

  return (
    <div className={PAGE_MARGIN}>
      <Link href="/app/rent/searches" className="inline-flex items-center text-gray-600 hover:text-gray-900 my-6">
        <ArrowLeft className="w-7 h-7" />
      </Link>

      {dislikedListings.length > 0 ? (
        <DislikeListingGrid listings={dislikedListings} />
      ) : (
        // Empty state copied and adapted from SearchMatchbookTab
        <div className='flex flex-col items-center justify-center h-[50vh]'>
          <p className='font-montserrat-regular text-2xl mb-5'>You haven&apos;t disliked any listings yet!</p>
          <p className='mt-3'> Let&apos;s find you some options! </p>
          <div className='flex justify-center gap-x-2 mt-2'>
            <Button onClick={handleGoToSearch}>
              Back to Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
