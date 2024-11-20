import React from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import SearchListingCard from '../(components)/search-listing-card';

enum Status {
  Favorite = 'favorite',
  Dislike = 'dislike',
  Applied = 'applied',
  Maybe = 'maybe',
  None = 'none'
}

export function SearchMatchbookTab() {
  const { state } = useTripContext();
  const { matchedListings, trip, lookup } = state;

  if (matchedListings.length === 0) {
    return <p>No matched listings found.</p>;
  }

  const getListingStatus = (listingId: string): Status => {
    const status = lookup.matchIds.has(listingId) ? Status.Favorite : Status.None;
    return status;
  };

  const getCallToAction = (status: Status) => {
    switch (status) {
      case Status.Applied:
        return {
          label: 'Book Now',
          action: () => alert('Book Now'),
          className: 'bg-blue-600 text-white hover:bg-blue-700'
        };
      case Status.Favorite:
        return {
          label: 'Review',
          action: () => alert('Review'),
          className: 'bg-[#E3CE5B] text-gray-900 hover:bg-[#d4c154]'
        };
      case Status.Maybe:
        return {
          label: 'Retract',
          action: () => alert('Retract'),
          className: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
        };
      case Status.Dislike:
        return {
          label: 'Remove',
          action: () => alert('Remove'),
          className: 'bg-pink-600 text-white hover:bg-pink-700'
        };
      default:
        return undefined;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matchedListings.map((listing) => (
        <SearchListingCard
          key={listing.id}
          listing={listing}
          status={getListingStatus(listing.id)}
          callToAction={getCallToAction(getListingStatus(listing.id))}
          contextLabel={getCallToAction(getListingStatus(listing.id))}
        />
      ))}
    </div>
  );
}
