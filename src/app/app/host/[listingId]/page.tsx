'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PropertyDashboardPageProps {
  params: { listingId: string }
}

export default function PropertyDashboardPage({ params }: PropertyDashboardPageProps) {
  const { listingId } = params;
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to applications tab by default
    router.push(`/app/host/${listingId}/summary`);
  }, [listingId, router]);

  return null;
}
