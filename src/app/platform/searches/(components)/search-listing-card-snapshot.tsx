import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListingAndImages } from '@/types';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { formatDate } from '@/lib/utils';
import { ListingStatus } from '@/constants/enums';
import dynamic from 'next/dynamic';
import { useListingsSnapshot } from '@/hooks/useListingsSnapshot';
import { useTripContext } from '@/contexts/trip-context-provider';

// Dynamically import Carousel to avoid SSR issues
const Carousel = dynamic(() => import('@/components/ui/carousel').then(mod => mod.Carousel), { ssr: false });
const CarouselContent = dynamic(() => import('@/components/ui/carousel').then(mod => mod.CarouselContent), { ssr: false });
const CarouselItem = dynamic(() => import('@/components/ui/carousel').then(mod => mod.CarouselItem), { ssr: false });
const CarouselPrevious = dynamic(() => import('@/components/ui/carousel').then(mod => mod.CarouselPrevious), { ssr: false });
const CarouselNext = dynamic(() => import('@/components/ui/carousel').then(mod => mod.CarouselNext), { ssr: false });

interface SearchListingCardProps {
  listing: ListingAndImages;
  status?: ListingStatus;
  callToAction?: {
    label: string;
    action: () => void;
    className?: string;
  };
  className?: string;
  detailsClassName?: string;
  detailsStyle?: React.CSSProperties;
  customSnapshot?: any; // Allow passing custom snapshot with overridden functions
}

const SearchListingCardSnapshot: React.FC<SearchListingCardProps> = ({
  listing,
  callToAction,
  className = '',
  detailsClassName = '',
  detailsStyle = {},
  customSnapshot
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const { setHoveredListing, panToLocation } = useListingHoverStore();
  const { state } = useTripContext();
  const router = useRouter();

  // Either use the custom snapshot passed in or fall back to the hook
  const listingSnapshot = customSnapshot || useListingsSnapshot();
  
  // Determine status from snapshot instead of props
  const getStatus = useCallback(() => {
    if (listingSnapshot.isRequested(listing.id)) {
      return ListingStatus.Applied;
    }
    if (listingSnapshot.isDisliked(listing.id)) {
      return ListingStatus.Dislike;
    }
    if (listingSnapshot.isLiked(listing.id)) {
      return ListingStatus.Favorite;
    }
    return ListingStatus.None;
  }, [listing.id, listingSnapshot]);

  const status = getStatus();

  // Handlers for actions using snapshot
  const handleLike = async () => {
    await listingSnapshot.optimisticLike(listing.id);
  };

  const handleDislike = async () => {
    await listingSnapshot.optimisticDislike(listing.id);
  };

  const handleRemoveLike = async () => {
    await listingSnapshot.optimisticRemoveLike(listing.id);
  };

  const handleRemoveDislike = async () => {
    await listingSnapshot.optimisticRemoveDislike(listing.id);
  };
  
  // Function to handle "show on map" click
  const handleShowOnMap = () => {
    panToLocation(listing.latitude, listing.longitude);
  };

  // Functions to handle mouse events for hover state
  const handleMouseEnter = () => {
    setIsCardHovered(true);
    setHoveredListing(listing);
  };

  const handleMouseLeave = () => {
    setIsCardHovered(false);
    setHoveredListing(null);
  };

  const handleImageMouseEnter = () => {
    setIsHovered(true);
  };

  const handleImageMouseLeave = () => {
    setIsHovered(false);
  };

  // Format price
  const formattedPrice = listing.price ? `$${listing.price.toLocaleString()}` : 'Contact for price';

  // Determine primary image and other images
  const primaryImage = listing.listingImages?.[0]?.url || '/placeholderImages/image_1.jpg';
  const images = listing.listingImages || [];

  // Determine date formatting
  const dateStart = listing.availableStart ? formatDate(new Date(listing.availableStart)) : null;
  const dateEnd = listing.availableEnd ? formatDate(new Date(listing.availableEnd)) : null;

  const renderActionButtons = () => {
    switch (status) {
      case ListingStatus.Favorite:
        return (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleRemoveLike}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
            >
              Unlike
            </button>
            {callToAction && (
              <button
                onClick={callToAction.action}
                className={`flex-1 px-3 py-1 rounded transition-colors ${callToAction.className}`}
              >
                {callToAction.label}
              </button>
            )}
          </div>
        );
      case ListingStatus.Dislike:
        return (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleRemoveDislike}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
            >
              Undislike
            </button>
          </div>
        );
      case ListingStatus.Applied:
        return callToAction ? (
          <div className="flex gap-2 mt-3">
            <button
              onClick={callToAction.action}
              className={`flex-1 px-3 py-1 rounded transition-colors ${callToAction.className}`}
            >
              {callToAction.label}
            </button>
          </div>
        ) : null;
      default:
        return (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleLike}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
            >
              Like
            </button>
            <button
              onClick={handleDislike}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
            >
              Dislike
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className={`w-full rounded-lg overflow-hidden h-auto transition-shadow hover:shadow-md max-w-sm ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        <div
          className="relative h-48 w-full"
          onMouseEnter={handleImageMouseEnter}
          onMouseLeave={handleImageMouseLeave}
        >
          {images.length > 1 ? (
            <Carousel>
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index} className="h-48">
                    <img
                      src={image.url}
                      alt={`${listing.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <CarouselPrevious className="left-2 bg-black/40 hover:bg-black/60 border-none" />
                <CarouselNext className="right-2 bg-black/40 hover:bg-black/60 border-none" />
              </div>
            </Carousel>
          ) : (
            <img
              src={primaryImage}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Price Tag */}
          <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-gray-800 font-semibold">
            {formattedPrice}/month
          </div>

          {/* Status Badge */}
          {status !== ListingStatus.None && (
            <div
              className={`absolute top-2 right-2 px-2 py-1 rounded text-white font-medium ${
                status === ListingStatus.Favorite
                  ? 'bg-green-500'
                  : status === ListingStatus.Dislike
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
            >
              {status === ListingStatus.Favorite
                ? 'Liked'
                : status === ListingStatus.Dislike
                ? 'Disliked'
                : 'Applied'}
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 bg-white ${detailsClassName}`} style={detailsStyle}>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-800 mb-1 line-clamp-1">
            {listing.title}
          </h3>
          <button
            onClick={handleShowOnMap}
            className="text-sm text-blue-500 hover:text-blue-700 whitespace-nowrap"
          >
            Show on map
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          {listing.bedrooms?.length || listing.roomCount || 0} beds •{' '}
          {listing.bathroomCount} baths •{' '}
          {listing.squareFootage ? `${listing.squareFootage.toLocaleString()} sqft` : 'N/A sqft'}
        </div>

        {/* Availability dates */}
        {(dateStart || dateEnd) && (
          <div className="text-sm text-green-600 mb-2">
            Available: {dateStart || 'Now'} {dateEnd ? `- ${dateEnd}` : ''}
          </div>
        )}

        {/* Furniture and utilities status */}
        <div className="flex flex-wrap gap-2 mb-3">
          {listing.furnished && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Furnished
            </span>
          )}
          {listing.utilitiesIncluded && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Utilities Included
            </span>
          )}
          {listing.petsAllowed && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Pets Allowed
            </span>
          )}
        </div>

        <Link 
          href={`/platform/trips/${listing.tripId}/listing/${listing.id}`} 
          className="block text-sm text-blue-600 hover:text-blue-800 underline mb-3"
        >
          View Details
        </Link>

        {/* Action Buttons */}
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default SearchListingCardSnapshot;