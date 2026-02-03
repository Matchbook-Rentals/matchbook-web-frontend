import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ListingAndImages } from '@/types';
import GuestSearchListingCard from './guest-search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGuestTripContext } from '@/contexts/guest-trip-context-provider';
import { ListingStatus } from '@/constants/enums';
import { useMapSelectionStore } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';

interface GuestSearchListingsGridProps {
  listings: ListingAndImages[];
  withCallToAction?: boolean;
  height?: string;
  customSnapshot?: any; // Allow passing custom snapshot with overridden functions
  selectedListingId?: string | null; // ID of listing selected via map marker click
  columnCount?: number; // Dynamic column count from parent (1-4)
  gridGap?: number; // Gap between cards in pixels (default 16)
  tripId?: string;
}

const GuestSearchListingsGrid: React.FC<GuestSearchListingsGridProps> = ({
  listings,
  withCallToAction = false,
  height,
  customSnapshot,
  selectedListingId,
  columnCount,
  gridGap = 16,
  tripId,
}) => {
  const ITEMS_PER_LOAD = 18; // Load 6 rows (18 items for 3 columns)
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const [maxDetailsHeight, setMaxDetailsHeight] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevFilteredIdsRef = useRef<Set<string>>(new Set()); // Ref to store previous IDs

  const { state, actions } = useGuestTripContext();
  const { session } = state;
  const { showAuthPrompt } = actions;

  // Mock optimistic actions for guests
  const optimisticApply = useCallback(async (listingId: string) => {
    showAuthPrompt('apply', listingId);
    return { success: false, message: 'Sign in required' };
  }, [showAuthPrompt]);

  const optimisticRemoveApply = useCallback(async (listingId: string) => {
    showAuthPrompt('apply', listingId);
    return { success: false, message: 'Sign in required' };
  }, [showAuthPrompt]);

  // Create mock trip object from guest session
  const mockTrip = useMemo(() => session ? {
    id: 'guest',
    startDate: session.searchParams.startDate,
    endDate: session.searchParams.endDate,
    latitude: session.searchParams.lat,
    longitude: session.searchParams.lng,
    searchRadius: 100,
    flexibleStart: 0,
    flexibleEnd: 0,
  } : null, [session]);

  // Real snapshot with database persistence for likes/dislikes
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;
  const guestSnapshot = useMemo(() => customSnapshot || {
    isLiked: (id: string) => state.lookup.favIds.has(id),
    isDisliked: (id: string) => state.lookup.dislikedIds.has(id),
    isRequested: () => false, // Guests can't apply yet
    optimisticLike,
    optimisticDislike,
    optimisticRemoveLike,
    optimisticRemoveDislike,
  }, [customSnapshot, state.lookup.favIds, state.lookup.dislikedIds, optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike]);

  const [gridColumns, setGridColumns] = useState(1); // Keep for responsive grid layout

  // *** New: subscribe to visible listings from the map ***
  const visibleListingIds = useVisibleListingsStore((state) => state.visibleListingIds);
  const setVisibleListingIds = useVisibleListingsStore((state) => state.setVisibleListingIds);

  const filteredListings = useMemo(() => {
    // If visibleListingIds is null (meaning no map filter applied or explicitly cleared), show all listings.
    // Otherwise, filter by the IDs visible on the map.
    if (visibleListingIds === null) return listings;
    return listings.filter(listing => visibleListingIds.includes(listing.id));
  }, [listings, visibleListingIds]);

  // Initialize or reset displayed listings only when the actual set of filtered IDs changes
  useEffect(() => {
    const currentFilteredIds = new Set(filteredListings.map(l => l.id));
    const prevFilteredIds = prevFilteredIdsRef.current;

    // Check if the sets of IDs are different
    let setsAreEqual = currentFilteredIds.size === prevFilteredIds.size;
    if (setsAreEqual) {
      for (const id of currentFilteredIds) {
        if (!prevFilteredIds.has(id)) {
          setsAreEqual = false;
          break;
        }
      }
    }

    // Only proceed if the sets are different
    if (!setsAreEqual) {
      // Scroll to top when the list changes
      if (scrollAreaRef.current?.children[0]) { // Access the viewport element within ScrollArea
        const viewport = scrollAreaRef.current.children[1] as HTMLElement;
        viewport.scrollTo({ top: 0, behavior: 'auto' }); // Use smooth scroll
    }

      // Reset displayed list with the first batch of the *new* filtered items
      // No need for setTimeout or loading state handling anymore
      setDisplayedListings(filteredListings.slice(0, ITEMS_PER_LOAD));
      // Update the ref with the new set of IDs
      prevFilteredIdsRef.current = currentFilteredIds;
    }
    // If sets are equal, do nothing in this effect.
    // We still need to update the ref in case the list reference changed but content didn't
    // This ensures the *next* comparison uses the correct previous set.
    else if (prevFilteredIdsRef.current !== currentFilteredIds) { // Optimization: only update ref if needed
       prevFilteredIdsRef.current = currentFilteredIds;
    }

  }, [filteredListings]); // Dependency: still depends on filteredListings to trigger the check

  // Load more items when sentinel becomes visible
  const loadMoreItems = useCallback(() => {
    const currentLength = displayedListings.length;
    const moreItemsAvailable = currentLength < filteredListings.length;

    if (moreItemsAvailable) {
      const nextItems = filteredListings.slice(currentLength, currentLength + ITEMS_PER_LOAD);
      setDisplayedListings(prev => [...prev, ...nextItems]);
    }
  }, [displayedListings.length, filteredListings]); // Dependencies for loadMoreItems

 // Observer to trigger loading more listings based on dynamic element
 useEffect(() => {
   // Define the observer callback
   const observerCallback = (entries: IntersectionObserverEntry[]) => {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         loadMoreItems(); // Call the loading function
       }
     });
   };

   // Define the observer options (no rootMargin needed)
   const observerOptions = {
     root: scrollAreaRef.current, // Observe within the scroll area
     threshold: 0.1 // Trigger when 10% is visible
   };

   // Create the observer instance
   const observer = new IntersectionObserver(observerCallback, observerOptions);

   // Calculate the index of the first item in the second-to-last row
   // Ensure index is not negative and considers grid columns
   const triggerIndex = Math.max(0, displayedListings.length - (gridColumns * 2));
   const triggerElement = gridRef.current?.children[triggerIndex] as HTMLElement;

   // Only observe if the trigger element exists and there are more items to load
   if (triggerElement && displayedListings.length < filteredListings.length) {
     observer.observe(triggerElement);
   }

   // Cleanup function to disconnect the observer
   return () => {
     observer.disconnect();
   };
   // Dependencies: Re-run when items load, grid changes, or filter changes total count
 }, [loadMoreItems, displayedListings, gridColumns, filteredListings.length]);

 const updateMaxDetailsHeight = useCallback(() => {
   if (gridRef.current) {
      setMaxDetailsHeight(0);

      setTimeout(() => {
        const detailsSections = gridRef.current?.getElementsByClassName('listing-details');
        if (!detailsSections) return;

        let tallestDetails = 0;

        Array.from(detailsSections).forEach((section) => {
          const height = section.getBoundingClientRect().height;
          tallestDetails = Math.max(tallestDetails, height);
        });

        if (tallestDetails > 0) {
          setMaxDetailsHeight(tallestDetails);
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    updateMaxDetailsHeight();

    const handleResize = () => {
      updateMaxDetailsHeight();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateMaxDetailsHeight]);

  useEffect(() => {
    updateMaxDetailsHeight();
  }, [displayedListings, updateMaxDetailsHeight]);

  const getListingStatus = useCallback((listing: ListingAndImages) => {
    if (guestSnapshot.isRequested(listing.id)) {
      return ListingStatus.Applied;
    }
    if (guestSnapshot.isDisliked(listing.id)) {
      return ListingStatus.Dislike;
    }
    if (guestSnapshot.isLiked(listing.id)) {
      return ListingStatus.Favorite;
    }
    return ListingStatus.None;
  }, [guestSnapshot]);

  const getCallToAction = useCallback((listing: ListingAndImages, status: ListingStatus) => {
    if (!withCallToAction) return undefined;

    return status === ListingStatus.Applied
      ? {
        label: 'Cancel Application',
        action: () => optimisticRemoveApply(listing.id),
        className: 'bg-pinkBrand text-white'
      }
      : {
        label: 'Apply Now',
        action: () => optimisticApply(listing.id),
        className: 'bg-blueBrand text-white'
      };
  }, [withCallToAction, optimisticApply, optimisticRemoveApply]);

  // Update gridColumns state for infinite scroll observer
  useEffect(() => {
    // If columnCount is provided from parent, use it
    if (columnCount !== undefined) {
      setGridColumns(columnCount);
      return;
    }

    // Fallback: calculate from viewport width (mobile/non-map-tab usage)
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 640) {
        setGridColumns(2);
      } else {
        setGridColumns(1);
        // Reset visible listings filter when in mobile view
        if (visibleListingIds !== null) {
          setVisibleListingIds(null);
        }
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, [columnCount, visibleListingIds, setVisibleListingIds]);

  // Only treat as selected if user explicitly clicked a marker AND we're showing one listing
  const isSelectedListing = visibleListingIds?.length === 1 && selectedListingId !== null;
  const isSingleListing = isSelectedListing; // Only treat as single when explicitly selected

  const getEffectiveHeight = useCallback(() => {
    if (isSingleListing) return 'auto';
    if (!height) return '640px'; // Default height if none provided

    // If height is a string and already contains a unit or calc(), use it directly
    if (typeof height === 'string' && (height.includes('px') || height.includes('vh') || height.includes('%') || height.includes('calc'))) {
      return height;
    }
    // Otherwise, assume it's a number (or a string representing a number) and append 'px'
    return `${height}px`;
  }, [isSingleListing, height]);

  return (
    // Use the height prop for minHeight, keep flex structure
    <div
      className="relative flex flex-col h-full"
      style={{ height: getEffectiveHeight() }} // Auto height for single listing or calculated/default
    >
      {/* --- Original Content --- */}
      {listings.length === 0 ? ( // Show if no listings initially
        <div className="flex-grow w-full flex items-center justify-center text-gray-500"> {/* Use flex-grow */}
          No listings to display
        </div>
      ) : filteredListings.length === 0 ? ( // Show if listings exist but none match filter
        <div className="flex-grow w-full flex items-center justify-center text-gray-500"> {/* Use flex-grow */}
          No listings in that area, Try changing your filters or zooming out to see more listings
        </div>
      ) : ( // Show the grid if there are filtered listings
        <>
          {/* Make ScrollArea grow */}
          <ScrollArea
            ref={scrollAreaRef}
            className={`${isSingleListing ? '' : 'flex-grow'} w-[103%] sm:w-full mx-auto rounded-md pb-16 md:pb-2 pr-3`}
            style={{ height: isSingleListing ? 'auto' : undefined }}
          >
            <div
              ref={gridRef}
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pl-4 justify-items-center ${
                isSelectedListing ? 'md:justify-items-center' : 'justify-items-start'
              } ${isSingleListing ? 'pb-0' : 'pb-12'}`}
              style={{
                gridTemplateColumns: columnCount && !isSelectedListing
                  ? `repeat(${columnCount}, 1fr)`
                  : undefined,
                gap: `${gridGap}px`
              }}
            >
              {displayedListings.map((listing) => {
                const status = getListingStatus(listing);
                return (
                  <GuestSearchListingCard
                    key={listing.id}
                    listing={listing}
                    customSnapshot={guestSnapshot}
                    trip={mockTrip}
                    tripId={tripId}
                    optimisticApply={optimisticApply}
                    optimisticRemoveApply={optimisticRemoveApply}
                    withCallToAction={withCallToAction}
                    status={status}
                    callToAction={getCallToAction(listing, status)}
                    className="listing-card"
                    detailsClassName={`listing-details ${maxDetailsHeight ? 'transition-all duration-200' : ''}`}
                    detailsStyle={{ minHeight: maxDetailsHeight ? `${maxDetailsHeight}px` : undefined }}
                  />
                );
             })}
           </div>
         </ScrollArea>
        </>
      )}
    </div>
  );
};

export default GuestSearchListingsGrid;