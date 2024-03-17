import React from 'react'
import prisma from '@/lib/prismadb'
import Link from 'next/link';
import Sidebar from '@/components/platform-components/sidebar';

type TripsPageProps = {
  params: { tripId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const pullTripFromDb = async (tripId) => {
  'use server'

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { favorites: true, matches: true, } })

  return trip
}

export default async function TripLayout({ children, params }: { children: React.ReactNode }) {
  const trip = await pullTripFromDb(params.tripId);

  const links = [
    { displayText: 'New possibilities', path: `/platform/trips/${params.tripId}/search`},
    { displayText: 'Properties you love', path: `/platform/trips/${params.tripId}/favorites` },
    { displayText: 'Already applied', path: `/platform/trips/${params.tripId}/applied` },
    { displayText: 'Matches', path: `/platform/trips/${params.tripId}/matches` },
    { displayText: 'Rebounds', path: `/platform/trips/${params.tripId}/rebounds` },
    { displayText: 'Rejected', path: `/platform/trips/${params.tripId}/rejected` },
  ];

  return (
    <>
      <div className='flex'>

        <Sidebar links={links} tripId={params.tripId} baseUrl={`/platform/trips/`} />

        <main style={{ flexGrow: 1, padding: '20px' }}>
          {/* Main content will be rendered here */}
          {children}
        </main>
      </div>
    </>
  );
}
