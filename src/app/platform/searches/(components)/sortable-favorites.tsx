import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ListingAndImages } from '@/types';
import { Heart, ThumbsDown, CheckCircle } from 'lucide-react'; // Import icons
import Image from 'next/image';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrandHeart, QuestionMarkIcon } from '@/components/icons';

interface SortableFavoritesProps {
  state: {
    lookup: {
      requestedIds: Set<string>;
      dislikedIds: Set<string>;
      favIds: Set<string>;
    };
  };
  onApply: (listing: ListingAndImages) => void;
}

const SortableFavorites: React.FC<SortableFavoritesProps> = ({
  onApply
}) => {
  const { state, actions } = useTripContext();
  const { optimisticApply, optimisticRemoveApply } = actions;

  // Add sorting state
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof ListingAndImages | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Add sorting function
  const sortListings = (listings: ListingAndImages[]) => {
    if (!sortConfig.key) return listings;

    return [...listings].sort((a, b) => {
      if (a[sortConfig.key!] < b[sortConfig.key!]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key!] > b[sortConfig.key!]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Add click handler for table headers
  const requestSort = (key: keyof ListingAndImages) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Modify the combined listings to include sorting
  const combinedListings: ListingAndImages[] = sortListings([
    ...state.requestedListings,
    ...state.likedListings.filter(listing =>
      !state.lookup.requestedIds.has(listing.id)
    )
  ]);

  const getListingStatus = (listing: ListingAndImages) => {
    if (state.lookup.dislikedIds.has(listing.id)) {
      return 'dislike'
    }
    if (state.lookup.favIds.has(listing.id)) {
      return 'favorite'
    }
    return 'none'
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dislike': return <ThumbsDown className="h-8 w-8 p-2 bg-redBrand rounded-full text-white" />;
      case 'favorite': return <BrandHeart className="h-8 w-8 p-2 bg-primaryBrand rounded-full text-white" />;
      default: return null;
    }
  };

  return (
    <div className="w-full border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Status</TableHead>
            <TableHead className="w-24">Image</TableHead>
            <TableHead
              className="cursor-pointer  max-w-24 hover:bg-gray-100"
              onClick={() => requestSort('title')}
            >
              Name {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className=" cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort('calculatedPrice')}
            >
              Rent {sortConfig.key === 'calculatedPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className=" cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort('rating')}
            >
              Rating {sortConfig.key === 'rating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className=" cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort('roomCount')}
            >
              Beds {sortConfig.key === 'roomCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className=" cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort('bathroomCount')}
            >
              Baths {sortConfig.key === 'bathroomCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className=" cursor-pointer hover:bg-gray-100"
              onClick={() => requestSort('distance')}
            >
              Distance {sortConfig.key === 'distance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="w-20">Action</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <ScrollArea className="h-[600px]">
        <Table>
          <TableBody>
            {combinedListings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>{getStatusIcon(getListingStatus(listing))}</TableCell>
                <TableCell>
                  {listing.listingImages[0] && (
                    <div className="relative w-[80px] h-[60px]">
                      <Image
                        src={listing.listingImages[0].url}
                        alt={listing.title}
                        fill
                        className="object-cover rounded"
                        unoptimized
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-28">{listing.title}</TableCell>
                <TableCell>${listing.calculatedPrice}</TableCell>
                <TableCell>{listing.rating || 4.9}/5</TableCell>
                <TableCell>{listing.roomCount}</TableCell>
                <TableCell>{listing.bathroomCount}</TableCell>
                <TableCell>{listing.distance.toFixed(1)}mi</TableCell>
                <TableCell>
                  {state.lookup.requestedIds.has(listing.id) ? (
                    <Button
                      className="bg-pinkBrand text-white w-full"
                      onClick={() => optimisticRemoveApply(listing.id)}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      className="bg-blueBrand text-white w-full"
                      onClick={() => optimisticApply(listing)}
                    >
                      Apply
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default SortableFavorites;
