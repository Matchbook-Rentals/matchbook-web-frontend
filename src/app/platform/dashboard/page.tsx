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
      Hello

    </div>
  )
}
