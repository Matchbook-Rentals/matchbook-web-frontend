'use client';

import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import Link from 'next/link';
import { PAGE_MARGIN } from '@/constants/styles';
import { ArrowLeft } from 'lucide-react';
import { useTripContext } from '@/contexts/trip-context-provider';
import { Button } from '@/components/ui/button'; // Added Button

export default function DeclinedPage() {
  const params = useParams();
  const router = useRouter(); // Added router hook
  const tripId = params.tripId as string;
  const { state: { trip } } = useTripContext();

  // Placeholder: Replace with actual logic to get declined listings/applications
  const declinedListings: unknown[] = []; // Example: Assume empty for now

  const handleGoToSearch = () => {
    router.push(`/platform/trips/${tripId}`);
  };

  return (
    <div className={PAGE_MARGIN}>
      <Link href="/platform/trips" className="inline-flex items-center text-gray-600 hover:text-gray-900 my-6">
        <ArrowLeft className="w-7 h-7" />
      </Link>

      {declinedListings.length > 0 ? (
        <h1 className="text-2xl font-bold">Declined Applications</h1>
        // TODO: Add component to display declined applications here
      ) : (
        // Empty state copied and adapted from SearchMatchbookTab
        <div className='flex flex-col items-center justify-center h-[50vh]'>
          <p className='font-montserrat-regular text-2xl mb-5'>You haven&apos;t declined any applications yet!</p>
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
