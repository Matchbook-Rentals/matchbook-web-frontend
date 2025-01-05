import React, { useState } from 'react';
import { ListingAndImages } from '@/types';
import { Star } from 'lucide-react';
import * as AmenitiesIcons from '@/components/icons/amenities';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Tile from '@/components/ui/tile';
import { amenities, iconAmenities, highlightAmenities } from '@/lib/amenities-list';
import { Montserrat } from 'next/font/google';
import { MatchbookVerified } from '@/components/icons';

const montserrat = Montserrat({ subsets: ["latin"] });

interface ListingDetailsProps {
  listing: ListingAndImages;
}

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing }) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);


  const getListingAmenities = () => {
    const displayAmenities = [];
    for (let amenity of iconAmenities) {
      if (listing[amenity.code]) {
        displayAmenities.push(amenity);
      }
    }
    return displayAmenities
  };

  return (
    <div className={`w-full ${montserrat.className}`}>
      {/* Host Information */}
      <div className="flex items-center justify-between pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={listing.user?.imageUrl}
              alt="Host"
              className="w-full h-full object-cover"
            />
          </div>
          <div className=''>
            <p className="text-xl md:text-[24px] text-[#404040] font-medium pb-2 font-montserrat">
              Hosted by {listing.user?.firstName || listing.user?.email}</p>
            <p className="text-gray-600 md:text-lg lg:text-xl">
              2 years on Matchbook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-col">
          <p className="hidden sm:block md:hidden lg:block text-xl truncate pb-2">
            23 stays
          </p>

          <Popover>
            <PopoverTrigger>
              <div className="flex items-center gap-1 cursor-pointer">
                <Star className="fill-current text-gray-700" size={24} />
                <span className="text-xl">
                  {(listing?.uScore / 10).toFixed(1)}
                  <span className="sm:hidden md:inline lg:hidden text-sm">
                    (23)
                  </span>
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <p className="text-sm">Raw Score: {listing?.uScore?.toFixed(3)}</p>
            </PopoverContent>
          </Popover>
        </div>
      </div>


      {/* Host Badges */}
      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 pb-12 border-b border-[#D8D9D8]">
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/matchbook-verified.png' alt='Matchbook Verified Badge' />
          </div>
          <span className=' text-[20px] font-medium'>Verified</span>
        </div>
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/trailblazer.png' alt='Trailblazer Badge' />
          </div>
          <span className=' text-[20px] font-medium'>Trailblazer</span>
        </div>
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/hallmark-host.png' alt='Hallmark Host Badge' />
          </div>
          <span className=' text-[20px] font-medium'>Hallmark Host</span>
        </div>
      </div>
      {/* Property Highlights */}
      <div className="py-12 border-b border-[#D8D9D8]">
        <h3 className="text-[32px] text-[#404040] font-medium mb-4">Highlights</h3>
        <div className='flex space-x-4 items-center mb-4'>
          <MatchbookVerified />
          <h3 className="text-[#404040] text-[24px]"> Matchbook Verified Guests Preferred </h3>
        </div>
        <div className="flex flex-wrap gap-y-6 gap-x-1 justify-between">
          {!showAllAmenities ? (
            <>
              {/* Property Type */}
              {listing.category === "singleFamily" && (
                <Tile

                  icon={<AmenitiesIcons.SingleFamilyIcon className="p-1 mt-2" />}
                  label="Single Family"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              )}
              {listing.category === "townhouse" && (
                <Tile
                  icon={<AmenitiesIcons.TownhouseIcon className="p-1 mt-2" />}
                  label="Townhouse"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              )}
              {listing.category === "singleRoom" && (
                <Tile
                  icon={<AmenitiesIcons.SingleRoomIcon className="p-1 mt-2" />}
                  label="Single Room"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              )}
              {(listing.category === "apartment" || listing.category === "condo") && (
                <Tile
                  icon={<AmenitiesIcons.ApartmentIcon className="p-1 mt-2" />}
                  label="Apartment"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              )}

              {/* Furnished Status */}
              {listing.furnished ? (
                <Tile
                  icon={<AmenitiesIcons.FurnishedIcon className="mt-4" />}
                  label="Furnished"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              ) : (
                <Tile
                  icon={<AmenitiesIcons.UnfurnishedIcon className="mt-4" />}
                  label="Unfurnished"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              )}

              {/* Utilities */}
              {listing.utilitiesIncluded ? (
                <Tile
                  icon={<AmenitiesIcons.UtilitiesIncludedIcon className="mt-4" />}
                  label="Utilities Included"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              ) : (
                <Tile
                  icon={<AmenitiesIcons.UtilitiesNotIncludedIcon className="mt-4" />}
                  label="No Utilities"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              )}

              {/* Pets */}
              {listing.petsAllowed ? (
                <Tile
                  icon={<AmenitiesIcons.PetFriendlyIcon className="mt-4" />}
                  label="Pets Allowed"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              ) : (
                <Tile
                  icon={<AmenitiesIcons.PetUnfriendlyIcon className="mt-4" />}
                  label="No Pets"
                  className="h-[155px] w-[155px]"
                  labelClassNames="text-[16px] text-[#2D2F2E80]"
                />
              )}
            </>
          ) : (
            <>
              <Tile
                icon={<AmenitiesIcons.SingleFamilyIcon className="mt-4" />}
                label="Single Family"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.TownhouseIcon className="mt-4" />}
                label="Townhouse"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.SingleRoomIcon className="mt-4" />}
                label="Single Room"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.ApartmentIcon className="mt-4" />}
                label="Apartment"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.FurnishedIcon className="mt-6" />}
                label="Furnished"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.UnfurnishedIcon className="mt-6" />}
                label="Not Furnished"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.UtilitiesIncludedIcon className="mt-4" />}
                label="Utilities Included"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.UtilitiesNotIncludedIcon className="mt-4" />}
                label="Utilities Not Included"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.PetFriendlyIcon className="mt-4" />}
                label="Pets Allowed"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
              <Tile
                icon={<AmenitiesIcons.PetUnfriendlyIcon className="mt-4" />}
                label="No Pets"
                className="h-[155px] w-[155px]"
                labelClassNames="text-[16px] text-[#2D2F2E80]"
              />
            </>
          )}
        </div>
      </div>

      {/* Property Description */}
      <div className="py-12 border-b border-[#D8D9D8]">
        <h3 className="text-2xl font-medium mb-4">Description</h3>
        <p className="text-gray-600 leading-relaxed">
          {listing.description ||
            'Our spacious home, located just a 20-minute drive from ski resorts and a 2-minute drive from downtown Ogden, is the perfect centrally located home for your Utah stay. With modern updates, a private front porch *with mountain views*, and a wonderfully manicured backyard with a gas fire pit and outdoor dining area, this home is well equipped to host large Families, or even guests just looking for a peaceful getaway. '}
        </p>
      </div>

      {/* Property Amenities */}
      <div className="py-12">
        <h3
          className="text-2xl font-medium mb-4 cursor-pointer"
          onClick={() => setShowAllAmenities(!showAllAmenities)}
        >
          Amenities {showAllAmenities ? '(show less)' : '(show more)'}
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,104px)] gap-6 justify-between">
          {(showAllAmenities ? iconAmenities : getListingAmenities()).map((amenity) => {
            const { icon: Icon, label } = amenity;

            return (
              <Tile
                key={amenity.code}
                icon={Icon ? <Icon className="max-h-[40px] max-w-[40px]" /> : <Star className="text-red-500 max-h-[40px] max-w-[40px]" />}
                label={Icon ? label : `Missing: ${label}`}
                labelClassNames="text-[14px] text-[#404040]"
                className="h-[104px] w-[104px]"
              />
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ListingDetails;
