import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ListingAndImages } from '@/types';
import { Heart, ThumbsDown, CheckCircle } from 'lucide-react'; // Import icons
import Image from 'next/image';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Combine and sort listings
  const combinedListings: ListingAndImages[] = [
    ...state.requestedListings,
    ...state.likedListings.filter(listing =>
      !state.lookup.requestedIds.has(listing.id)
    )
  ];

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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'dislike': return <ThumbsDown className="h-5 w-5 text-red-500" />;
      case 'favorite': return <Heart className="h-5 w-5 text-pink-500" />;
      default: return null;
    }
  };

  return (
    <ScrollArea className="w-full h-[600px] border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Status</TableHead>
            <TableHead className="w-24">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-20">Rent</TableHead>
            <TableHead className="w-16">Rating</TableHead>
            <TableHead className="w-12">Beds</TableHead>
            <TableHead className="w-12">Baths</TableHead>
            <TableHead className="w-20">Distance</TableHead>
            <TableHead className="w-20">Action</TableHead>
          </TableRow>
        </TableHeader>
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
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>{listing.title}</TableCell>
              <TableCell>${listing.calculatedPrice}</TableCell>
              <TableCell>{listing.rating || 4.9}/5</TableCell>
              <TableCell>{listing.roomCount}</TableCell>
              <TableCell>{listing.bathroomCount}</TableCell>
              <TableCell>{listing.distance.toFixed(1)}mi</TableCell>
              <TableCell>
                {state.lookup.requestedIds.has(listing.id) ? (
                  <Button
                    className="bg-pinkBrand text-white w-full"
                    onClick={() => optimisticRemoveApply(listing)}
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
  );
};

export default SortableFavorites;
