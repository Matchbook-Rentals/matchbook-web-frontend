'use client';
import React, { useContext } from 'react'
import { Listing, Trip } from '@prisma/client'
import ListingBar from '../listing-bar'
import TripContextProvider, { TripContext } from '@/contexts/trip-context-provider';
import Link from 'next/link';

export default function RankView() {
  const { trip, listings } = useContext(TripContext)
  const favoriteIds = trip.favorites.map(favorite => favorite.listingId);

  const favoritedListings = listings.filter(listing => favoriteIds.includes(listing.id));
  console.log(favoriteIds);
  console.log(favoritedListings);

  return (
    <>
      <div className='flex justify-start'>
        <div className='flex flex-col gap-4 pl-5 pr-20 w-full'>
          {favoritedListings.length > 0 ? (
            favoritedListings.map((listing: Listing, idx) => (
              <ListingBar listing={listing} trip={trip} idx={idx} key={idx} />
            ))
          ) : (
            <p className="text-lg text-gray-600">
              You haven&apos;t liked any properties for this trip yet. Check out more properties in 
            <Link href={`/platform/trips/${trip.id}/search`}>  <span className="font-semibold"> New possibilities </span></Link>
              to find some you like!
            </p>
          )}
        </div>
      </div>
    </>
  )
}
