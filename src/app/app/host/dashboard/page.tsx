'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to applications as the default dashboard page
    router.push('/app/host/dashboard/overview');
  }, [router]);

  return null;
}
