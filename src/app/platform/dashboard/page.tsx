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

  const upcomingBookings = trips.filter((trip) => trip?.tripStatus === 'reserved');

  console.log('RESERVED', upcomingBookings)

  return (
    <div>
      <h2 className='text-center text-4xl font-semibold pb-3 mb-10'>Hey there, {userData?.firstName}</h2>
      <CurrentStay />
      <UpcomingBookings upcomingBookings={upcomingBookings} />
      <RecentSearches trips={trips} />
    </div>
  )
}
