import React from 'react'
import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs';


export default async function DashboardPage
  () {
  const { userId } = auth();
  const getTrips = async () => {
    'use server';
    let trips = await prisma.trip.findMany({ where: { userId } })
    return trips;


  }

  let trips = await getTrips();
  console.log(trips);
  return (
    <div>
      <h2 className='text-center text-3xl border-b-2 pb-3'>Your Current Booking</h2>
      <h2 className='text-center text-3xl border-b-2 pb-3'>Your Reserved Bookings </h2>
      <h2 className='text-center text-3xl border-b-2 pb-3'>Your Recent Searches </h2>
      {trips.map((trip, idx) => (
        <p key={trip.id}>
          {trip.id}
        </p>
      ))}

    </div>
  )
}
