import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown, Heart } from 'lucide-react';
import { ListingAndImages } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col">
        <div className="flex justify-between mb-4">
          <div className="w-32"></div>
          <div className="flex-grow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
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
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="w-24">
            <Button variant="outline" className="w-full">Edit View</Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {listings.map((listing) => (
            <Card key={listing.id} className="mb-4">
              <CardContent className="flex items-center p-4">
                <div className="w-32 flex-shrink-0 mr-4">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="text-red-500 mr-2" />
                    <span className="font-bold">{listing.rank}</span>
                  </div>
                  <img
                    src={listing.listingImages[0].url}
                    alt={listing.title}
                    className="w-32 h-24 object-cover mb-2"
                  />
                  <h3 className="font-semibold text-sm text-center">{listing.title}</h3>
                </div>
                <div className="flex-grow overflow-x-auto">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="w-32">${listing.calculatedPrice.toLocaleString()}</TableCell>
                        <TableCell className="w-32">{listing.rating || 3.5}</TableCell>
                        <TableCell className="w-32">{listing.roomCount} beds</TableCell>
                        <TableCell className="w-32">{listing.bathroomCount} baths</TableCell>
                        <TableCell className="w-32">{listing.distance.toFixed(1)} mi.</TableCell>
                        <TableCell className="w-32">{listing.squareFootage.toLocaleString()} sqft</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="w-24 flex-shrink-0 ml-4">
                  <Button variant="outline" className="w-full">Apply</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};

export default SortableFavorites;