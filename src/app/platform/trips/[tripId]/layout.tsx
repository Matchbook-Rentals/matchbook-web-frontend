import React from 'react'
import { TripContextProvider } from '@/contexts/trip-context-provider';

import { pullListingsFromDb } from '@/app/actions/listings';
import { getTripById } from '@/app/actions/trips';
import { getUserApplication } from '@/app/actions/applications';



export default async function TripLayout({ children, params }: { children: React.ReactNode, params: { tripId: string } }) {
  const trip = await getTripById(params.tripId);
  if (!trip) { return <p> NO TRIP FOUND </p> }

  const listings = await pullListingsFromDb(trip.latitude, trip.longitude, 100);
  const application = await getUserApplication();
  // check if application is truthy or falsy and assign that value
  const hasApplicationData = !!application;

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
