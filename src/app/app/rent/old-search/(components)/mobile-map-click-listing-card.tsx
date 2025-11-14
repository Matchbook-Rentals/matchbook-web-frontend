import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';
import { useListingsSnapshot } from '@/hooks/useListingsSnapshot';
import { RejectIcon } from '@/components/svgs/svg-components';
import { Heart, Star, Bed, Bath, Square } from 'lucide-react';
import { ListingStatus, PropertyType } from '@/constants/enums';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import { iconAmenities } from '@/lib/amenities-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import AmenityListItem from './amenity-list-item';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { Badge } from "@/components/ui/badge"
import { BrandButton } from "@/components/ui/brandButton"
import { getUtilitiesIncluded } from '@/lib/calculate-rent';

interface ListingCardProps {
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
  // Allow parent to override the container positioning/styling
  className?: string;
  status?: ListingStatus;
  customSnapshot?: any; // Optional custom snapshot with enhanced functions
}

// Custom hook to detect media query matches
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);
      const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
      // set the initial state
      setMatches(mediaQueryList.matches);
      mediaQueryList.addEventListener('change', listener);
      return () => mediaQueryList.removeEventListener('change', listener);
    }
  }, [query]);

  return matches;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, distance, onClose, className, status = ListingStatus.None, customSnapshot }) => {
  const router = useRouter();
  const { state } = useTripContext(); // actions and lookup no longer needed for like/dislike here
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Using our hook to check if viewport is medium (768px) or larger
  const isMediumOrAbove = useMediaQuery('(min-width: 768px)');
  // Set default positioning based on viewport size:
  const defaultPositionClass = isMediumOrAbove
    ? "bottom-2 left-2" // bottom left for medium and above
    : "top-16 left-1/2 transform -translate-x-1/2"; // top middle for smaller screens, moved down more

  // Use the pattern from DesktopListingCard
  const snapshotFromHook = useListingsSnapshot();
  const listingsSnapshot = customSnapshot || snapshotFromHook;

  // Use properties and functions from the resolved listingsSnapshot
  const isLiked = listingsSnapshot.isLiked(listing.id);
  const isDisliked = listingsSnapshot.isDisliked(listing.id);

  // Calculate utilities based on trip duration
  const utilitiesIncluded = getUtilitiesIncluded(listing, state.trip);

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
          <RejectIcon
            className="w-9 h-9 text-white cursor-pointer p-2"
          />
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

  const expandedHeight = isMediumOrAbove ? '80vh' : 'calc(87vh - 20px)';
  const cardHeight = expanded ? expandedHeight : '400px';

  return (
    <div
      className={`absolute ${expanded ? 'z-[60]' : 'z-40'} bg-white shadow-lg border border-gray-200 rounded-lg transition-all duration-300 ease-in-out flex flex-col ${className || defaultPositionClass}`}
      style={{
        height: cardHeight,
        width: expanded ? '95%' : (isMediumOrAbove ? '320px' : '95%'),
        maxWidth: isMediumOrAbove ? '360px' : '95%'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ScrollArea className="w-full" style={{ height: cardHeight }}>
      {/* Fixed Top Section (Carousel and Basic Info) */}
      <div className="relative">
        {/* Carousel Image Container */}
        <div className="relative h-[175px] w-full">
          <Carousel keyboardControls={false} opts={{ loop: true }}>
            <CarouselContent>
              {listing.listingImages.map((image, index) => (
                <CarouselItem key={index} className="relative h-[175px] w-full">
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
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <BrandButton
              variant="default"
              size="icon"
              className="w-[30px] h-[30px] bg-white hover:bg-white/90 text-gray-600 hover:text-gray-700 min-w-[30px] rounded-lg"
              onClick={(e: React.MouseEvent) => {
                if (isLiked) {
                  listingsSnapshot.optimisticRemoveLike(listing.id);
                } else {
                  listingsSnapshot.optimisticLike(listing.id);
                }
                e.stopPropagation();
              }}
            >
              <Heart 
                className={`w-[18px] h-[18px] ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
              />
            </BrandButton>
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
        <div className="w-full p-4 pt-3 flex flex-col gap-0">
          {/* Row 1: Property Title */}
          <div className="flex flex-col gap-0 pb-1">
            <h3 className="font-medium text-black text-base truncate whitespace-nowrap">
              {listing.title.length > 40
                ? `${listing.title.substring(0, 40)}...`
                : listing.title}
            </h3>
          </div>

          {/* Row 2: Location and Rating */}
          <div className="flex flex-col gap-0 pb-6">
            <div className="flex items-center justify-between w-full">
              <div className="font-normal text-[#4f4f4f] text-sm">
                {listing.displayCategory}
              </div>

              <div className="flex items-center gap-0.5">
                {(listing as any).averageRating ? (
                  <>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-normal text-[#4f4f4f] text-sm">
                        {(listing as any).averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="font-normal text-[#4f4f4f] text-sm">
                      ({(listing as any).numberOfStays || 0} reviews)
                    </span>
                  </>
                ) : (
                  <span className="font-normal text-[#4f4f4f] text-sm italic">
                    No reviews yet
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Property Features */}
          <div className="flex flex-col gap-3 pb-3">
            <div className="flex items-center justify-between w-full">
              <Badge
                variant="outline"
                className="bg-transparent border-none p-0 flex items-center gap-1.5"
              >
                <div className="relative w-5 h-5">
                  <Bed className="w-[18px] h-4 text-[#5d606d]" />
                </div>
                <span className="font-normal text-[#4f4f4f] text-sm">
                  {listing.roomCount || 4} bds
                </span>
              </Badge>
              <div className="h-4 border-l-2 border-gray-200"></div>
              <Badge
                variant="outline"
                className="bg-transparent border-none p-0 flex items-center gap-1.5"
              >
                <div className="relative w-5 h-5">
                  <Bath className="w-[18px] h-4 text-[#5d606d]" />
                </div>
                <span className="font-normal text-[#4f4f4f] text-sm">
                  {listing.bathroomCount || 2} ba
                </span>
              </Badge>
              <div className="h-4 border-l-2 border-gray-200"></div>
              <Badge
                variant="outline"
                className="bg-transparent border-none p-0 flex items-center gap-1.5"
              >
                <div className="relative w-5 h-5">
                  <Square className="w-5 h-5 text-[#5d606d]" />
                </div>
                <span className="font-normal text-[#4f4f4f] text-sm">
                  {listing.squareFootage?.toLocaleString() || 0} sqft
                </span>
              </Badge>
            </div>
          </div>

          {/* Row 4: Price */}
          <div className="w-full border-t border-[#002c581a] pt-4">
            <div className="w-full">
              <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#484a54] text-xl">
                ${listing.price?.toLocaleString() || 2350} / month
              </h2>
            </div>
          </div>

          {/* Expand Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-medium text-secondaryBrand hover:text-secondaryBrand/80 hover:underline transition-colors"
            >
              {expanded ? 'See less' : 'See more'}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Bottom Section */}
      <div
        className={`transition-all duration-300 ease-in-out bg-white ${
          expanded ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'
        }`}
      >
          <div className="flex flex-col pb-20 px-4"> {/* Extra padding to ensure button visibility */}
            {/* Highlights Section */}
            <div className={sectionStyles}>
              <h3 className={sectionHeaderStyles}>Highlights</h3>
              <div className="space-y-1 py-1">
                {listing.category === PropertyType.SingleFamily && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedSingleFamilyIcon}
                    label="Single Family"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                {listing.category === PropertyType.Townhouse && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedTownhouseIcon}
                    label="Townhouse"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                {listing.category === PropertyType.PrivateRoom && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedSingleRoomIcon}
                    label="Private Room"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[22px] w-[22px]"
                  />
                )}
                {listing.category === PropertyType.Apartment && (
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
                    utilitiesIncluded
                      ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon
                      : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon
                  }
                  label={utilitiesIncluded ? 'Utilities Included' : 'Utilities Not Included'}
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
              <p className="text-[14px] text-gray-600 whitespace-pre-wrap break-words">
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

            {/* See Full Details Button */}
            <div className="border-t border-gray-200 p-4">
              <Link
                href={`/app/rent/searches/${state.trip.id}/listing/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="px-4 py-2 bg-[#404040]/80 hover:bg-[#404040] text-white font-medium rounded text-center transition-colors w-full">
                  See full details
                </button>
              </Link>
            </div>
          </div>
      </div>
      </ScrollArea>
    </div>
  );
};

export default ListingCard;
