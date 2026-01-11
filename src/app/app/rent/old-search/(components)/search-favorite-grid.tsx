import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ListingAndImages } from '@/types';
import SearchListingCard from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
// Removed Button and Icon imports as pagination is removed
import { ListingStatus } from '@/constants/enums';
import HoveredListingInfo from './hovered-listing-info';

interface SearchFavoriteGridProps {
  listings: ListingAndImages[];
  withCallToAction?: boolean;
  height?: string;
  cardActions?: (listing: ListingAndImages) => { label: string; action: () => void; }[];
}

const SearchFavoriteGrid: React.FC<SearchFavoriteGridProps> = ({
  listings,
  withCallToAction = false,
  height,
  cardActions
}) => {
  const ITEMS_PER_LOAD = 12; // Load 3 rows for 4 columns, or 4 rows for 3 columns etc.
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const [maxDetailsHeight, setMaxDetailsHeight] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useTripContext();
  const { optimisticApply, optimisticRemoveApply } = actions;
  // Removed pagination state: currentPage, listingsPerPage, infiniteScrollMode, sentinelRef
  const [gridColumns, setGridColumns] = useState(1); // Keep for responsive grid layout

  // Initialize or reset displayed listings when listings change
  useEffect(() => {
    // Start with the first batch of items
    setDisplayedListings(listings.slice(0, ITEMS_PER_LOAD));
  }, [listings]); // Dependency: only listings

  // Load more items when triggered
  const loadMoreItems = useCallback(() => {
    const currentLength = displayedListings.length;
    const moreItemsAvailable = currentLength < listings.length;

    if (moreItemsAvailable) {
      const nextItems = listings.slice(currentLength, currentLength + ITEMS_PER_LOAD);
      setDisplayedListings(prev => [...prev, ...nextItems]);
    }
  }, [displayedListings.length, listings]); // Dependencies for loadMoreItems

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

    // Define the observer options
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
    if (triggerElement && displayedListings.length < listings.length) {
      observer.observe(triggerElement);
    }

    // Cleanup function to disconnect the observer
    return () => {
      observer.disconnect();
    };
    // Dependencies: Re-run when items load, grid changes, or total count changes
  }, [loadMoreItems, displayedListings, gridColumns, listings.length]);

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
    if (cardActions) {
      const actions = cardActions(listing);
      return actions[0]; // Assuming we want the first action as the CTA
    }

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

  // Removed pagination calculation: totalPages
  // Removed pagination rendering function: renderPageNumbers

  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1100) {
        setGridColumns(4); // Increased from 3 to 4 for larger screens
      } else if (width >= 640) {
        setGridColumns(3); // Increased from 2 to 3 for medium screens
      } else {
        setGridColumns(1); // Kept as 1 for mobile
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []); // Keep grid column update logic

  // Removed old IntersectionObserver effect for sentinelRef

  return (
    // Use the height prop for minHeight, keep flex structure
    <div
      className="relative flex flex-col h-full" // Use flex-col and h-full
    >
      {listings.length === 0 ? (
        <div className="flex-grow w-full flex items-center justify-center text-gray-500"> {/* Use flex-grow */}
          No listings to display
        </div>
      ) : (
        <>
          {/* Make ScrollArea grow */}
          <ScrollArea
            ref={scrollAreaRef}
            className={`flex-grow w-[103%] sm:w-full mx-auto rounded-md pb-16 md:pb-2 pr-3`} // Match styling from SearchListingsGrid
            // Remove explicit height style, let flexbox handle it
          >
            <div
              ref={gridRef}
              className="flex flex-wrap gap-4 pb-12"
            >
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
            {/* Sentinel div removed, infinite scroll handled by observer */}
          </ScrollArea>
          {/* Removed Pagination container */}
        </>
      )}
    </div>
  );
};

export default SearchFavoriteGrid;
