import { Trip } from '@/types'
import React from 'react'

export default function TripBar({ trip }: { trip: Trip }) {
  console.log(trip.id);
  return (
    <div className='flex justify-between border-2 border-slate-400 w-3/4 mx-auto my-3 p-2 rounded-lg shadow-lg text-2xl'>
      <div>
        <span className='mr-3'>&#x1F4CD;</span>
        {/* {trip.city}, {trip.state} */}
        {trip.locationString ? trip.locationString : 'Somewhere special'}
      </div>
      <div>
        <span className='mr-3'>&#x1F4C5;</span>
        {/* {trip.city}, {trip.state} */}
        {trip.startDate ? trip.startDate.toLocaleString().slice(0,9) : 'Flexible'} - {trip.endDate ? trip.endDate.toLocaleString().slice(0,9) : 'Flexible'}
      </div>
      <div>
        <span className='mr-3'>&#x1F464;</span>
        {/* {trip.city}, {trip.state} */}
        {trip.numAdults && trip.numAdults} adults, {trip.numChildren && trip.numChildren} children, {trip.numPets && trip.numPets} pets
      </div>
      <div>
        <span className='mr-3'>&#x1F58A;</span>
        {/* {trip.city}, {trip.state} */}
        {trip.tripStatus ? trip.tripStatus : ' Searching'}
      </div>
    </div>
  )
}
