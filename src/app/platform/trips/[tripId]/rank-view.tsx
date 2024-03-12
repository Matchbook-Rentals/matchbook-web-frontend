import React from 'react'
import { Listing, Trip } from '@prisma/client'

export default function RankView({ listings, trip }: { listings: Listing[], trip: Trip }) {
  return (
    <>
      <h1 className='text-center text-3xl border-b w-1/2 mx-auto'>Places you love in {trip.locationString} </h1>
      <div className='flex justify-start'>
        <div className='sidebar border-slate-400 border-2 px-4 text-xl py-2 rounded-2xl flex flex-col'>
          <div className='flex flex-col gap-y-2'>
            <p>New possibilities</p>
            <p>Properties you love</p>
            <p>Already applied</p>
            <p>Matches</p>
            <p>Rebounds</p>
            <p>Rejected</p>
          </div>
          <div className='mt-10'>
            <p>Dashboard</p>
          </div>
        </div>
      </div>

    </>
  )
}
