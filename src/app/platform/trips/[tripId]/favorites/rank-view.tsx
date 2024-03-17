'use client';
import React, { useContext } from 'react';
import { Listing, Trip } from '@prisma/client';
import ListingBar from '../listing-bar';
import TripContextProvider, { TripContext } from '@/contexts/trip-context-provider';
import Link from 'next/link';

export default function RankView() {
  const { trip, listings } = useContext(TripContext);

  // Sort favorites by rank
  const sortedFavorites = [...trip.favorites].sort((a, b) => {
    if (a.rank === null) return 1; // Move a to the end if rank is null
    if (b.rank === null) return -1; // Move b to the end if rank is null
    return a.rank - b.rank;
  });

  // Map over sorted favorites to get an array of listings in the order of their rank
  const favoritedListings = sortedFavorites.map(favorite =>
    listings.find(listing => listing.id === favorite.listingId)
  ).filter(listing => listing !== undefined); // Filter out any undefined listings just in case

  console.log('From Rank View', favoritedListings);

  return (
    <>
      <div className='flex justify-start'>
        <div className='flex flex-col gap-4 pl-5 pr-20 w-full'>
          {favoritedListings.length > 0 ? (
            favoritedListings.map((listing: Listing, idx) => (
              <ListingBar listing={listing} trip={trip} idx={idx} key={listing.id} />
            ))
          ) : (
            <p className="text-lg text-gray-600">
              You haven&apos;t liked any properties for this trip yet. Check out more properties in
              <Link href={`/platform/trips/${trip.id}/search`}><a className="font-semibold"> New possibilities </a></Link>
              to find some you like!
            </p>
          )}
        </div>
      </div>
    </>
  )
}
