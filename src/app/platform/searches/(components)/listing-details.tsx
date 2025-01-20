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
import AmenityListItem from './amenity-list-item';

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
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={listing.user?.imageUrl}
              alt="Host"
              className="w-full h-full object-cover"
            />
          </div>
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
      {/* Property Highlights */}
      <div className="py-12 border-b border-[#D8D9D8]">
        <h3 className="text-[24px] text-[#404040] font-medium mb-4">Highlights</h3>
        <div className='flex space-x-4 items-center mb-4'>
          <MatchbookVerified />
          <h3 className="text-[#404040] text-[24px]"> Matchbook Verified Guests Preferred </h3>
        </div>
        <div className="flex flex-col space-y-2">
          {/* Property Type */}
          {listing.category === "singleFamily" && (
            <AmenityListItem
              icon={AmenitiesIcons.SingleFamilyIcon}
              label="Single Family"
            />
          )}
          {listing.category === "townhouse" && (
            <AmenityListItem
              icon={AmenitiesIcons.TownhouseIcon}
              label="Townhouse"
            />
          )}
          {listing.category === "privateRoom" && (
            <AmenityListItem
              icon={AmenitiesIcons.SingleRoomIcon}
              label="Private Room"
            />
          )}
          {(listing.category === "apartment" || listing.category === "condo") && (
            <AmenityListItem
              icon={AmenitiesIcons.ApartmentIcon}
              label="Apartment"
            />
          )}

          {/* Furnished Status */}
          <AmenityListItem
            icon={listing.furnished ? AmenitiesIcons.FurnishedIcon : AmenitiesIcons.UnfurnishedIcon}
            label={listing.furnished ? "Furnished" : "Unfurnished"}
          />

          {/* Utilities */}
          <AmenityListItem
            icon={listing.utilitiesIncluded ? AmenitiesIcons.UtilitiesIncludedIcon : AmenitiesIcons.UtilitiesNotIncludedIcon}
            label={listing.utilitiesIncluded ? "Utilities Included" : "No Utilities"}
          />

          {/* Pets */}
          <AmenityListItem
            icon={listing.petsAllowed ? AmenitiesIcons.PetFriendlyIcon : AmenitiesIcons.PetUnfriendlyIcon}
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
        <h3
          className="text-2xl font-medium mb-4 cursor-pointer"
          onClick={() => setShowAllAmenities(!showAllAmenities)}
        >
          Amenities {showAllAmenities ? '(show less)' : '(show more)'}
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,104px)] gap-6 justify-between">
          {(showAllAmenities ? iconAmenities : displayAmenities).map((amenity) => {
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
