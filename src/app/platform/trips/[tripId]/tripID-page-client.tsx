'use client'
import React from 'react'
import MatchBar from './matchBar'
import ListingPhotos from './listingPhotos'
import { Listing } from '@/types'
import RankView from './favorites/page'
import { Trip } from '@prisma/client'

export default function TripIdPageClient({ listings, addListingToFavorites, tripId, trip }: { listings: Listing[], addListingToFavorites: Function, tripId: string, trip: Trip }) {
  const [currIndex, setCurrIndex] = React.useState(0);
  const [showRankView, setShowRankView] = React.useState(false);

  const handleLike = async () => {
    await addListingToFavorites(listings[currIndex]?.id, tripId);
    setCurrIndex(prev => prev + 1);
  }

  // Check if there are no listings or we've gone past the last listing
  const noMoreListings = listings.length === 0 || currIndex >= listings.length;

  console.log(trip);

  return (
    <>
      {showRankView ?
        <RankView listings={listings} trip={trip} />
        : <>
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
              <button className='bg-primaryBrand mx-auto border-black text-center text-xl' onClick={() => setCurrIndex(0)}>Start again?</button>
              <button className='bg-primaryBrand mx-auto border-black text-center text-xl' onClick={() => setShowRankView(true)}>Go to Rank View</button>
            </>
          )}
        </>
      }
    </>
  )
}
