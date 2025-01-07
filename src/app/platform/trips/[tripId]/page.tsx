'use client'
import { useEffect, useState } from 'react';
import { getTripById } from '@/app/actions/trips';
import { getUserApplication } from '@/app/actions/applications';
import { TripContextProvider } from '@/contexts/trip-context-provider';
import TripClientComponent from './TripClientComponent';
import LoadingTabs from './LoadingTabs';
import { RawListingResult } from '@/types/raw-listing';

const createTimeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
};

const fetchListings = async (lat: number, lng: number, radiusMiles: number) => {
  const response = await fetch(
    `/api/listings/search?lat=${lat}&lng=${lng}&radiusMiles=${radiusMiles}`,
    { credentials: 'include' }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }
  let listings = await response.json();
  return listings;
};

export default function TripPage({
  params
}: {
  params: { tripId: string }
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pageData, setPageData] = useState<{
    trip: any;
    listings: RawListingResult[];
    application: any;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripResult = await Promise.race([
          getTripById(params.tripId, { next: { tags: [`trip-${params.tripId}`, 'user-trips'] } }),
          createTimeout(5000)
        ]);

        if (!tripResult) {
          throw new Error('NO TRIP FOUND');
        }

        const [rawListings, application] = await Promise.race([
          Promise.all([
            fetchListings(tripResult.latitude, tripResult.longitude, 100),
            getUserApplication()
          ]),
          createTimeout(15000)
        ]) as [RawListingResult[], typeof application];

        setPageData({
          trip: tripResult,
          listings: rawListings,
          application: application
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.tripId]);

  if (isLoading) {
    return <LoadingTabs />;
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">
          {error.message.includes('timed out')
            ? 'Request took too long. Please try again.'
            : 'Something went wrong. Please try again later.'}
        </h2>
      </div>
    );
  }

  if (!pageData) {
    return <p>NO TRIP FOUND</p>;
  }

  return (
    <TripContextProvider
      tripData={pageData.trip}
      listingData={pageData.listings}
      hasApplicationData={!!pageData.application}
      application={pageData.application || null}
    >
      <TripClientComponent />
    </TripContextProvider>
  );
}
