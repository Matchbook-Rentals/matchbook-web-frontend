import React from 'react'
import prisma from '@/lib/prismadb'
import Link from 'next/link';
import Sidebar from '@/components/platform-components/sidebar';
import HeaderDisplay from './header-display';
import TripContextProvider from '@/contexts/trip-context-provider';
import { TripHeaderProvider } from '@/contexts/trip-header-provider';
import { Trip } from '@prisma/client';

type TripsPageProps = {
  params: { tripId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const pullTripFromDb = async (tripId) => {
  'use server'

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { favorites: true, matches: true, } })

  if (trip) {
    return trip
  }
}

const pullMockListingsFromDb = async () => {
  'use server';

  try {
    const listings = await prisma.listing.findMany({
      where: {
        id: {
          in: ["1", "2", "3"], // Looks for listings where the value field is either "1", "2", or "3"
        },
      },
    });
    return listings;
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error; // Re-throw the error for further handling
  }
}

export default async function TripLayout({ children, params }: { children: React.ReactNode }) {
  const trip = await pullTripFromDb(params.tripId) as Trip;
  const listings = await pullMockListingsFromDb();

  const links = [
  { 
    displayText: 'New possibilities', 
    path: `/platform/trips/${params.tripId}/search`,
    headerText: `Explore New Possibilities in `
  },
  { 
    displayText: 'Properties you love', 
    path: `/platform/trips/${params.tripId}/favorites`,
    headerText: `Places You Love in `
  },
  { 
    displayText: 'Already applied', 
    path: `/platform/trips/${params.tripId}/applied`,
    headerText: `Applications You've Submitted in `
  },
  { 
    displayText: 'Matches', 
    path: `/platform/trips/${params.tripId}/matches`,
    headerText: `Your Matches in `
  },
  { 
    displayText: 'Rebounds', 
    path: `/platform/trips/${params.tripId}/rebounds`,
    headerText: `Rebounds in `
  },
  { 
    displayText: 'Rejected', 
    path: `/platform/trips/${params.tripId}/rejected`,
    headerText: `Rejected Applications in `
  },
];


  return (
    <TripContextProvider tripData={trip} listingData={listings} pullTripFromDb={pullTripFromDb}>
      <>
          <HeaderDisplay />
        <div className='flex'>

          <Sidebar links={links} />

          <main style={{ flexGrow: 1, padding: '20px' }}>
            {/* Main content will be rendered here */}
            {children}
          </main>
        </div>
      </>
    </TripContextProvider>
  );
}
