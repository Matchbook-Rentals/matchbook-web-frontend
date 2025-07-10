'use client';
import { Trip } from '@/types'
import { useRouter } from 'next/navigation';
import React from 'react'

export default function TripBar({ trip }: { trip: Trip }) {
  const router = useRouter();
  console.log(trip.id);

  const handleClick = () => {
    router.push(`/app/searches/${trip.id}`)
  }
  return (
    <div onClick={handleClick} className='flex justify-between border-2 border-slate-400 w-3/4 mx-auto my-3 p-2 rounded-lg shadow-lg text-2xl cursor-pointer'>
      <div className='w-1/4'>
        <span className='mr-3'>&#x1F4CD;</span>
        {/* {trip.city}, {trip.state} */}
        {trip.locationString ? trip.locationString : 'Somewhere special'}
      </div>
      <div className='w-1/4'>
        <span className='mr-3'>&#x1F4C5;</span>
        {
          trip.startDate ?
            trip.startDate.toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: '2-digit'
            }) :
            'Flexible'
        } - {
          trip.endDate ?
            trip.endDate.toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: '2-digit'
            }) :
            'Flexible'
        }

      </div>
      <div className=''>
        <span className='mr-3'>&#x1F464;</span>
        {trip.numAdults && trip.numAdults} adults, {trip.numChildren && trip.numChildren} child, {trip.numPets && trip.numPets} pets
      </div>
      <div className='w-1/6'>
        <span className='mr-3'>&#x1F58A;</span>
        {trip.tripStatus ? trip.tripStatus : ' Searching'}
      </div>
    </div>
  )
}
