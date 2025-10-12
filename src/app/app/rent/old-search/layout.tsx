'use client';

import React, { useEffect, useState } from 'react';
import { SearchContextProvider } from '@/contexts/search-context-provider';
import { getTripsInSearchStatus } from '@/app/actions/trips';
import { getTripApplication } from '@/app/actions/applications';
import { ApplicationWithArrays } from '@/types/';
import { TripAndMatches } from '@/types';

export default function SearchesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [searches, setSearches] = useState<TripAndMatches[]>([]);
  const [application, setApplication] = useState<ApplicationWithArrays | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const searchResults = await getTripsInSearchStatus();
      const sortedSearches = searchResults.sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setSearches(sortedSearches);

      const response = await getTripApplication();
      if (response.success && response.application) {
        setApplication(response.application as ApplicationWithArrays);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <SearchContextProvider activeSearches={searches} application={application}>
      <div className="searches-layout">
        {children}
      </div>
    </SearchContextProvider>
  );
}