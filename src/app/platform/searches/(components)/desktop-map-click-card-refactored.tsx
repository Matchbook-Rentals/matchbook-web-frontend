import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Heart as HeartIconLucide, Star } from 'lucide-react'; // Renamed to avoid conflict if HeartIcon is also imported
import { RejectIcon as RejectIconSvg } from '@/components/svgs/svg-components'; // Assuming this is the correct path from old card
import { ArrowLeft, ArrowRight } from '@/components/icons'; // Assuming these are general arrow icons
import { ScrollArea } from '@/components/ui/scroll-area';
import AmenityListItem from './amenity-list-item'; // Assuming this path is correct relative to the old card
import * as AmenitiesIcons from '@/components/icons/amenities'; // Assuming this path
import { MatchbookVerified } from '@/components/icons'; // Assuming this path
import { iconAmenities } from '@/lib/amenities-list'; // Assuming this path
import { ListingAndImages } from '@/types'; // Already imported

// Props from the original refactored component:
// listing: ListingAndImages & { price: number };
// distance: number; (Now optional to match old card's flexibility, though old card used it if present)
// onClose: () => void;
// onLike: () => void;
// onDislike: () => void;
// className?: string; (Will be overridden by old card's fixed styling)

// New props to support visual replication of old card's features
interface ListingCardProps {
  listing: ListingAndImages & { price: number; name?: string; description?: string; category?: string; furnished?: boolean; utilitiesIncluded?: boolean; petsAllowed?: boolean; depositSize?: number; [key: string]: any; }; // Expanded to include fields from old card
  distance?: number;
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
  isLiked: boolean;
  isDisliked: boolean;
  tripId: string;
  className?: string; // Will mostly be overridden by the fixed old card styles
}

