
// Rewritten component as a default export function

import React, { useContext } from 'react';
import { TripContext } from '@/contexts/trip-context-provider';
import ListingCard from '../../(trips-components)/listing-card';

export default function PropertiesYouLoveTab() {
  const tripContext = useContext(TripContext);

  if (tripContext === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }

  const { likedListings } = tripContext!;

  if (likedListings.length === 0) {
    return <div>No favorites found for this trip.</div>;
  }

  return (
    <div className="flex justify-center mx-auto w-full  px-2 py-8 border">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 2xl:grid-cols-4 w-full sm:grid-cols-1 gap-2 lg:gap-5 border">
        {likedListings.map((listing, index) => (
          <ListingCard
            key={index}
            listing={listing}
          />
        ))}
      </div>
    </div>
  );
}
