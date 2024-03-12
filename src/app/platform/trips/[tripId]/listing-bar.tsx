'use client';
import { Trip, Listing } from '@/types'
import { useRouter } from 'next/navigation';
import React from 'react'

export default function ListingBar({ trip, listing, idx }: { trip: Trip, listing: Listing, idx: number }) {
  const router = useRouter();
  console.log('TRIP ID', trip.id);
  console.log('Listing ID', listing.id);

  const handleClick = () => {
    // router.push(`/platform/trips/${trip.id}`)
    console.log('Make handle Draggable');
  }
  return (
    <div onClick={handleClick} className='flex justify-between border-2 border-slate-400 w-full mx-auto my-3 p-2 rounded-lg shadow-lg text-2xl cursor-pointer'>
      <div className='text-2xl font-semibold mr-3 '>
        {/* {trip.city}, {trip.state} */}
        {idx + 1}.
      </div>
      <div className="">
        Listing photo
      </div>
      <div>
        {listing.title}
      </div>
      <div className=''>
        <span className='mr-3'>&#x1F464;</span>
        {trip.numAdults && trip.numAdults} adults, {trip.numChildren && trip.numChildren} child, {trip.numPets && trip.numPets} pets
      </div>
      <div className='flex flex-col leading-snug'>
        <p>${listing.price}/month</p>
        <p className='text-lg'>{listing.roomCount} bed{listing.roomCount > 1 ? 's' : ''} {listing.bathroomCount} bath{listing.bathroomCount > 1 ? 's' : ''}</p>
        <p className='text-base'>?? miles</p>

      </div>
    </div>
  )
}
