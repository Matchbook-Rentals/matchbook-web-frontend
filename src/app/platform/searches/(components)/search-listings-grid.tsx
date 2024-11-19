import React, { useEffect, useState } from 'react';
import { ListingAndImages } from '@/types';
import { SearchListingCard } from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SearchListingsGridProps {
  listings: ListingAndImages[];
}

const SearchListingsGrid: React.FC<SearchListingsGridProps> = ({ listings }) => {
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const { state } = useTripContext();
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 12;

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
          className={`w-8 h-8 p-0 ${currentPage === i ? 'bg-black text-white hover:bg-black/90' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }
    return pages;
  };

  return (
    <div className="relative h-[600px]">
      <ScrollArea className="h-[540px] w-full rounded-md p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-12">
          {displayedListings.map((listing) => (
            <SearchListingCard
              key={listing.id}
              listing={listing}
              status={getListingStatus(listing)}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-white border-t flex items-center justify-center gap-1">
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
      </div>
    </div>
  );
};

export default SearchListingsGrid;
