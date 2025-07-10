import React from 'react';
import { SearchContextProvider } from '@/contexts/search-context-provider';
import { getTripsInSearchStatus } from '@/app/actions/trips';
import { getTripApplication } from '@/app/actions/applications';
import { ApplicationWithArrays } from '@/types/';

export default async function SearchesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searches = await getTripsInSearchStatus();
  const response = await getTripApplication()
  let hasApplication = false
  let application: ApplicationWithArrays | null = null
  if (response.success && response.application) {
    hasApplication = true
    application = response.application as ApplicationWithArrays
  }

  return (
    <SearchContextProvider activeSearches={searches.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })} hasApplicationData={hasApplication} application={application}>
      <div className="searches-layout">
        {children}
      </div>
    </SearchContextProvider>
  );
}