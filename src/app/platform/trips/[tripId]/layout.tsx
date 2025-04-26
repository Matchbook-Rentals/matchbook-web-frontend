import React from 'react'
import { TripContextProvider } from '@/contexts/trip-context-provider';
import LoadingTabs from './LoadingTabs';
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
  const state = locationArray[locationArray.length-1];

  const listings = await pullListingsFromDb(trip.latitude, trip.longitude, 100, state);
  const application = await getUserApplication();
  const hasApplicationData = !!application;

  //UnComment this line to force permanent render of Suspense
  //await new Promise(() => { });

  return (
    <TripContextProvider
      tripData={trip}
      listingData={listings}
      hasApplicationData={hasApplicationData}
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
    <React.Suspense fallback={<LoadingTabs />}>
      <TripDataWrapper params={params}>
        {children}
      </TripDataWrapper>
    </React.Suspense>
  );
}
