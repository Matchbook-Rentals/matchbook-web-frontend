'use client'
import React from 'react'
import MatchBar from './matchBar'
import ListingPhotos from './listingPhotos'
import { Listing } from '@/types'

export default function TripIdPageClient({ listings }: { listings: Listing[] }) {
  const [currIndex, setCurrIndex] = React.useState(0);


  const handleLike = () => {

  }


  return (
    <>
      <MatchBar currListing={listings[currIndex]} />
      <ListingPhotos />
      {listings.length > 0 && (
        <>
          <p className='text-3xl'>{listings[0].description}</p>

        </>
      )}

    </>
  )
}
