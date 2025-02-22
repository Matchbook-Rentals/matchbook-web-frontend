import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ListingAndImages } from '@/types';
import SearchListingCard from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const [maxDetailsHeight, setMaxDetailsHeight] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useTripContext();
  const { optimisticApply, optimisticRemoveApply } = actions;
  const [currentPage, setCurrentPage] = useState(1);
  const [gridColumns, setGridColumns] = useState(1);
  const listingsPerPage = gridColumns * 3;
  const infiniteScrollMode = gridColumns === 1;

  // Subscribe to the selected marker from the map selection store
  const selectedMarker = useMapSelectionStore((state) => state.selectedMarker);

  // *** New: subscribe to visible listings from the map ***
  const visibleListingIds = useVisibleListingsStore((state) => state.visibleListingIds);
  const filteredListings = useMemo(() => {
    if (visibleListingIds === null) return listings;
    return listings.filter(listing => visibleListingIds.includes(listing.id));
  }, [listings, visibleListingIds]);

  // Update displayed listings based on filtered listings
  useEffect(() => {
    if (infiniteScrollMode) {
      setDisplayedListings(filteredListings.slice(0, listingsPerPage));
      setCurrentPage(1);
    } else {
      const startIndex = (currentPage - 1) * listingsPerPage;
      setDisplayedListings(filteredListings.slice(startIndex, startIndex + listingsPerPage));
    }
  }, [filteredListings, infiniteScrollMode, listingsPerPage]);

  useEffect(() => {
    if (infiniteScrollMode && currentPage > 1) {
      const newItems = filteredListings.slice((currentPage - 1) * listingsPerPage, currentPage * listingsPerPage);
      setDisplayedListings(prev => [...prev, ...newItems]);
    }
  }, [currentPage, infiniteScrollMode, filteredListings, listingsPerPage]);

  useEffect(() => {
    if (!infiniteScrollMode) {
      const startIndex = (currentPage - 1) * listingsPerPage;
      setDisplayedListings(filteredListings.slice(startIndex, startIndex + listingsPerPage));
    }
  }, [currentPage, filteredListings, listingsPerPage, infiniteScrollMode]);

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

  const totalPages = Math.ceil(filteredListings.length / listingsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "ghost"}
          className={`w-8 h-8 p-0 rounded-full ${currentPage === i ? 'bg-black text-white hover:bg-black/90' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }
    return pages;
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
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  // Observer for the sentinel to trigger loading more listings
  useEffect(() => {
    if (!infiniteScrollMode) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && displayedListings.length < filteredListings.length) {
          setCurrentPage(prev => prev + 1);
        }
      });
    }, { root: scrollAreaRef.current, threshold: 0.1 });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [infiniteScrollMode, displayedListings, filteredListings]);

  // New effect: update pagination when the selected marker changes
  useEffect(() => {
    // Only update if a marker is selected and if we are in multi-column (pagination) mode.
    if (!selectedMarker || infiniteScrollMode) return;
    const markerListingId = selectedMarker.listing.id;
    const listingIndex = filteredListings.findIndex(listing => listing.id === markerListingId);
    if (listingIndex !== -1) {
      const newPage = Math.floor(listingIndex / listingsPerPage) + 1;
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    }
  }, [selectedMarker, infiniteScrollMode, filteredListings, listingsPerPage, currentPage]);

  return (
    <div className={`relative min-h-[640px] h-[${height ? height : '640px'}] `}>
      {listings.length === 0 ? (
        <div className="h-[640px] w-full flex items-center justify-center text-gray-500">
          No listings to display
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="h-[640px] w-full flex items-center justify-center text-gray-500">
          No listings in that area, Try changing your filters or zooming out to see more listings
        </div>
      ) : (
        <>
          <ScrollArea
            ref={scrollAreaRef}
            className={`w-full mx-auto sm:w-full rounded-md pb-12 px-0 sm:pr-4`}
            style={{ height: height ? `${height}px` : '640px' }}
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
            {infiniteScrollMode && displayedListings.length < filteredListings.length && (
              <div ref={sentinelRef} style={{ height: '20px' }} />
            )}
          </ScrollArea>
          {!infiniteScrollMode && (
            <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-background border-t flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {renderPageNumbers()}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchListingsGrid;
