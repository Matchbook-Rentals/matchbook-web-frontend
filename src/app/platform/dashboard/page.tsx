import React from 'react'
import prisma from '@/lib/prismadb'
import { auth, currentUser } from '@clerk/nextjs';
import CurrentStay from './current-stay';
import UpcomingBookings from './upcoming-bookings';
import RecentSearches from './recent-searches';


export default async function DashboardPage
  () {
  const { userId } = auth();
  const getTrips = async () => {
    'use server';
    let trips = await prisma.trip.findMany({ where: { userId } })
    return trips;
  }

  let trips = await getTrips();
  let userData = await currentUser();

  console.log(userData);

  return (
    <div>
      <h2 className='text-center text-3xl font-semibold border-b-2 pb-3'>Hey there, {userData?.firstName}</h2>
      <CurrentStay />
      <UpcomingBookings />
      <RecentSearches />
      {trips.map((trip, idx) => (
        <p key={trip.id}>
          {trip.id}
        </p>
      ))}

    </div>
  )
}
