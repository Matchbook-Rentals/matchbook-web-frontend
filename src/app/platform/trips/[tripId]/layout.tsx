import React from 'react'
import { TripContextProvider } from '@/contexts/trip-context-provider';
import LoadingTabs from './LoadingTabs';
import { pullListingsFromDb } from '@/app/actions/listings';
import { getTripById } from '@/app/actions/trips';
import { getUserApplication } from '@/app/actions/applications';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { GlobalErrorBoundary } from '@/components/error-boundary';

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message || "An unexpected error occurred. Please try again later."}
      </AlertDescription>
    </Alert>
  );
}

async function TripDataWrapper({ children, params }: {
  children: React.ReactNode,
  params: { tripId: string }
}) {
  try {
    const trip = await getTripById(params.tripId, {
      next: {
        tags: [`trip-${params.tripId}`, 'user-trips'],
        revalidate: 0 // Disable caching for this request
      }
    });

    if (!trip) {
      throw new Error('Trip not found. Please check the URL and try again.');
    }

    const [listings, application] = await Promise.allSettled([
      pullListingsFromDb(trip.latitude, trip.longitude, 100),
      getUserApplication()
    ]);

    // Handle potential failures in the parallel requests
    const resolvedListings = listings.status === 'fulfilled' ? listings.value : [];
    const resolvedApplication = application.status === 'fulfilled' ? application.value : null;

    if (listings.status === 'rejected') {
      console.error('Failed to load listings:', listings.reason);
    }

    if (application.status === 'rejected') {
      console.error('Failed to load application:', application.reason);
    }

    return (
      <GlobalErrorBoundary>
        <TripContextProvider
          tripData={trip}
          listingData={resolvedListings}
          hasApplicationData={!!resolvedApplication}
          application={resolvedApplication}
        >
          {children}
        </TripContextProvider>
      </GlobalErrorBoundary>
    );
  } catch (error) {
    return <ErrorDisplay error={error instanceof Error ? error : new Error('Failed to load trip data')} />;
  }
}

export default function TripLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: { tripId: string }
}) {
  return (
    <React.Suspense fallback={<LoadingTabs />}>
      <GlobalErrorBoundary>
        <TripDataWrapper params={params}>
          {children}
        </TripDataWrapper>
      </GlobalErrorBoundary>
    </React.Suspense>
  );
}
