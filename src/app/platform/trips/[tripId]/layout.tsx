import React from 'react'
import { TripContextProvider } from '@/contexts/trip-context-provider';

import { pullListingsFromDb } from '@/app/actions/listings';
import { getTripById } from '@/app/actions/trips';



export default async function TripLayout({ children, params }: { children: React.ReactNode, params: { tripId: string } }) {
  const trip = await getTripById(params.tripId);
  if (!trip) { return <p> NO TRIP FOUND </p> }

  const listings = await pullListingsFromDb(trip.latitude, trip.longitude, 100);


  return (
    <TripContextProvider
      tripData={trip}
      listingData={listings}>
      {children}
    </TripContextProvider>
  );
}
