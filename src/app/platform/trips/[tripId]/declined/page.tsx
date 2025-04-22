'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTripContext } from '@/contexts/trip-context-provider';

export default function DeclinedPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip } } = useTripContext();

  return (
    <div className="p-4">
      <Link href="/platform/trips" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Trips
      </Link>
      <h1 className="text-2xl font-bold">Declined Applications</h1>
    </div>
  );
}
