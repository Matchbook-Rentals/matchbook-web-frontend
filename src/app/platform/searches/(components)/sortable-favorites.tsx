import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown, Heart } from 'lucide-react';
import { ListingAndImages } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Listing {
  id: number;
  rank: number;
  image: string;
  name: string;
  price: number;
  rating: number;
  beds: number;
  baths: number;
  distance: number;
  sqft: number;
}

interface SortableFavoritesProps {
  listings: ListingAndImages[];
}

const SortableFavorites: React.FC<SortableFavoritesProps> = ({ listings: initialListings }) => {
  const [listings, setListings] = useState(initialListings);
  const [sortBy, setSortBy] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const columns = [
    { key: 'rank', label: 'Listing' },
    { key: 'calculatedPrice', label: 'Price' },
    { key: 'rating', label: 'Rating' },
    { key: 'roomCount', label: 'Beds' },
    { key: 'bathroomCount', label: 'Baths' },
    { key: 'distance', label: 'Distance' },
    { key: 'squareFootage', label: 'Sqft' },
  ];

  const handleSort = (criteria: string) => {
    if (sortBy === criteria) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortDirection('asc');
    }

    const sortedListings = [...listings].sort((a, b) => {
      const aValue = a[criteria as keyof ListingAndImages];
      const bValue = b[criteria as keyof ListingAndImages];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setListings(sortedListings);
  };

  return (
    <div className="w-full max-w-full mx-auto">
      <ScrollArea className="h-[calc(100vh-100px)]">
        <div className="min-w-[1200px]">
          <Table className='overflow-x-scroll'>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead className="w-48">
                  <button
                    onClick={() => handleSort('rank')}
                    className="flex items-center justify-start space-x-1 w-full"
                  >
                    <span>Listing</span>
                    {sortBy === 'rank' && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </button>
                </TableHead>
                {columns.slice(1).map((column) => (
                  <TableHead key={column.key} className="w-32">
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center justify-center space-x-1 w-full"
                    >
                      <span>{column.label}</span>
                      {sortBy === column.key && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </button>
                  </TableHead>
                ))}
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="w-16">
                    <div className="flex items-center justify-center">
                      <Heart className="text-red-500 mr-2" />
                      <span className="font-bold">{listing.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-48">
                    <div className="flex-col items-center">
                      <img
                        src={listing.listingImages[0].url}
                        alt={listing.title}
                        className="w-24 h-12 object-cover mr-2"
                      />
                      <span className="font-semibold text-sm">{listing.title.slice(0, 18)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-32">${listing.calculatedPrice.toLocaleString()}</TableCell>
                  <TableCell className="w-32">{listing.rating || 3.5}</TableCell>
                  <TableCell className="w-32">{listing.roomCount} beds</TableCell>
                  <TableCell className="w-32">{listing.bathroomCount} baths</TableCell>
                  <TableCell className="w-32">{listing.distance.toFixed(1)} mi.</TableCell>
                  <TableCell className="w-32">{listing.squareFootage.toLocaleString()} sqft</TableCell>
                  <TableCell className="w-24">
                    <Button variant="outline" className="w-full">Apply</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SortableFavorites;