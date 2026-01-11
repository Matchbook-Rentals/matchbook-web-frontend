import React from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import SearchListingCard from '../(components)/search-listing-card';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Added imports
import { Button } from '@/components/ui/button'; // Added import
import { BrandButton } from '@/components/ui/brandButton';

enum Status {
  Favorite = 'favorite',
  Dislike = 'dislike',
  Applied = 'applied',
  None = 'none'
}

export function SearchMatchbookTab() {
  const { state } = useTripContext();
  const { matchedListings, trip, lookup } = state;
  const router = useRouter(); // Added hook
  const pathname = usePathname(); // Added hook
  const searchParams = useSearchParams(); // Added hook

  // Added helper function from favorites tab
  const handleTabChange = (action: 'push' | 'prefetch' = 'push') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'recommended');
    const url = `${pathname}?${params.toString()}`;
    router[action](url);
  };

  const getListingStatus = (listingId: string): Status => {
    const status = lookup.matchIds.has(listingId) ? Status.Favorite : Status.None;
    return status;
  };

  const getCallToAction = (status: Status, listingId: string) => {
    const findMatchAndBooking = (listingId: string) => {
      const match = trip?.matches.find(match => match.listingId === listingId);
      return { matchId: match?.id, bookingId: match?.booking?.id };
    };

    switch (status) {
      case Status.Applied:
        return {
          label: 'Book Now',
          action: () => alert('Book Now'),
          className: 'bg-blueBrand text-white hover:bg-blueBrand'
        };
      case Status.Favorite:
        const { matchId, bookingId } = findMatchAndBooking(listingId);
        return {
          label: bookingId ? 'Review Booking' : 'Sign and Book',
          action: () => {
            if (matchId) {
              if (bookingId) {
                router.push(`/app/rent/bookings/${bookingId}`);
              } else {
                router.push(`/app/rent/match/${matchId}`);
              }
            } else {
              alert('Match not found');
            }
          },
          className: 'bg-[#E3CE5B] text-gray-900 hover:bg-[#d4c154]'
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

  const getContextLabel = (status: Status, listingId: string) => {
    const findMatchAndBooking = (listingId: string) => {
      const match = trip?.matches.find(match => match.listingId === listingId);
      return { matchId: match?.id, bookingId: match?.booking?.id };
    };

    switch (status) {
      case Status.Applied:
        return {
          label: 'Book Now',
          action: () => alert('Book Now'),
          className: 'bg-blueBrand/80 text-white hover:bg-blueBrand/80'
        };
      case Status.Favorite:
        const { matchId, bookingId } = findMatchAndBooking(listingId);
        return {
          label: bookingId ? 'Review Booking' : 'Sign and Book',
          action: () => {
            if (matchId) {
              if (bookingId) {
                router.push(`/app/rent/bookings/${bookingId}`);
              } else {
                router.push(`/app/rent/match/${matchId}`);
              }
            } else {
              alert('Match not found');
            }
          },
          className: 'bg-[#E3CE5B]/80 text-gray-900 hover:bg-[#d4c154]/80'
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
        <div className="flex flex-wrap gap-4 pb-12">
          {matchedListings.map((listing) => (
            <SearchListingCard
              key={listing.id}
              listing={listing}
              detailsClassName="min-h-[0px]"
              status={getListingStatus(listing.id)}
              callToAction={getCallToAction(getListingStatus(listing.id), listing.id)}
              contextLabel={getContextLabel(getListingStatus(listing.id), listing.id)}
            />
          ))}
        </div>
      )}

      {matchedListings.length === 0 && (
        // Replaced with structure from favorites tab
        <div className='flex flex-col items-center justify-center h-[50vh]'>
          {(() => {
            handleTabChange('prefetch'); // Prefetch recommended tab
            return null;
          })()}
          <img 
            src="/search-flow/empty-states/empty-listings.png"
            alt="No listings available" 
            className="w-32 h-32 mb-4 opacity-60"
          />
          <p className='font-montserrat-regular text-center text-2xl mb-5'>You haven&apos;t matched with any listings yet!</p>
          <div className='flex justify-center gap-x-2 mt-2'>
            <BrandButton
              variant="default"
              onClick={() => handleTabChange()}
            >
              Show Recommended
            </BrandButton>
          </div>
        </div>
      )}
    </>
  );
}
