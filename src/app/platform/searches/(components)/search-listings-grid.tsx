import React, { useEffect, useRef, useState } from 'react';
import { ListingAndImages } from '@/types';
import { SearchListingCard } from './search-listing-card';
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchListingsGridProps {
  listings: ListingAndImages[];
}

const SearchListingsGrid: React.FC<SearchListingsGridProps> = ({ listings }) => {
  const [displayedListings, setDisplayedListings] = useState<ListingAndImages[]>([]);
  const [page, setPage] = useState(1);
  const loader = useRef(null);

  const listingsPerPage = 10;

  useEffect(() => {
    setDisplayedListings(listings.slice(0, listingsPerPage));
  }, [listings]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1 });
    if (loader.current) {
      observer.observe(loader.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleObserver = (entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting) {
      loadMore();
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const nextListings = listings.slice(0, nextPage * listingsPerPage);
    setDisplayedListings(nextListings);
    setPage(nextPage);
  };

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedListings.map((listing) => (
          <SearchListingCard
            key={listing.id}
            listing={listing}
          />
        ))}
      </div>
      {displayedListings.length < listings.length && (
        <div ref={loader} className="mt-4 text-center">
          Loading more...
        </div>
      )}
    </ScrollArea>
  );
};

export default SearchListingsGrid;