import React, { useState } from 'react';
import { ListingAndImages } from '@/types';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as AmenitiesIcons from '@/components/icons/amenities';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Tile from '@/components/ui/tile';
import { amenities, iconAmenities, highlightAmenities } from '@/lib/amenities-list';
import { Montserrat } from 'next/font/google';
import AmenityListItem from './amenity-list-item';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TallDialogContent, TallDialogTitle } from "@/constants/styles";

const montserrat = Montserrat({ subsets: ["latin"] });

interface ListingDetailsProps {
  listing: ListingAndImages;
}

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing }) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);

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
  const initialDisplayCount = 4;

  const calculateTimeOnMatchbook = () => {
    if (!listing.user?.createdAt) return 'New to Matchbook';

    const createdDate = new Date(listing.user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days on Matchbook`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months on Matchbook`;

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} years on Matchbook`;
  };

  return (
    <div className={`w-full ${montserrat.className}`}>
      {/* Host Information */}
      <div className="flex items-center justify-between pt-8 pb-8">
        <div className="flex items-center gap-4">
          <div className=''>
            <p className="md:text-[24px] text-[#404040]  font-medium  pb-2 ">
              Hosted by {listing.user?.firstName || listing.user?.email}</p>
            <p className=" md:text-[24px]">
              {calculateTimeOnMatchbook()}
            </p>
          </div>
        </div>


        <div className="flex items-center gap-2 flex-col">
          <p className="hidden sm:block md:hidden lg:block text-[24px] truncate pb-2">
            23 stays
          </p>

          <Popover>
            <PopoverTrigger>
              <div className="flex items-center gap-2 cursor-pointer">
                <Star className="fill-current text-gray-700" size={28} />
                <span className="text-[24px]">
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
          <span className=' text-[20px] font-medium font-montserrat  '>Verified</span>
        </div>
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/trailblazer.png' alt='Trailblazer Badge' />
          </div>
          <span className=' text-[20px] font-medium font-montserrat'>Trailblazer</span>
        </div>
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/hallmark-host.png' alt='Hallmark Host Badge' />
          </div>
          <span className=' text-[20px] font-medium font-montserrat'>Hallmark Host</span>
        </div>
      </div>
      ,
      {/* Property Highlights */}
      <div className="py-12 border-b border-[#D8D9D8]">
        <h3 className="text-[24px] text-[#404040] font-medium mb-4">Highlights</h3>
        <div className="flex flex-col space-y-2">
          {/* Property Type */}
          {listing.category === "singleFamily" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleFamilyIcon}
              label="Single Family"
            />
          )}
          {listing.category === "townhouse" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedTownhouseIcon}
              label="Townhouse"
            />
          )}
          {listing.category === "privateRoom" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleRoomIcon}
              label="Private Room"
            />
          )}
          {(listing.category === "apartment" || listing.category === "condo") && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedApartmentIcon}
              label="Apartment"
            />
          )}

          {/* Furnished Status */}
          <AmenityListItem
            icon={listing.furnished ? AmenitiesIcons.UpdatedFurnishedIcon : AmenitiesIcons.UpdatedUnfurnishedIcon}
            label={listing.furnished ? "Furnished" : "Unfurnished"}
          />

          {/* Utilities */}
          <AmenityListItem
            icon={listing.utilitiesIncluded ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon}
            label={listing.utilitiesIncluded ? "Utilities Included" : "No Utilities"}
          />

          {/* Pets */}
          <AmenityListItem
            icon={listing.petsAllowed ? AmenitiesIcons.UpdatedPetFriendlyIcon : AmenitiesIcons.UpdatedPetUnfriendlyIcon}
            label={listing.petsAllowed ? "Pets Allowed" : "No Pets"}
          />
        </div>
      </div>

      {/* Property Description */}
      <div className="py-12 border-b border-[#D8D9D8]">
        <p className="text-gray-600 leading-relaxed">
          {listing.description ||
            'Our spacious home, located just a 20-minute drive from ski resorts and a 2-minute drive from downtown Ogden, is the perfect centrally located home for your Utah stay. With modern updates, a private front porch *with mountain views*, and a wonderfully manicured backyard with a gas fire pit and outdoor dining area, this home is well equipped to host large Families, or even guests just looking for a peaceful getaway. '}
        </p>
      </div>

      {/* Property Amenities */}
      <div className="py-12">
        <h3 className="text-[24px] text-[#404040] font-medium mb-4">Amenities</h3>
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-8 space-y-2 md:space-y-0">
          {displayAmenities.slice(0, initialDisplayCount).map((amenity) => (
            <AmenityListItem
              key={amenity.code}
              icon={amenity.icon || Star}
              label={amenity.label}
            />
          ))}
        </div>
        {displayAmenities.length > initialDisplayCount && (
          <Dialog>
            <DialogTrigger className=" mt-2">
              <Button variant="outline" className='text-[16px]' >
                Show all {displayAmenities.length} amenities
              </Button>
            </DialogTrigger>
            <DialogContent className={TallDialogContent}>
              <h2 className={TallDialogTitle}>All Amenities</h2>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col">
                  {Object.entries(
                    displayAmenities.reduce((acc, amenity) => {
                      const category = amenity.category || 'Other';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(amenity);
                      return acc;
                    }, {} as Record<string, typeof displayAmenities>)
                  ).map(([category, amenities]) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-[17px] font-medium text-[#404040] mb-2">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </h3>
                      {amenities.map((amenity) => (
                        <AmenityListItem
                          key={amenity.code}
                          icon={amenity.icon || Star}
                          label={amenity.label}
                          iconClassNames='h-[24px] w-[24px]'
                          labelClassNames='md:text-[16px]'
                          className='py-2 border-b border-[#40404080] space-y-2'
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

    </div>
  );
};

export default ListingDetails;
