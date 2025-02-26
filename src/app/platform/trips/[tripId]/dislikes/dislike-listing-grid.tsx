import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ListingAndImages } from '@/types';
import SearchListingCard from '@/app/platform/searches/(components)/search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { ListingStatus } from '@/constants/enums';

interface DislikeListingGridProps {
  listings: ListingAndImages[];
  height?: string;
  withCallToAction?: boolean;
  cardActions?: (listing: ListingAndImages) => { label: string; action: () => void; className?: string }[];
}

const DislikeListingGrid: React.FC<DislikeListingGridProps> = ({
  listings,
  height,
  withCallToAction = true,
  cardActions
}) => {
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const [maxDetailsHeight, setMaxDetailsHeight] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useTripContext();
  const { optimisticRemoveDislike } = actions;
  const [currentPage, setCurrentPage] = useState(1);
  const [gridColumns, setGridColumns] = useState(1);
  const listingsPerPage = gridColumns * 3;
  const infiniteScrollMode = gridColumns === 1;
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (infiniteScrollMode) {
      setDisplayedListings(listings.slice(0, listingsPerPage));
      setCurrentPage(1);
    } else {
      const startIndex = (currentPage - 1) * listingsPerPage;
      setDisplayedListings(listings.slice(startIndex, startIndex + listingsPerPage));
    }
  }, [listings, infiniteScrollMode, listingsPerPage]);

  useEffect(() => {
    if (infiniteScrollMode && currentPage > 1) {
      const newItems = listings.slice((currentPage - 1) * listingsPerPage, currentPage * listingsPerPage);
      setDisplayedListings(prev => [...prev, ...newItems]);
    }
  }, [currentPage, infiniteScrollMode, listings, listingsPerPage]);

  useEffect(() => {
    if (!infiniteScrollMode) {
      const startIndex = (currentPage - 1) * listingsPerPage;
      setDisplayedListings(listings.slice(startIndex, startIndex + listingsPerPage));
    }
  }, [currentPage, listings, listingsPerPage, infiniteScrollMode]);

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

  const getCallToAction = (listing: ListingAndImages) => {
    if (!withCallToAction) return undefined;
    if (cardActions) {
      const actions = cardActions(listing);
      return actions[0]; // Assuming we want the first action as the CTA
    }

    return {
      label: 'Remove Dislike',
      action: () => optimisticRemoveDislike(listing.id),
      className: 'bg-pinkBrand text-white'
    };
  };

  const totalPages = Math.ceil(listings.length / listingsPerPage);

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
        setGridColumns(4); // 4 columns for larger screens
      } else if (width >= 640) {
        setGridColumns(3); // 3 columns for medium screens
      } else {
        setGridColumns(1); // 1 column for mobile
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  useEffect(() => {
    if (!infiniteScrollMode) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && displayedListings.length < listings.length) {
          setCurrentPage(prev => prev + 1);
        }
      });
    }, { root: scrollAreaRef.current, threshold: 0.1 });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [infiniteScrollMode, displayedListings, listings]);

  return (
    <div className="relative h-[80vh] md:h-[98vh]" style={{ height: height }}>
      {listings.length === 0 ? (
        <div className="w-full flex items-center justify-center text-gray-500 h-full">
          No disliked properties to display
        </div>
      ) : (
        <>
          <ScrollArea
            ref={scrollAreaRef}
            className="w-[104%] sm:w-full mx-auto rounded-md md:pb-12 pr-4"
            style={{ height: 'calc(100% - 80px)' }}
          >
            <div
              ref={gridRef}
              className="grid grid-cols-1 justify-items-center sm:justify-items-start sm:grid-cols-2 md:grid-cols-3 min-[1100px]:grid-cols-4 gap-8 pb-12"
            >
              {displayedListings.map((listing) => (
                <SearchListingCard
                  key={listing.id}
                  listing={listing}
                  status={ListingStatus.Dislike}
                  callToAction={getCallToAction(listing)}
                  className="listing-card"
                  detailsClassName={`listing-details ${maxDetailsHeight ? 'transition-all duration-200' : ''}`}
                  detailsStyle={{ minHeight: maxDetailsHeight ? `${maxDetailsHeight}px` : undefined }}
                />
              ))}
            </div>
            {infiniteScrollMode && displayedListings.length < listings.length && (
              <div ref={sentinelRef} style={{ height: '20px' }} />
            )}
          </ScrollArea>
          {!infiniteScrollMode && totalPages > 1 && (
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

export default DislikeListingGrid;
