import { useMemo } from 'react';
import { ListingAndImages } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import {
  FilterOptions,
  ListingWithCalculations,
  TripDates,
  matchesFilters,
  calculateListingAvailability
} from '@/lib/listing-filters';

interface UseFilteredListingsProps {
  listings: ListingAndImages[];
  filters: FilterOptions;
  trip: any; // Using any to match existing trip type
  lookup: {
    favIds: Set<string>;
    dislikedIds: Set<string>;
    requestedIds: Set<string>;
  };
}

interface UseFilteredListingsReturn {
  // All listings with calculated fields
  processedListings: ListingWithCalculations[];
  // Listings that match filters (not liked/disliked/requested)
  showListings: ListingWithCalculations[];
  // Liked listings that also match filters
  likedListings: ListingWithCalculations[];
  // Disliked listings
  dislikedListings: ListingWithCalculations[];
  // Requested listings
  requestedListings: ListingWithCalculations[];
  // Combined display listings (liked + show)
  displayListings: ListingWithCalculations[];
  // Count of filtered listings for preview
  filteredCount: number;
}

/**
 * Hook to centralize all listing filtering and calculation logic
 */
export const useFilteredListings = ({
  listings,
  filters,
  trip,
  lookup
}: UseFilteredListingsProps): UseFilteredListingsReturn => {
  // Filter debugging can be enabled by uncommenting the lines below
  // console.log('🔍 useFilteredListings called with:', {
  //   listingsCount: listings.length,
  //   filters,
  //   lookupCounts: {
  //     favIds: lookup.favIds.size,
  //     dislikedIds: lookup.dislikedIds.size,
  //     requestedIds: lookup.requestedIds.size
  //   }
  // });
  // debugFilterInclusiveness(filters);

  // Process all listings with calculations (price, availability, etc.)
  const processedListings = useMemo(() => {
    const tripDates: TripDates = {
      startDate: trip?.startDate ? new Date(trip.startDate) : null,
      endDate: trip?.endDate ? new Date(trip.endDate) : null,
      flexibleStart: trip?.flexibleStart || 0,
      flexibleEnd: trip?.flexibleEnd || 0
    };

    return listings.map(listing => {
      // Calculate price once
      const calculatedPrice = calculateRent({ listing, trip });

      // Calculate availability once
      const availability = calculateListingAvailability(listing, tripDates);

      return {
        ...listing,
        calculatedPrice,
        ...availability
      };
    });
  }, [listings, trip]);

  // Filter listings that match all criteria and are not liked/disliked (but keep requested)
  const showListings = useMemo(() => {
    return processedListings.filter(listing => {
      const isNotFavorited = !lookup.favIds.has(listing.id);
      const isNotDisliked = !lookup.dislikedIds.has(listing.id);
      // Removed isNotRequested check - we want to show requested listings
      const passesFilters = matchesFilters(listing, filters, false, trip);

      return isNotFavorited &&
        isNotDisliked &&
        passesFilters;
    });
  }, [processedListings, filters, lookup, trip]);

  // Filter liked listings that also match filters
  const likedListings = useMemo(() => {
    return processedListings
      .filter(listing => lookup.favIds.has(listing.id) && matchesFilters(listing, filters, false, trip))
      .sort((a, b) => {
      // Sort by favorite order if needed
      // For now, just return them in order
      return 0;
    });
  }, [processedListings, filters, lookup.favIds, trip]);

  // Get disliked listings (no filter applied)
  const dislikedListings = useMemo(() => {
    return processedListings.filter(listing => lookup.dislikedIds.has(listing.id));
  }, [processedListings, lookup.dislikedIds]);

  // Get requested listings (no filter applied)
  const requestedListings = useMemo(() => {
    return processedListings.filter(listing => lookup.requestedIds.has(listing.id));
  }, [processedListings, lookup.requestedIds]);

  // Combine liked and show listings for display
  const displayListings = useMemo(() => {
    // Create a Set of liked listing IDs for efficient lookup
    const likedIds = new Set(likedListings.map(l => l.id));

    // Filter showListings to exclude already liked ones to avoid duplicates
    const nonLikedShowListings = showListings.filter(listing => !likedIds.has(listing.id));

    // Return liked listings first, then the rest
    return [...likedListings, ...nonLikedShowListings];
  }, [showListings, likedListings]);

  // Calculate filtered count for preview (includes liked listings)
  const filteredCount = useMemo(() => {
    // Get all listings that match filters
    const filteredListings = processedListings.filter(listing =>
      matchesFilters(listing, filters, false, trip)
    );

    // Get IDs of filtered listings
    const filteredIds = new Set(filteredListings.map(l => l.id));

    // Include liked listings that aren't already in the filtered set
    const likedNotInFiltered = processedListings.filter(
      listing => lookup.favIds.has(listing.id) && !filteredIds.has(listing.id)
    );

    return filteredListings.length + likedNotInFiltered.length;
  }, [processedListings, filters, lookup.favIds, trip]);

  return {
    processedListings,
    showListings,
    likedListings,
    dislikedListings,
    requestedListings,
    displayListings,
    filteredCount
  };
};

/**
 * Hook for filter preview calculations (used in filter dialog)
 */
export const useFilterPreview = (
  listings: ListingAndImages[],
  filters: FilterOptions,
  trip: any,
  likedListings: ListingAndImages[],
  dislikedListings: ListingAndImages[] = []
): number => {
  return useMemo(() => {

    const tripDates: TripDates = {
      startDate: trip?.startDate ? new Date(trip.startDate) : null,
      endDate: trip?.endDate ? new Date(trip.endDate) : null,
      flexibleStart: trip?.flexibleStart || 0,
      flexibleEnd: trip?.flexibleEnd || 0
    };

    // Process listings with calculations
    const processedListings = listings.map(listing => {
      const calculatedPrice = calculateRent({ listing, trip });
      const availability = calculateListingAvailability(listing, tripDates);
      return {
        ...listing,
        calculatedPrice,
        ...availability
      };
    });

    // Create set of disliked listing IDs
    const dislikedIds = new Set(dislikedListings.map(l => l.id));

    // Filter listings with debug logging and exclude disliked listings
    const filteredListings = processedListings.filter(listing => {
      const isNotDisliked = !dislikedIds.has(listing.id);
      const passesFilters = matchesFilters(listing, filters, true, trip); // Enable logging for preview
      return isNotDisliked && passesFilters;
    });

    // Process liked listings with same calculations and filters
    const processedLikedListings = likedListings.map(listing => {
      const calculatedPrice = calculateRent({ listing, trip });
      const availability = calculateListingAvailability(listing, tripDates);
      return {
        ...listing,
        calculatedPrice,
        ...availability
      };
    });

    // Apply filters to liked listings
    const filteredLikedListings = processedLikedListings.filter(listing =>
      matchesFilters(listing, filters, true, trip) // Enable logging for liked listings too
    );

    // Get IDs of filtered regular listings
    const filteredIds = new Set(filteredListings.map(l => l.id));

    // Only count liked listings that pass filters AND aren't already in filtered set
    const likedNotInFiltered = filteredLikedListings.filter(
      listing => !filteredIds.has(listing.id)
    );

    const finalCount = filteredListings.length + likedNotInFiltered.length;


    return finalCount;
  }, [listings, filters, trip, likedListings, dislikedListings]);
};