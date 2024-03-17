'use client'
import React, { useContext } from 'react'
import MatchBar from './matchBar'
import ListingPhotos from './listingPhotos'
import { Listing } from '@/types'
import RankView from './favorites/rank-view'
import { Trip } from '@prisma/client'
import { TripContext } from '@/contexts/trip-context-provider'
import Link from 'next/link'

export default function TripIdPageClient({ addListingToFavorites }: { listings: Listing[], addListingToFavorites: Function, tripId: string, trip: Trip }) {
  const [currIndex, setCurrIndex] = React.useState(0);
  const [showRankView, setShowRankView] = React.useState(false);
  const { trip, listings } = useContext(TripContext);

  const handleLike = async () => {
    await addListingToFavorites(listings[currIndex]?.id, trip.Id);
    setCurrIndex(prev => prev + 1);
  }

  // Check if there are no listings or we've gone past the last listing
  const noMoreListings = listings.length === 0 || currIndex >= listings.length;

  console.log(trip);

  return (
    <>
      <>
        {!noMoreListings ? (
          <>
            <MatchBar setShowRankView={setShowRankView} currListing={listings[currIndex]} handleLike={handleLike} />
            <ListingPhotos />
            <p className='text-3xl'>{listings[currIndex].description}</p>
          </>
        ) : (
          // Display a message or any other component when there are no more listings
          <>
            <p className="text-xl text-center">No more listings available.</p>
            <button className='bg-primaryBrand py-1 px-2 m-2  border-black text-center text-xl' onClick={() => setCurrIndex(0)}>Start again?</button>
            <Link href={`platform/trips/${trip.id}/favorites`}><button className='bg-primaryBrand py-1 px-2 m-2  border-black text-center text-xl' >Rank your favorites</button></Link>
          </>
        )}
      </>

    </>
  )
}
