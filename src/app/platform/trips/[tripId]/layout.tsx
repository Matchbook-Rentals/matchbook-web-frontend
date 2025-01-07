import React from 'react'
import { TripContextProvider } from '@/contexts/trip-context-provider';
import LoadingTabs from './LoadingTabs';
import { pullListingsFromDb } from '@/app/actions/listings';
import { getTripById } from '@/app/actions/trips';
import { getUserApplication } from '@/app/actions/applications';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

// Create an error component
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
    const trip = await getTripById(params.tripId, { next: { tags: [`trip-${params.tripId}`, 'user-trips'] } });
    if (!trip) {
      throw new Error('Trip not found. Please check the URL and try again.');
    }

    const [listings, application] = await Promise.all([
      pullListingsFromDb(trip.latitude, trip.longitude, 100),
      getUserApplication()
    ]);

    return (
      <TripContextProvider
        tripData={trip}
        listingData={listings}
        hasApplicationData={!!application}
        application={application || null}
      >
        {children}
      </TripContextProvider>
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
      <TripDataWrapper params={params}>
        {children}
      </TripDataWrapper>
    </React.Suspense>
  );
}
