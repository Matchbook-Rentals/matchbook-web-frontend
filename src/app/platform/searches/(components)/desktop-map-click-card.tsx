import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';
import { RejectIcon } from '@/components/svgs/svg-components';
import { Heart } from 'lucide-react';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star } from 'lucide-react';
import AmenityListItem from './amenity-list-item';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { MatchbookVerified } from '@/components/icons';
import { iconAmenities } from '@/lib/amenities-list';
import { useListingsSnapshot } from '@/hooks/useListingsSnapshot'; // Import the snapshot hook

interface DesktopListingCardProps {
  listing: {
    listingImages: { url: string }[];
    price: number;
    title: string;
    id: string;
    bathroomCount?: number;
    roomCount?: number;
    squareFootage?: number;
    depositSize?: number;
    category?: string;
    furnished?: boolean;
    utilitiesIncluded?: boolean;
    petsAllowed?: boolean;
    description?: string;
    [key: string]: any; // For amenities
  };
  distance?: number;
  onClose: () => void;
  customSnapshot?: any; // Optional custom snapshot with enhanced functions
}

const DesktopListingCard: React.FC<DesktopListingCardProps> = ({ listing, distance, onClose, customSnapshot }) => {
  const router = useRouter();
  const { state } = useTripContext();
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Always call the hook unconditionally to comply with rules of hooks
  const snapshotFromHook = useListingsSnapshot();
  // Then use either the custom snapshot or the one from the hook
  const listingsSnapshot = customSnapshot || snapshotFromHook;

  // Use properties and functions from the snapshot
  const isLiked = listingsSnapshot.isLiked(listing.id);
  const isDisliked = listingsSnapshot.isDisliked(listing.id);

  // Constants for styling
  const sectionStyles = 'border-b pb-3 pt-3';
  const sectionHeaderStyles = 'text-[#404040] text-[18px] font-medium mb-2';
  const amenityTextStyle = 'text-[16px] font-medium';

  // Calculate amenities to display
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
    if (isLiked) {
      return (
        <div
          className="bg-black/50 rounded-full p-2"
          onClick={(e: React.MouseEvent) => {
            listingsSnapshot.optimisticRemoveLike(listing.id);
            e.stopPropagation();
          }}
        >
          <Heart
            className="w-6 h-6 text-white cursor-pointer fill-red-500"
            strokeWidth={2}
          />
        </div>
      );
    } else if (isDisliked) {
      return (
        <div
          className="bg-black/50 rounded-full"
          onClick={(e: React.MouseEvent) => {
            listingsSnapshot.optimisticRemoveDislike(listing.id);
            e.stopPropagation();
          }}
        >
          <RejectIcon className="w-9 h-9 text-white cursor-pointer p-2" />
        </div>
      );
    }

    return (
      <div
        className="bg-black/50 rounded-full p-2"
        onClick={(e: React.MouseEvent) => {
          listingsSnapshot.optimisticLike(listing.id);
          e.stopPropagation();
        }}
      >
        <Heart
          className="w-6 h-6 text-white cursor-pointer"
          strokeWidth={2}
        />
      </div>
    );
  };

  // Define heights for collapsed and expanded states
  const collapsedHeight = '290px'; // Total height when collapsed
  const expandedHeight = '88%'; // Total height when expanded (viewport units for consistency)
  const topSectionHeight = 290; // Fixed height of top section in pixels (carousel + basic info)
  const buttonSectionHeight = 70; // Approximate height of the button section (padding + button)

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
          <Carousel keyboardControls={false} opts={{ loop: true }}>
            <CarouselContent>
              {listing.listingImages.map((image, index) => (
                <CarouselItem key={index} className="relative h-40 w-full">
                  <Image src={image.url} alt={listing.title} fill className="object-cover" unoptimized />
                </CarouselItem>
              ))}
            </CarouselContent>
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
          </Carousel>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 z-10 transition-opacity duration-300 opacity-60">
            {getStatusIcon()}
          </div>

          {/* Close Button */}
          <div className="absolute top-2 left-2 z-10 transition-opacity duration-300 opacity-60">
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
              {listing.title}
            </h3>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-2 shrink-0"
            >
              {expanded ? 'See less' : 'See more'}
            </button>
          </div>
          <div className="py-3 flex flex-col space-y-4 text-[#404040]">
            <div className="w-full flex justify-between">
              <p className="text-[16px]">
                {listing.roomCount || 0} beds | {listing.bathroomCount || 0} Baths
              </p>
              <p className="text-[16px] font-medium">${listing.price.toLocaleString()}/month</p>
            </div>
            <div className="w-full flex justify-between">
              <p className="text-[16px]">{listing.squareFootage?.toLocaleString() || 0} sqft</p>
              <p className="text-[16px]">${listing.depositSize?.toLocaleString() || 0} deposit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Bottom Section */}
      <div
        className={`transition-all duration-300 ease-in-out bg-white flex-grow ${
          expanded ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'
        }`}
      >
        <ScrollArea
          className="w-full px-4"
          style={{ height: expanded ? `calc(88vh - ${topSectionHeight}px - ${buttonSectionHeight}px)` : '0px' }}
        >
          <div className="flex flex-col pb-20"> {/* Extra padding to ensure button visibility */}
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
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedSingleFamilyIcon}
                    label="Single Family"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                {listing.category === 'townhouse' && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedTownhouseIcon}
                    label="Townhouse"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                {listing.category === 'privateRoom' && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedSingleRoomIcon}
                    label="Private Room"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                {(listing.category === 'apartment' || listing.category === 'condo') && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedApartmentIcon}
                    label="Apartment"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                <AmenityListItem
                  icon={
                    listing.furnished ? AmenitiesIcons.UpdatedFurnishedIcon : AmenitiesIcons.UpdatedUnfurnishedIcon
                  }
                  label={listing.furnished ? 'Furnished' : 'Unfurnished'}
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[22px] w-[22px]"
                />
                <AmenityListItem
                  icon={
                    listing.utilitiesIncluded
                      ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon
                      : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon
                  }
                  label={listing.utilitiesIncluded ? 'Utilities Included' : 'No Utilities'}
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[22px] w-[22px]"
                />
                <AmenityListItem
                  icon={
                    listing.petsAllowed
                      ? AmenitiesIcons.UpdatedPetFriendlyIcon
                      : AmenitiesIcons.UpdatedPetUnfriendlyIcon
                  }
                  label={listing.petsAllowed ? 'Pets Allowed' : 'No Pets'}
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[22px] w-[22px]"
                />
              </div>
            </div>

            {/* Description Section */}
            <div className={sectionStyles}>
              <h3 className={sectionHeaderStyles}>Description</h3>
              <p className="text-[14px] text-gray-600">
                {listing.description || 'No description available for this property.'}
              </p>
            </div>

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

          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default DesktopListingCard;
