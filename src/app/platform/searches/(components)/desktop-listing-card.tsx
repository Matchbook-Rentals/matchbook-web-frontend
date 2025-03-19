import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';
import { BrandHeart, RejectIcon } from '@/components/svgs/svg-components';
import { BrandHeartOutline } from '@/components/icons/marketing';
import { ListingStatus } from '@/constants/enums';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShareIcon } from 'lucide-react';
import AmenityListItem from './amenity-list-item';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { MatchbookVerified } from '@/components/icons';

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
  };
  distance?: number;
  onClose: () => void;
}

const DesktopListingCard: React.FC<DesktopListingCardProps> = ({ listing, distance, onClose }) => {
  const router = useRouter();
  const { state, actions } = useTripContext();
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const { lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;

  // Constants for styling
  const sectionStyles = 'border-b pb-3 pt-3';
  const sectionHeaderStyles = 'text-[#404040] text-[18px] font-medium mb-2';
  const amenityTextStyle = 'text-[14px] font-medium';

  const getStatusIcon = () => {
    if (favIds?.has(listing.id)) {
      return (
        <div
          className="bg-black/50 rounded-full p-1"
          onClick={(e: React.MouseEvent) => {
            optimisticRemoveLike(listing.id);
            e.stopPropagation();
          }}
        >
          <BrandHeartOutline
            className="w-9 h-9 stroke-white text-white cursor-pointer pt-2 hover:fill-black"
            stroke="white"
            strokeWidth={1}
            fill="white"
          />
        </div>
      );
    } else if (dislikedIds?.has(listing.id)) {
      return (
        <div
          className="bg-black/50 rounded-full"
          onClick={(e: React.MouseEvent) => {
            optimisticRemoveDislike(listing.id);
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
        className="flex items-center"
        onClick={(e: React.MouseEvent) => {
          optimisticLike(listing.id);
          e.stopPropagation();
        }}
      >
        <BrandHeartOutline
          className="w-9 h-9 stroke-white text-white cursor-pointer pt-2 hover:fill-black"
          stroke="white"
          strokeWidth={1.5}
          fill="black"
        />
      </div>
    );
  };

  return (
    <div
      className={`absolute z-20 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
        expanded 
          ? 'top-14 left-2 bottom-4 w-96' 
          : 'top-14 left-2 w-96'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Carousel Image Container */}
      <div className="relative h-40 w-full">
        <Carousel keyboardControls={false} opts={{ loop: true }}>
          <CarouselContent>
            {listing.listingImages.map((image, index) => (
              <CarouselItem key={index} className="relative h-40 w-full">
                <Image src={image.url} alt={listing.title} fill className="object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <CarouselPrevious Icon={ArrowLeft} className="left-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pl-[4px] z-20" />
            <CarouselNext Icon={ArrowRight} className="right-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pr-[4px] z-20" />
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Non-expanded Content */}
      {!expanded && (
        <>
          <div className="flex justify-between items-center px-4 pt-4 pb-2 border-b">
            <h3 className="font-normal text-[20px] text-[#404040] leading-tight">
              {listing.title}
            </h3>
            <div className="text-[#404040]">
              <ShareIcon className="w-5 h-5" />
            </div>
          </div>
          
          <div className={`px-4 py-3 flex flex-col space-y-4 text-[#404040] ${sectionStyles}`}>
            <div className="w-full flex justify-between">
              <p className="text-[16px]">
                {listing.roomCount || 0} beds | {listing.bathroomCount || 0} Baths
              </p>
              <p className="text-[16px] font-medium">
                ${listing.price.toLocaleString()}/month
              </p>
            </div>
            <div className="w-full flex justify-between">
              <p className="text-[16px]">
                {listing.squareFootage?.toLocaleString() || 0} sqft
              </p>
              <p className="text-[16px]">
                ${listing.depositSize?.toLocaleString() || 0} deposit
              </p>
            </div>
          </div>
          
          <div className="px-4 pt-1 pb-4 flex items-center justify-between">
            {typeof distance === 'number' && (
              <p className="text-sm font-medium text-gray-500">
                {distance.toFixed(1)} miles away
              </p>
            )}
            
            <button
              onClick={() => setExpanded(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              See more
            </button>
          </div>
        </>
      )}

      {/* Expanded Content */}
      {expanded && (
        <>
          <div className="flex justify-between items-center px-4 pt-4 pb-2 border-b">
            <h3 className="font-normal text-[20px] text-[#404040] leading-tight">
              {listing.title}
            </h3>
            <div className="text-[#404040]">
              <ShareIcon className="w-5 h-5" />
            </div>
          </div>
          
          <div className={`px-4 py-3 flex flex-col space-y-4 text-[#404040] ${sectionStyles}`}>
            <div className="w-full flex justify-between">
              <p className="text-[16px]">
                {listing.roomCount || 0} beds | {listing.bathroomCount || 0} Baths
              </p>
              <p className="text-[16px] font-medium">
                ${listing.price.toLocaleString()}/month
              </p>
            </div>
            <div className="w-full flex justify-between">
              <p className="text-[16px]">
                {listing.squareFootage?.toLocaleString() || 0} sqft
              </p>
              <p className="text-[16px]">
                ${listing.depositSize?.toLocaleString() || 0} deposit
              </p>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100%-200px)] w-full px-4">
            {/* Highlights Section */}
            <div className={sectionStyles}>
              <h3 className={sectionHeaderStyles}>Highlights</h3>
              <div className="space-y-1">
                <AmenityListItem
                  icon={MatchbookVerified}
                  label="Matchbook Verified Guests Preferred"
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[24px] w-[24px]"
                />
                
                {/* Category-dependent icons */}
                {listing.category === "singleFamily" && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedSingleFamilyIcon}
                    label="Single Family"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[24px] w-[24px]"
                  />
                )}
                {listing.category === "townhouse" && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedTownhouseIcon}
                    label="Townhouse"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[24px] w-[24px]"
                  />
                )}
                {listing.category === "privateRoom" && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedSingleRoomIcon}
                    label="Private Room"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[24px] w-[24px]"
                  />
                )}
                {(listing.category === "apartment" || listing.category === "condo") && (
                  <AmenityListItem
                    icon={AmenitiesIcons.UpdatedApartmentIcon}
                    label="Apartment"
                    labelClassNames={amenityTextStyle}
                    iconClassNames="h-[24px] w-[24px]"
                  />
                )}

                {/* Furnished Status */}
                <AmenityListItem
                  icon={listing.furnished ? AmenitiesIcons.UpdatedFurnishedIcon : AmenitiesIcons.UpdatedUnfurnishedIcon}
                  label={listing.furnished ? "Furnished" : "Unfurnished"}
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[24px] w-[24px]"
                />

                {/* Utilities */}
                <AmenityListItem
                  icon={listing.utilitiesIncluded ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon}
                  label={listing.utilitiesIncluded ? "Utilities Included" : "No Utilities"}
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[24px] w-[24px]"
                />

                {/* Pets */}
                <AmenityListItem
                  icon={listing.petsAllowed ? AmenitiesIcons.UpdatedPetFriendlyIcon : AmenitiesIcons.UpdatedPetUnfriendlyIcon}
                  label={listing.petsAllowed ? "Pets Allowed" : "No Pets"}
                  labelClassNames={amenityTextStyle}
                  iconClassNames="h-[24px] w-[24px]"
                />
              </div>
            </div>

            {/* Description section */}
            <div className={sectionStyles}>
              <h3 className={sectionHeaderStyles}>Description</h3>
              <p className="text-[14px] text-gray-600">
                {listing.description || 'No description available for this property.'}
              </p>
            </div>
          </ScrollArea>
          
          <div className="border-t border-gray-200 p-4 flex justify-between items-center">
            <button
              onClick={() => setExpanded(false)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Show less
            </button>
            
            <Link
              href={`/platform/trips/${state.trip.id}/listing/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            >
              View full details
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopListingCard;