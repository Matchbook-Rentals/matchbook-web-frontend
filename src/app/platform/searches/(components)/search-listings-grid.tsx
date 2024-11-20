import React, { useEffect, useState } from 'react';
import { ListingAndImages } from '@/types';
import SearchListingCard from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface SearchListingsGridProps {
  listings: ListingAndImages[];
  withCallToAction?: boolean;
}

const SearchListingsGrid: React.FC<SearchListingsGridProps> = ({
  listings,
  withCallToAction = false
}) => {
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const { state, actions } = useTripContext();
  const { optimisticApply, optimisticRemoveApply } = actions;
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 9;

  useEffect(() => {
    const startIndex = (currentPage - 1) * listingsPerPage;
    const endIndex = startIndex + listingsPerPage;
    setDisplayedListings(listings.slice(startIndex, endIndex));
  }, [listings, currentPage]);

  const getListingStatus = (listing: ListingAndImages) => {
    if (state.lookup.requestedIds.has(listing.id)) {
      return 'applied'
    }
    if (state.lookup.dislikedIds.has(listing.id)) {
      return 'dislike'
    }
    if (state.lookup.favIds.has(listing.id)) {
      return 'favorite'
    }
    return 'none'
  }

  const getCallToAction = (listing: ListingAndImages, status: string) => {
    if (!withCallToAction) return undefined;

    return status === 'applied'
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

  const totalPages = Math.ceil(listings.length / listingsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if we're near the end
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

  return (
    <div className="relative h-full">
      <ScrollArea className="h-[640px] w-full rounded-md pb-12 pr-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-12">
          {displayedListings.map((listing) => {
            const status = getListingStatus(listing);
            return (
              <SearchListingCard
                key={listing.id}
                listing={listing}
                status={status}
                callToAction={getCallToAction(listing, status)}
              />
            );
          })}
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-white border-t flex items-center justify-center gap-1">
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
    </div>
  );
};

export default SearchListingsGrid;
