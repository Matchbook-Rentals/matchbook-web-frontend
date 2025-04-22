'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PAGE_MARGIN } from '@/constants/styles';
import { ArrowLeft } from 'lucide-react';
import { useTripContext } from '@/contexts/trip-context-provider';

export default function DeclinedPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { state: { trip } } = useTripContext();

  return (
    <div className={PAGE_MARGIN}>
      <Link href="/platform/trips" className="inline-flex items-center text-gray-600 hover:text-gray-900 my-6">
        <ArrowLeft className="w-7 h-7" />
      </Link>
      <h1 className="text-2xl font-bold">Declined Applications</h1>
    </div>
  );
}
