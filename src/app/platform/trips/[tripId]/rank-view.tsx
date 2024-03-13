import React from 'react'
import { Listing, Trip } from '@prisma/client'
import ListingBar from './listing-bar'

export default function RankView({ listings, trip }: { listings: Listing[], trip: Trip }) {
  const  favoriteIds  = trip.favorites.map(favorite => favorite.listingId);

  const favoritedListings = listings.filter(listing => favoriteIds.includes(listing.id));
  console.log(favoriteIds);
  console.log(favoritedListings);

  return (
    <>
      <h1 className='text-center text-3xl border-b w-1/2 mx-auto'>Places you love in {trip.locationString} </h1>
      <div className='flex justify-start'>
        <div className='sidebar w-1/5 border-slate-400 border-2 px-4 text-xl py-2 rounded-2xl flex flex-col'>
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
        <div className='flex flex-col gap-4 border pl-5 pr-20 w-full'>
          {favoritedListings.map((listing: Listing, idx) => (
            <ListingBar listing={listing} trip={trip} idx={idx} key={idx} />
          ))}
        </div>
      </div>

    </>
  )
}