const DesktopMapClickCardRefactored: React.FC<ListingCardProps> = ({
  listing,
  distance,
  onClose,
  onLike,
  onDislike,
  isLiked,
  isDisliked,
  tripId,
  // className prop is available but the component will apply its own fixed positioning and size
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Constants for styling from the old card
  const sectionStyles = 'border-b pb-3 pt-3';
  const sectionHeaderStyles = 'text-[#404040] text-[18px] font-medium mb-2';
  const amenityTextStyle = 'text-[16px] font-medium';
  
  const collapsedHeight = '290px'; 
  const expandedHeight = '88vh'; // Using vh for viewport consistency as in old card example
  const topSectionHeight = 290; 
  const buttonSectionHeight = 70;

  const mainImages = listing.listingImages && listing.listingImages.length > 0 ? listing.listingImages : (listing.images || []);
  const listingTitle = listing.name || listing.title || 'Property';

  const calculateDisplayAmenities = () => {
    const displayAmenities = [];
    for (let amenity of iconAmenities) {
      if (listing[amenity.code]) {
        displayAmenities.push(amenity);
      }
    }
    return displayAmenities;
  };

  const displayAmenities = calculateDisplayAmenities();

  const getStatusIcon = () => {
    // This function now uses `isLiked`, `isDisliked` props and calls `onLike`, `onDislike`
    if (isLiked) {
      return (
        <div
          className="bg-black/50 rounded-full p-2 cursor-pointer"
          onClick={(e: React.MouseEvent) => {
            onDislike(); // To "unlike"
            e.stopPropagation();
          }}
          aria-label="Unlike this listing"
        >
          <HeartIconLucide
            className="w-6 h-6 text-white fill-red-500"
            strokeWidth={2}
          />
        </div>
      );
    } else if (isDisliked) {
      return (
        <div
          className="bg-black/50 rounded-full cursor-pointer"
          onClick={(e: React.MouseEvent) => {
            onLike(); // To "remove dislike" (assuming onLike handles this or parent does)
            e.stopPropagation();
          }}
          aria-label="Remove dislike for this listing"
        >
          <RejectIconSvg className="w-9 h-9 text-white p-2" />
        </div>
      );
    }

    // Neutral state: offer to like
    return (
      <div
        className="bg-black/50 rounded-full p-2 cursor-pointer"
        onClick={(e: React.MouseEvent) => {
          onLike();
          e.stopPropagation();
        }}
        aria-label="Like this listing"
      >
        <HeartIconLucide
          className="w-6 h-6 text-white"
          strokeWidth={2}
        />
      </div>
    );
  };
  
  return (
    <div
      className="absolute z-20 bg-white shadow-lg border border-gray-200 rounded-lg transition-all duration-300 ease-in-out top-14 left-2 w-96 overflow-hidden flex flex-col"
      style={{ height: expanded ? expandedHeight : collapsedHeight }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fixed Top Section (Carousel and Basic Info) */}
      <div className="relative flex-shrink-0" style={{ height: `${topSectionHeight}px` }}>
        {/* Carousel Image Container */}
        <div className="relative h-40 w-full">
          {mainImages.length > 0 ? (
            <Carousel opts={{ loop: mainImages.length > 1 }}>
              <CarouselContent>
                {mainImages.map((image, index) => (
                  <CarouselItem key={index} className="relative h-40 w-full">
                    <Image src={image.url} alt={`${listingTitle} image ${index + 1}`} fill className="object-cover" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {mainImages.length > 1 && (
                <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  <CarouselPrevious
                    Icon={ArrowLeft}
                    className="left-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pl-[4px] z-20"
                  />
                  <CarouselNext
                    Icon={ArrowRight}
                    className="right-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pr-[4px] z-20"
                  />
                </div>
              )}
            </Carousel>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}

          {/* Action Buttons (Like/Dislike status icon) */}
          <div className="absolute top-2 right-2 z-10 transition-opacity duration-300 opacity-60 hover:opacity-100">
            {getStatusIcon()}
          </div>

          {/* Close Button */}
          <div className="absolute top-2 left-2 z-10 transition-opacity duration-300 opacity-60 hover:opacity-100">
            <div
              className="bg-black/50 rounded-full p-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="px-4 pt-4 pb-2 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-normal text-[20px] text-[#404040] leading-tight truncate max-w-[calc(100%-80px)]">
              {listingTitle}
            </h3>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-2 shrink-0"
            >
              {expanded ? 'See less' : 'See more'}
            </button>
          </div>
          <div className="py-3 flex flex-col space-y-1 text-[#404040]"> {/* Reduced space-y-4 to space-y-1 */}
            <div className="w-full flex justify-between">
              <p className="text-[16px]">
                {listing.bedrooms?.length || listing.roomCount || 0} beds | {listing.bathroomCount || 0} Baths
                {distance !== undefined && ` | ${distance.toFixed(1)} mi`}
              </p>
              <p className="text-[16px] font-medium">${listing.price.toLocaleString()}/month</p>
            </div>
            <div className="w-full flex justify-between">
              <p className="text-[16px]">{listing.squareFootage?.toLocaleString() || 0} sqft</p>
              {listing.depositSize && <p className="text-[16px]">${listing.depositSize.toLocaleString()} deposit</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Bottom Section */}
      <div
        className={`transition-all duration-300 ease-in-out bg-white flex-grow ${
          expanded ? 'opacity-100' : 'opacity-0 max-h-0' // Removed overflow-hidden from here, ScrollArea handles it
        }`}
      >
        <ScrollArea
          className="w-full px-4" // Added overflow-y-auto to ScrollArea if content overflows
          style={{ height: expanded ? `calc(${expandedHeight} - ${topSectionHeight}px - ${buttonSectionHeight}px)` : '0px' }}
        >
          <div className="flex flex-col pb-4"> {/* Reduced padding to pb-4, button is inside this div */}
            {/* Highlights Section */}
            <div className={sectionStyles}>
              <h3 className={sectionHeaderStyles}>Highlights</h3>
              <div className="space-y-1 py-1">
                <AmenityListItem
                  icon={MatchbookVerified}
                  label="Matchbook Verified Guests Preferred"
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[22px] w-[22px]"
                />
                {listing.category === 'singleFamily' && (
                  <AmenityListItem icon={AmenitiesIcons.UpdatedSingleFamilyIcon} label="Single Family" labelClassNames={amenityTextStyle} iconClassNames="h-[22px] w-[22px]" />
                )}
                {listing.category === 'townhouse' && (
                  <AmenityListItem icon={AmenitiesIcons.UpdatedTownhouseIcon} label="Townhouse" labelClassNames={amenityTextStyle} iconClassNames="h-[22px] w-[22px]" />
                )}
                {listing.category === 'privateRoom' && (
                  <AmenityListItem icon={AmenitiesIcons.UpdatedSingleRoomIcon} label="Private Room" labelClassNames={amenityTextStyle} iconClassNames="h-[22px] w-[22px]" />
                )}
                {(listing.category === 'apartment' || listing.category === 'condo') && (
                  <AmenityListItem icon={AmenitiesIcons.UpdatedApartmentIcon} label="Apartment" labelClassNames={amenityTextStyle} iconClassNames="h-[22px] w-[22px]" />
                )}
                 {listing.furnished !== undefined && (
                  <AmenityListItem
                    icon={listing.furnished ? AmenitiesIcons.UpdatedFurnishedIcon : AmenitiesIcons.UpdatedUnfurnishedIcon}
                    label={listing.furnished ? 'Furnished' : 'Unfurnished'}
                    labelClassNames={amenityTextStyle} iconClassNames="h-[22px] w-[22px]"
                  />
                 )}
                {listing.utilitiesIncluded !== undefined && (
                  <AmenityListItem
                    icon={listing.utilitiesIncluded ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon}
                    label={listing.utilitiesIncluded ? 'Utilities Included' : 'No Utilities'}
                    labelClassNames={amenityTextStyle} iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                {listing.petsAllowed !== undefined && (
                  <AmenityListItem
                    icon={listing.petsAllowed ? AmenitiesIcons.UpdatedPetFriendlyIcon : AmenitiesIcons.UpdatedPetUnfriendlyIcon}
                    label={listing.petsAllowed ? 'Pets Allowed' : 'No Pets'}
                    labelClassNames={amenityTextStyle} iconClassNames="h-[22px] w-[22px]"
                  />
                )}
              </div>
            </div>

            {/* Description Section */}
            {listing.description && (
              <div className={sectionStyles}>
                <h3 className={sectionHeaderStyles}>Description</h3>
                <p className="text-[14px] text-gray-600">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Amenities Section */}
            {displayAmenities.length > 0 && (
              <div className={sectionStyles}>
                <h3 className={sectionHeaderStyles}>Amenities</h3>
                <div className="flex flex-col space-y-1 py-1">
                  {displayAmenities.map((amenity) => (
                    <AmenityListItem
                      key={amenity.code}
                      icon={amenity.icon || Star}
                      label={amenity.label}
                      labelClassNames={amenityTextStyle}
                      iconClassNames="h-[22px] w-[22px]"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* See Full Details Button - Placed inside ScrollArea content */}
            <div className="pt-4"> {/* Removed border-t, adjusted padding */}
              <Link
                href={`/platform/trips/${tripId}/listing/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-[#404040]/80 hover:bg-[#404040] text-white font-medium rounded text-center transition-colors"
              >
                See full details
              </Link>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default DesktopMapClickCardRefactored;
