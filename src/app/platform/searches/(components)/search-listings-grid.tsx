import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ListingAndImages } from '@/types';
import SearchListingCard from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingStatus } from '@/constants/enums';
import HoveredListingInfo from './hovered-listing-info';
import { useMapSelectionStore } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';

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
  const ITEMS_PER_LOAD = 12; // Load 4 rows (12 items for 3 columns)
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const [maxDetailsHeight, setMaxDetailsHeight] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useTripContext();
  const { optimisticApply, optimisticRemoveApply } = actions;
  // const [currentPage, setCurrentPage] = useState(1); // Removed pagination state
  const [gridColumns, setGridColumns] = useState(1); // Keep for responsive grid layout
  // const listingsPerPage = gridColumns * 3; // Removed pagination calculation
  // const infiniteScrollMode = gridColumns === 1; // Removed mode flag

  // Subscribe to the selected marker from the map selection store
  // const selectedMarker = useMapSelectionStore((state) => state.selectedMarker); // Removed - no pagination to update

  // *** New: subscribe to visible listings from the map ***
  const visibleListingIds = useVisibleListingsStore((state) => state.visibleListingIds);
  const setVisibleListingIds = useVisibleListingsStore((state) => state.setVisibleListingIds);

  // Reset visible listings filter when in mobile view (infiniteScrollMode) - Removed, filter applies always unless null
  // useEffect(() => {
  //   if (infiniteScrollMode && visibleListingIds !== null) {
  //     // On small screens, we should show all listings instead of filtering by map visibility
  //     setVisibleListingIds(null);
  //   }
  // }, [infiniteScrollMode, visibleListingIds, setVisibleListingIds]);

  const filteredListings = useMemo(() => {
    // If visibleListingIds is null (meaning no map filter applied or explicitly cleared), show all listings.
    // Otherwise, filter by the IDs visible on the map.
    if (visibleListingIds === null) return listings;
    return listings.filter(listing => visibleListingIds.includes(listing.id));
  }, [listings, visibleListingIds]);

  // Initialize or reset displayed listings when filteredListings change
  useEffect(() => {
    // Start with the first batch of items
    setDisplayedListings(filteredListings.slice(0, ITEMS_PER_LOAD));
  }, [filteredListings]); // Dependency: only filteredListings

  // Load more items when sentinel becomes visible
  const loadMoreItems = useCallback(() => {
    const currentLength = displayedListings.length;
    const moreItemsAvailable = currentLength < filteredListings.length;

    if (moreItemsAvailable) {
      const nextItems = filteredListings.slice(currentLength, currentLength + ITEMS_PER_LOAD);
      setDisplayedListings(prev => [...prev, ...nextItems]);
    }
  }, [displayedListings.length, filteredListings]); // Dependencies for loadMoreItems

  // Observer for the sentinel to trigger loading more listings
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMoreItems(); // Call the loading function
        }
      });
    }, { root: scrollAreaRef.current, threshold: 0.1, rootMargin: "0px 0px 900px 0px" });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadMoreItems]); // Dependency: loadMoreItems function

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

  // const totalPages = Math.ceil(filteredListings.length / listingsPerPage); // Removed pagination calculation

  // const renderPageNumbers = () => { ... }; // Removed pagination rendering function

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

  // Removed Observer for the sentinel (now handled by the main infinite scroll observer)
  // useEffect(() => { ... });

  // Removed effect: update pagination when the selected marker changes
  // useEffect(() => { ... });

  // Removed effect: Check if current page is still valid when listings change
  // useEffect(() => { ... });

  return (
    // Use the height prop for minHeight, keep flex structure
    <div
      className="relative flex flex-col h-full"
      style={{ height: height ? `${height}px` : '640px' }} // Use height prop, provide fallback
    >
      {listings.length === 0 ? (
        <div className="flex-grow w-full flex items-center justify-center text-gray-500"> {/* Use flex-grow */}
          No listings to display
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="flex-grow w-full flex items-center justify-center text-gray-500"> {/* Use flex-grow */}
          No listings in that area, Try changing your filters or zooming out to see more listings
        </div>
      ) : (
        <>
          {/* Make ScrollArea grow */}
          <ScrollArea
            ref={scrollAreaRef}
            className={`flex-grow w-[103%] sm:w-full mx-auto rounded-md md:pb-12 pr-3`}
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
            {/* Sentinel for infinite scroll */}
            {displayedListings.length < filteredListings.length && (
              <div ref={sentinelRef} style={{ height: '20px' }} />
            )}
          </ScrollArea>
          {/* Removed Pagination container */}
          {/* {!infiniteScrollMode && ( ... )} */}
        </>
      )}
    </div>
  );
};

export default SearchListingsGrid;
