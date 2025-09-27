import React from 'react'
import { TripContextProvider } from '@/contexts/trip-context-provider';
import LoadingTabs from './LoadingTabs';
import DynamicFallback from './DynamicFallback';
import { pullListingsFromDb } from '@/app/actions/listings';
import { getTripById } from '@/app/actions/trips';
import { getUserApplication } from '@/app/actions/applications';

async function TripDataWrapper({ children, params }: {
  children: React.ReactNode,
  params: { tripId: string }
}) {
  const trip = await getTripById(params.tripId, { next: { tags: [`trip-${params.tripId}`, 'user-trips'] } });
  if (!trip) { return <p> NO TRIP FOUND </p> }

  const locationArray = trip.locationString.split(',');
  const state = locationArray[locationArray.length - 1];

  // Calculate latest possible start date by adding flexible days to start date
  let latestStart, earliestEnd;

  if (!trip.startDate) {
    latestStart = new Date();
  }
  else {
    latestStart = new Date(trip.startDate);
    latestStart.setDate(latestStart.getDate() + trip.flexibleStart);
  }

  if (!trip.endDate) {
    earliestEnd = new Date();
    earliestEnd.setMonth(earliestEnd.getMonth() + 1);
  }
  else {
    earliestEnd = new Date(trip.endDate);
    earliestEnd.setDate(earliestEnd.getDate() + trip.flexibleEnd);
  }


  const listings = await pullListingsFromDb(trip.latitude, trip.longitude, 100, state, latestStart, earliestEnd);
  const application = await getUserApplication();

  console.log('🔍 [TripLayout] Application data debug:', {
    exists: !!application,
    isComplete: application?.isComplete,
    applicationId: application?.id,
    userId: trip.userId,
    firstName: application?.firstName,
    lastName: application?.lastName,
    createdAt: application?.createdAt
  });

  //UnComment this line to force permanent render of Suspense
  //await new Promise(() => { });

  return (
    <TripContextProvider
      tripData={trip}
      listingData={listings}
      application={application || null}
    >
      {children}
    </TripContextProvider>
  );
}

export default function TripLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: { tripId: string }
}) {
  return (
    <React.Suspense fallback={<DynamicFallback />}>
      <TripDataWrapper params={params}>
        {children}
      </TripDataWrapper>
    </React.Suspense>
  );
}
