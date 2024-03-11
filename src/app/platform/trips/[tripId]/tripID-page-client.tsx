'use client'
import React from 'react'
import MatchBar from './matchBar'
import ListingPhotos from './listingPhotos'
import { Listing } from '@/types'

export default function TripIdPageClient({ listings, addListingToFavorites, tripId }: { listings: Listing[], addListingToFavorites: Function, tripId: string }) {
  const [currIndex, setCurrIndex] = React.useState(0);

  const handleLike = async () => {
    await addListingToFavorites(listings[currIndex]?.id, tripId);
    setCurrIndex(prev => prev + 1);
  }

  // Check if there are no listings or we've gone past the last listing
  const noMoreListings = listings.length === 0 || currIndex >= listings.length;

  return (
    <>
      {!noMoreListings ? (
        <>
          <MatchBar currListing={listings[currIndex]} handleLike={handleLike} />
          <ListingPhotos />
          <p className='text-3xl'>{listings[currIndex].description}</p>
        </>
      ) : (
        // Display a message or any other component when there are no more listings
        <>
          <p className="text-xl text-center">No more listings available.</p>
          <button className='bg-primaryBrand mx-auto border-black text-center text-xl' onClick={() => setCurrIndex(0)}>Start again?</button>
        </>
      )}
    </>
  )
}
