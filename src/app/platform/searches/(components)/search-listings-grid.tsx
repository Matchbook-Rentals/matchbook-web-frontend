import React, { useEffect, useState } from 'react';
import { ListingAndImages } from '@/types';
import { SearchListingCard } from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTripContext } from '@/contexts/trip-context-provider';
import { Button } from "@/components/ui/button";

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

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayedListings.map((listing) => (
          <SearchListingCard
            key={listing.id}
            listing={listing}
            status={getListingStatus(listing)}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <Button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          variant="outline"
        >
          Previous
        </Button>
        <span className="flex items-center px-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </ScrollArea>
  );
};

export default SearchListingsGrid;
