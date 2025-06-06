import React, { useState } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { RejectIcon } from '@/components/svgs/svg-components';
import { Heart } from 'lucide-react';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star } from 'lucide-react';
import AmenityListItem from './amenity-list-item';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { MatchbookVerified } from '@/components/icons';
import { iconAmenities } from '@/lib/amenities-list';
import { useListingsSnapshot } from '@/hooks/useListingsSnapshot';

interface SelectedListingDetailsProps {
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
  customSnapshot?: any;
  height?: string;
}

const SelectedListingDetails: React.FC<SelectedListingDetailsProps> = ({ 
  listing, 
  distance, 
  customSnapshot,
  height = 'calc(100vh-200px)'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Always call the hook unconditionally to comply with rules of hooks
  const snapshotFromHook = useListingsSnapshot();
  // Then use either the custom snapshot or the one from the hook
  const listingsSnapshot = customSnapshot || snapshotFromHook;

  // Use properties and functions from the snapshot
  const isLiked = listingsSnapshot.isLiked(listing.id);
  const isDisliked = listingsSnapshot.isDisliked(listing.id);

  // Constants for styling
  const sectionStyles = 'border-b pb-4 pt-4';
  const sectionHeaderStyles = 'text-[#404040] text-[18px] font-medium mb-3';
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

  return (
    <div className="w-full">
      <ScrollArea className="w-full" style={{ height }}>
        <div className="w-full px-4 pb-8">
          {/* Image Carousel */}
          <div 
            className="relative h-64 w-full mb-6 rounded-lg overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Carousel keyboardControls={false} opts={{ loop: true }}>
              <CarouselContent>
                {listing.listingImages.map((image, index) => (
                  <CarouselItem key={index} className="relative h-64 w-full">
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

            {/* Action Button */}
            <div className="absolute top-3 right-3 z-10 transition-opacity duration-300 opacity-80">
              {getStatusIcon()}
            </div>
          </div>

          {/* Basic Info */}
          <div className={sectionStyles}>
            <h2 className="font-normal text-[24px] text-[#404040] leading-tight mb-4">
              {listing.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-[#404040]">
              <div className="space-y-3">
                <p className="text-[16px]">
                  {listing.roomCount || 0} beds | {listing.bathroomCount || 0} Baths
                </p>
                <p className="text-[16px]">{listing.squareFootage?.toLocaleString() || 0} sqft</p>
              </div>
              <div className="space-y-3 text-right">
                <p className="text-[18px] font-medium">${listing.price.toLocaleString()}/month</p>
                <p className="text-[16px]">${listing.depositSize?.toLocaleString() || 0} deposit</p>
              </div>
            </div>
          </div>

          {/* Highlights Section */}
          <div className={sectionStyles}>
            <h3 className={sectionHeaderStyles}>Highlights</h3>
            <div className="space-y-2">
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
            <p className="text-[14px] text-gray-600 leading-relaxed">
              {listing.description || 'No description available for this property.'}
            </p>
          </div>

          {/* Amenities Section */}
          {displayAmenities.length > 0 && (
            <div className={sectionStyles}>
              <h3 className={sectionHeaderStyles}>Amenities</h3>
              <div className="space-y-2">
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
  );
};

export default SelectedListingDetails;
