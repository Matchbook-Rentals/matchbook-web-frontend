import React from 'react'
import prisma from '@/lib/prismadb'
import { auth, currentUser } from '@clerk/nextjs';
import CurrentStay from './current-stay';
import UpcomingBookings from './upcoming-bookings';
import RecentSearches from './recent-searches';
import { Trip } from '@/types';


export default async function DashboardPage
  () {
  const { userId } = auth();
  const getTrips = async () => {
    'use server';
    let trips = await prisma.trip.findMany({ where: { userId } })
    return trips;
  }

  let trips: Trip[] = await getTrips();
  let userData = await currentUser();


  return (
    <div>
      <h2 className='text-center text-3xl font-semibold border-b-2 pb-3'>Hey there, {userData?.firstName}</h2>
      <CurrentStay />
      <UpcomingBookings trips={trips} />
      <RecentSearches trips={trips} />
      {trips.map((trip, idx) => (
        <p key={trip.id}>
          {trip.id}
        </p>
      ))}

    </div>
  )
}
