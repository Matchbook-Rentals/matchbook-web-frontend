import React from 'react';
import ListingHorizontalCard from '@/components/ui/listing-horizontal-card';
import { ListingAndImages } from '@/types';

interface SearchListingsGridProps {
  listings: ListingAndImages[];
  currentPage: number;
  setCurrentPage: (pageNumber: number) => void;
}

const SearchListingsGrid: React.FC<SearchListingsGridProps> = ({ listings, currentPage, setCurrentPage }) => {
  const listingsPerPage = 8;

  const indexOfLastListing = currentPage * listingsPerPage;
  const indexOfFirstListing = indexOfLastListing - listingsPerPage;
  const currentListings = listings.slice(indexOfFirstListing, indexOfLastListing);

  const totalPages = Math.ceil(listings.length / listingsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentListings.map((listing) => (
          <ListingHorizontalCard
            key={listing.id}
            imgSrc={listing.listingImages[0]?.url || '/placeholder-image.jpg'}
            title={listing.title}
            status={listing.status}
            address={listing.locationString}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              className={`mx-1 px-3 py-1 rounded ${currentPage === pageNumber ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchListingsGrid;