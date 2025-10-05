import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { ListingAndImages } from '@/types';

interface HighlightsSectionProps {
  listing: ListingAndImages;
}

const HighlightsSection: React.FC<HighlightsSectionProps> = ({ listing }) => {
  return (
    <Card className="bg-[#FAFAFA] border-none rounded-xl mt-5">
      <CardContent className="flex flex-col items-start gap-[18px] p-5">
        <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
          Highlights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {/* Category-dependent icons */}
          {listing.category === "singleFamily" && (
            <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                <AmenitiesIcons.UpdatedSingleFamilyIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                Single Family
              </span>
            </div>
          )}
          {listing.category === "townhouse" && (
            <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                <AmenitiesIcons.UpdatedTownhouseIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                Townhouse
              </span>
            </div>
          )}
          {listing.category === "privateRoom" && (
            <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                <AmenitiesIcons.UpdatedSingleRoomIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                Private Room
              </span>
            </div>
          )}
          {(listing.category === "apartment" || listing.category === "condo") && (
            <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                <AmenitiesIcons.UpdatedApartmentIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                Apartment
              </span>
            </div>
          )}

          {/* Furnished Status */}
          <div className="flex items-start gap-1.5">
            <div className="relative w-5 h-5">
              {listing.furnished ? (
                <AmenitiesIcons.UpdatedFurnishedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              ) : (
                <AmenitiesIcons.UpdatedUnfurnishedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              )}
            </div>
            <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
              {listing.furnished ? "Furnished" : "Unfurnished"}
            </span>
          </div>

          {/* Utilities */}
          <div className="flex items-start gap-1.5">
            <div className="relative w-5 h-5">
              {listing.utilitiesIncluded ? (
                <AmenitiesIcons.UpdatedUtilitiesIncludedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              ) : (
                <AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              )}
            </div>
            <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
              {listing.utilitiesIncluded ? "Utilities Included" : "Utilities Not Included"}
            </span>
          </div>

          {/* Pets */}
          <div className="flex items-start gap-1.5">
            <div className="relative w-5 h-5">
              {listing.petsAllowed ? (
                <AmenitiesIcons.UpdatedPetFriendlyIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              ) : (
                <AmenitiesIcons.UpdatedPetUnfriendlyIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
              )}
            </div>
            <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
              {listing.petsAllowed ? "Pets Allowed" : "No Pets"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HighlightsSection;
