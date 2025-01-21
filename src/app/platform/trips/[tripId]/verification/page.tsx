'use client';

import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { getTripLocationString } from '@/utils/trip-helpers';
import { useTripContext } from '@/contexts/trip-context-provider';

export default function VerificationPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip } } = useTripContext();

  return (
    <div>
      <Breadcrumbs
        links={[
          { label: 'Trips', url: '/platform/trips' },
          { label: getTripLocationString(trip), url: `/platform/trips/${tripId}` },
          { label: 'Matchbook Verification' }
        ]}
        className="mb-4"
      />
      <div className="p-4">
        <div className="text-sm text-gray-500">
          /trips/[tripId]/verification
        </div>
        <h1 className="text-2xl font-bold mt-4">Matchbook Verification</h1>
      </div>
    </div>
  );
}