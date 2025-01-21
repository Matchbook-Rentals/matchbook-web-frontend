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
          className: 'bg-blueBrand text-white hover:bg-blueBrand'
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
          className: 'bg-gray-200 text-gray-900 border border-gray-200 hover:bg-gray-50'
        };
      case Status.Dislike:
        return {
          label: 'Remove',
          action: () => alert('Remove'),
          className: 'bg-pinkBrand text-white hover:bg-pinkBrand'
        };
      default:
        return undefined;
    }
  };

  const getContextLabel = (status: Status) => {
    switch (status) {
      case Status.Applied:
        return {
          label: 'Book Now',
          action: () => alert('Book Now'),
          className: 'bg-blueBrand/80 text-white hover:bg-blueBrand/80'
        };
      case Status.Favorite:
        return {
          label: 'Review',
          action: () => alert('Review'),
          className: 'bg-[#E3CE5B]/80 text-gray-900 hover:bg-[#d4c154]/80'
        };
      case Status.Maybe:
        return {
          label: 'Retract',
          action: () => alert('Retract'),
          className: 'bg-gray-200/80 text-gray-900 border border-gray-200 hover:bg-gray-50/80'
        };
      case Status.Dislike:
        return {
          label: 'Remove',
          action: () => alert('Remove'),
          className: 'bg-pinkBrand/80 text-white hover:bg-pinkBrand/80'
        };
      default:
        return undefined;
    }
  };

  return (
    <>
      {matchedListings.length > 0 && (
        <div className="grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matchedListings.map((listing) => (
            <SearchListingCard
              key={listing.id}
              listing={listing}
              detailsClassName="min-h-[0px]"
              status={getListingStatus(listing.id)}
              callToAction={getCallToAction(getListingStatus(listing.id))}
              contextLabel={getContextLabel(getListingStatus(listing.id))}
            />
          ))}
        </div>
      )}

      {matchedListings.length === 0 && (
        <p>No matched listings found.</p>
      )}

      {/* Test Cards Section */}
      <div className="mt-8 border-t pt-8">
        <h2 className="mb-4 text-lg font-semibold">Test Cards</h2>
        <div className="grid justify-center gap-4 md:grid-cols-2 lg:grid-cols-4">
          {state.listings.slice(-4).map((listing, index) => (
            <SearchListingCard
              key={`test-${listing.id}`}
              listing={listing}
              detailsClassName="min-h-[0px]"
              status={[Status.Applied, Status.Favorite, Status.Maybe, Status.Dislike][index]}
              callToAction={getCallToAction([Status.Applied, Status.Favorite, Status.Maybe, Status.Dislike][index])}
              contextLabel={getContextLabel([Status.Applied, Status.Favorite, Status.Maybe, Status.Dislike][index])}
            />
          ))}
        </div>
      </div>
    </>
  );
}
