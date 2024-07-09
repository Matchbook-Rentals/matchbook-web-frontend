import React, { useContext } from 'react';
import { TripContext } from '@/contexts/trip-context-provider';
import TripListingCard from '../../(trips-components)/trip-listing-card';

export default function DislikedProperties() {
  const tripContext = useContext(TripContext);

  if (tripContext === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }

  const { dislikedListings } = tripContext!;

  if (dislikedListings.length === 0) {
    return <div>No dislikes found for this trip.</div>;
  }

  return (
    <div className="flex justify-center mx-auto w-full  px-2 py-8 border">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 2xl:grid-cols-4 w-full sm:grid-cols-1 gap-2 lg:gap-5 border">
        {dislikedListings.map((listing, index) => (
          <TripListingCard
            key={index}
            listing={listing}
            actions={[{ label: 'Move to likes', action: () => alert('not yet pal') }]}
          />
        ))}
      </div>
    </div>
  );
}
