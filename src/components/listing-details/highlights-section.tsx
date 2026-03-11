import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  SingleFamilyIcon,
  TownhouseIcon,
  PrivateRoomIcon,
  ApartmentIcon,
  FurnishedIcon,
  UnfurnishedIcon,
  UtilitiesIncludedIcon,
  UtilitiesNotIncludedIcon,
  PetsAllowedIcon,
  NoPetsIcon,
} from '@/components/icons-v3/amenities';
import { ListingWithRelations } from '@/types';
import { Trip } from '@prisma/client';
import { getUtilitiesIncluded } from '@/lib/calculate-rent';
import { PropertyType } from '@/constants/enums';

interface HighlightsSectionProps {
  listing: ListingWithRelations;
  trip: Trip;
}

const HighlightsSection: React.FC<HighlightsSectionProps> = ({ listing, trip }) => {
  const utilitiesIncluded = getUtilitiesIncluded(listing, trip);
  return (
    <Card className=" border-none shadow-none rounded-xl mt-5 px-0">
      <CardContent className="flex flex-col items-start gap-[18px] py-5 px-0">
        <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
          Highlights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {/* Category-dependent icons */}
          {listing.category === PropertyType.SingleFamily && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6">
                <SingleFamilyIcon className="w-6 h-6" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54] pt-[2px]">
                Single Family
              </span>
            </div>
          )}
          {listing.category === PropertyType.Townhouse && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6">
                <TownhouseIcon className="w-6 h-6" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54] pt-[2px]">
                Townhouse
              </span>
            </div>
          )}
          {listing.category === PropertyType.PrivateRoom && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6">
                <PrivateRoomIcon className="w-6 h-6" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54] pt-[2px]">
                Private Room
              </span>
            </div>
          )}
          {listing.category === PropertyType.Apartment && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6">
                <ApartmentIcon className="w-6 h-6" />
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54] pt-[2px]">
                Apartment
              </span>
            </div>
          )}

          {/* Furnished Status */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6">
              {listing.furnished ? (
                <FurnishedIcon className="w-6 h-6" />
              ) : (
                <UnfurnishedIcon className="w-6 h-6" />
              )}
            </div>
            <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54] pt-[2px]">
              {listing.furnished ? "Furnished" : "Unfurnished"}
            </span>
          </div>

          {/* Utilities */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6">
              {utilitiesIncluded ? (
                <UtilitiesIncludedIcon className="w-6 h-6" />
              ) : (
                <UtilitiesNotIncludedIcon className="w-6 h-6" />
              )}
            </div>
            <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54] pt-[2px]">
              {utilitiesIncluded ? "Utilities Included" : "Utilities Not Included"}
            </span>
          </div>

          {/* Pets */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6">
              {listing.petsAllowed ? (
                <PetsAllowedIcon className="w-6 h-6" />
              ) : (
                <NoPetsIcon className="w-6 h-6" />
              )}
            </div>
            <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54] pt-[2px]">
              {listing.petsAllowed ? "Pets Allowed" : "No Pets"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HighlightsSection;
