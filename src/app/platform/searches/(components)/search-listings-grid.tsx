import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ListingAndImages } from '@/types';
import SearchListingCard from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingStatus } from '@/constants/enums';
import HoveredListingInfo from './hovered-listing-info';
import { useMapSelectionStore } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { Loader2 } from 'lucide-react'; // <-- Import a spinner icon

interface SearchListingsGridProps {
  listings: ListingAndImages[];
  withCallToAction?: boolean;
  height?: string;
}

const SearchListingsGrid: React.FC<SearchListingsGridProps> = ({
  listings,
  withCallToAction = false,
  height
}) => {
  const ITEMS_PER_LOAD = 18; // Load 6 rows (18 items for 3 columns)
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const [isLoading, setIsLoading] = useState(false); // <-- Add loading state
  const [maxDetailsHeight, setMaxDetailsHeight] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevFilteredIdsRef = useRef<Set<string>>(new Set()); // Ref to store previous IDs
  // const sentinelRef = useRef<HTMLDivElement>(null); // Removed sentinel ref
  const { state, actions } = useTripContext();
  const { optimisticApply, optimisticRemoveApply } = actions;
  // const [currentPage, setCurrentPage] = useState(1); // Removed pagination state
  const [gridColumns, setGridColumns] = useState(1); // Keep for responsive grid layout
  // const listingsPerPage = gridColumns * 3; // Removed pagination calculation

  // Subscribe to the selected marker from the map selection store
   //const selectedMarker = useMapSelectionStore((state) => state.selectedMarker); // Removed - no pagination to update

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
      // Indicate loading is starting
      setIsLoading(true);

      // Scroll to top
    if (scrollAreaRef.current?.children[0]) { // Access the viewport element within ScrollArea
        const viewport = scrollAreaRef.current.children[0] as HTMLElement;
        viewport.scrollTo({ top: 0, behavior: 'smooth' }); // Use smooth scroll
    }

    // Use setTimeout to allow the loading state and scroll to potentially render first
    const timer = setTimeout(() => {
      // Reset displayed list with the first batch of the *new* filtered items
      setDisplayedListings(filteredListings.slice(0, ITEMS_PER_LOAD));
        // Stop loading
        setIsLoading(false);
        // Update the ref with the new set of IDs *after* the state update logic
        prevFilteredIdsRef.current = currentFilteredIds;
      }, 50); // Small delay (e.g., 50ms) might improve spinner visibility

      // Cleanup timeout if the effect re-runs before it fires
      return () => clearTimeout(timer);
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

  const getListingStatus = (listing: ListingAndImages) => {
    if (state.lookup.requestedIds.has(listing.id)) {
      return ListingStatus.Applied;
    }
    if (state.lookup.dislikedIds.has(listing.id)) {
      return ListingStatus.Dislike;
    }
    if (state.lookup.favIds.has(listing.id)) {
      return ListingStatus.Favorite;
    }
    return ListingStatus.None;
  };

  const getCallToAction = (listing: ListingAndImages, status: ListingStatus) => {
    if (!withCallToAction) return undefined;

    return status === ListingStatus.Applied
      ? {
        label: 'Cancel Application',
        action: () => optimisticRemoveApply(listing.id),
        className: 'bg-pinkBrand text-white'
      }
      : {
        label: 'Apply Now',
        action: () => optimisticApply(listing),
        className: 'bg-blueBrand text-white'
      };
  };

  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1100) {
        setGridColumns(3);
      } else if (width >= 640) {
        setGridColumns(2);
      } else {
        setGridColumns(1);
        // Reset visible listings filter when in mobile view
        // Note: This reset logic might need reconsideration. If the map filter
        // should *always* apply regardless of screen size, this 'if' block
        // should be removed entirely. For now, keeping the original behavior.
        if (visibleListingIds !== null) {
          setVisibleListingIds(null);
        }
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, [visibleListingIds, setVisibleListingIds]); // Keep dependencies for now as reset logic is tied to them


  return (
    // Use the height prop for minHeight, keep flex structure
    <div
      className="relative flex flex-col h-full"
      style={{ height: height ? `${height}px` : '640px' }} // Use height prop, provide fallback
    >
      {/* --- Loading Spinner Overlay --- */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blueBrand" />
        </div>
      )}

      {/* --- Original Content --- */}
      {!isLoading && listings.length === 0 ? ( // Hide original content when loading
        <div className="flex-grow w-full flex items-center justify-center text-gray-500"> {/* Use flex-grow */}
          No listings to display
        </div>
      ) : !isLoading && filteredListings.length === 0 ? ( // Hide original content when loading
        <div className="flex-grow w-full flex items-center justify-center text-gray-500"> {/* Use flex-grow */}
          No listings in that area, Try changing your filters or zooming out to see more listings
        </div>
      ) : !isLoading && ( // Hide original content when loading
        <>
          {/* Make ScrollArea grow */}
          <ScrollArea
            ref={scrollAreaRef}
            className={`flex-grow w-[103%] sm:w-full h-${height}px mx-auto rounded-md md:pb-2 pr-3`}
            // Remove explicit height style, let flexbox handle it
          >
            <div ref={gridRef} className="grid grid-cols-1 justify-items-center sm:justify-items-start sm:grid-cols-2 min-[1100px]:grid-cols-3 gap-8 pb-12">
              {displayedListings.map((listing) => {
                const status = getListingStatus(listing);
                return (
                  <SearchListingCard
                    key={listing.id}
                    listing={listing}
                    status={status}
                    callToAction={getCallToAction(listing, status)}
                    className="listing-card"
                    detailsClassName={`listing-details ${maxDetailsHeight ? 'transition-all duration-200' : ''}`}
                    detailsStyle={{ minHeight: maxDetailsHeight ? `${maxDetailsHeight}px` : undefined }}
                  />
                );
             })}
           </div>
           {/* Sentinel div removed */}
         </ScrollArea>
         {/* Removed Pagination container */}
          {/* {!infiniteScrollMode && ( ... )} */}
        </>
      )}
    </div>
  );
};

export default SearchListingsGrid;
