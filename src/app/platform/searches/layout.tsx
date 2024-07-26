import React from 'react';
import { SearchContextProvider } from '@/contexts/search-context-proivder';
import { getTripsInSearchStatus } from '@/app/actions/trips';

export default async function SearchesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searches = await getTripsInSearchStatus();

  return (
    <SearchContextProvider activeSearches={searches.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })}>
      <div className="searches-layout">
        {children}
      </div>
    </SearchContextProvider>
  );
}