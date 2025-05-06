'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import LoadingTabs from './LoadingTabs';
import LoadingSkeleton from './LoadingSkeleton';
import { APP_PAGE_MARGIN, PAGE_MARGIN } from '@/constants/styles';

const DynamicFallback: React.FC = () => {
  const pathname = usePathname();

  // Customize fallback based on URL or query params
  if (pathname.includes('/listing/')) {
    // Show a simple skeleton for listings
    return <div className={`${PAGE_MARGIN} pt-6 flex justify-center items-center`}><LoadingSkeleton /></div>;
  }
  // Default fallback
  return <LoadingTabs />;
};

export default DynamicFallback;
