'use client';

import React from 'react';
import { Trip } from '@prisma/client';
import { SearchResultsSection } from './SearchResultsSection';
import { SearchContainerSection } from './SearchContainerSection';

interface TripsContentProps {
  trips: Trip[];
}

const TripsContent: React.FC<TripsContentProps> = ({ trips }) => {
  return (
    <main className="flex flex-col items-start gap-6 px-6 py-8 relative bg-gray-50 min-h-screen">
      <div className="flex flex-col items-start gap-6 relative w-full">
        <SearchResultsSection />
        <SearchContainerSection trips={trips} />
      </div>
    </main>
  );
};

export default TripsContent;
