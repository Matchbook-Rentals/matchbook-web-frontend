import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Heart } from 'lucide-react';
import { ListingAndImages } from '@/types';

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
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          {columns.map((column) => (
            <button
              key={column.key}
              onClick={() => handleSort(column.key)}
              className="flex items-center space-x-1"
            >
              <span>{column.label}</span>
              {sortBy === column.key && (
                sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
              )}
            </button>
          ))}
        </div>
        <Button variant="outline">Edit View</Button>
      </div>

      {listings.map((listing) => (
        <Card key={listing.id} className="mb-4">
          <CardContent className="flex items-center p-4">
            <div className="flex items-center w-16">
              <Heart className="text-red-500 mr-2" />
              <span className="font-bold">{listing.rank}</span>
            </div>
            <img src={listing.listingImages[0].url} alt={listing.title} className="w-24 h-16 object-cover mr-4" />
            <div className="flex-grow">
              <h3 className="font-semibold">{listing.title}</h3>
              <div className="grid grid-cols-6 gap-2 text-sm">
                <span>${listing.calculatedPrice.toLocaleString()}</span>
                <span>{listing.rating || 3.5}</span>
                <span>{listing.roomCount}</span>
                <span>{listing.bathroomCount}</span>
                <span>{listing.distance} mi.</span>
                <span>{listing.squareFootage.toLocaleString()}</span>
              </div>
            </div>
            <Button variant="outline" className="ml-4">Apply</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SortableFavorites;