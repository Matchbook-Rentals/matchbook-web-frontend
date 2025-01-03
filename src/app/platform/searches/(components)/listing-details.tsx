import React, { useState } from 'react';
import { ListingAndImages } from '@/types';
import { Home, Sofa, Zap, Dog, Star, Mountain, Trees, Tv, Car, Wifi, Coffee, Snowflake, Waves, Dumbbell, Lock, UtensilsCrossed, Bath, Warehouse } from 'lucide-react';
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

const getAmenityIcon = (amenity: string) => {
  switch (amenity) {
    // General Amenities
    case 'laundryFacilities': return { icon: AmenitiesIcons.WasherIcon, label: 'Laundry Facilities' };
    case 'fitnessCenter': return { icon: AmenitiesIcons.GymIcon, label: 'Fitness Center' };
    case 'wheelchairAccess': return { icon: AmenitiesIcons.WheelchairAccessibleIcon, label: 'Wheelchair Access' };
    case 'parking': return { icon: AmenitiesIcons.ParkingIcon, label: 'Parking' };
    case 'hotTub': return { icon: AmenitiesIcons.HotTubIcon, label: 'Hot Tub' };
    case 'secure': return { icon: AmenitiesIcons.SecurityIcon, label: 'Secure' };
    case 'waterfront': return { icon: AmenitiesIcons.WaterfrontIcon, label: 'Waterfront' };
    case 'mountainView': return { icon: AmenitiesIcons.MountainViewIcon, label: 'Mountain View' };
    case 'waterView': return { icon: AmenitiesIcons.WaterViewIcon, label: 'Water View' };
    case 'cityView': return { icon: AmenitiesIcons.CityViewIcon, label: 'City View' };

    // Parking Options
    case 'streetParking': return { icon: AmenitiesIcons.ParkingIcon, label: 'Street Parking' };
    case 'streetParkingFree': return { icon: AmenitiesIcons.ParkingIcon, label: 'Street Parking Free' };
    case 'coveredParking': return { icon: AmenitiesIcons.ParkingIcon, label: 'Covered Parking' };
    case 'coveredParkingFree': return { icon: AmenitiesIcons.ParkingIcon, label: 'Covered Parking Free' };
    case 'uncoveredParking': return { icon: AmenitiesIcons.ParkingIcon, label: 'Uncovered Parking' };
    case 'uncoveredParkingFree': return { icon: AmenitiesIcons.ParkingIcon, label: 'Uncovered Parking Free' };
    case 'garageParking': return { icon: AmenitiesIcons.ParkingIcon, label: 'Garage Parking' };
    case 'garageParkingFree': return { icon: AmenitiesIcons.ParkingIcon, label: 'Garage Parking Free' };
    case 'evCharging': return { icon: AmenitiesIcons.ChargingIcon, label: 'EV Charging' };

    // Structural Amenities
    case 'gym': return { icon: AmenitiesIcons.GymIcon, label: 'Gym' };
    case 'balcony': return { icon: AmenitiesIcons.BalconyIcon, label: 'Balcony' };
    case 'patio': return { icon: AmenitiesIcons.PatioIcon, label: 'Patio' };
    case 'sunroom': return { icon: AmenitiesIcons.SunroomIcon, label: 'Sunroom' };
    case 'pool': return { icon: AmenitiesIcons.PoolIcon, label: 'Pool' };
    case 'hottub': return { icon: AmenitiesIcons.HotTubIcon, label: 'Hot Tub' };
    case 'sauna': return { icon: AmenitiesIcons.SaunaIcon, label: 'Sauna' };
    case 'grill': return { icon: AmenitiesIcons.GrillIcon, label: 'Grill' };
    case 'wheelAccessible': return { icon: AmenitiesIcons.WheelchairAccessibleIcon, label: 'Wheel Accessible' };
    case 'fencedInYard': return { icon: AmenitiesIcons.FencedYardIcon, label: 'Fenced In Yard' };
    case 'security': return { icon: AmenitiesIcons.SecurityIcon, label: 'Secure Lobby' };
    case 'keylessEntry': return { icon: AmenitiesIcons.KeylessEntryIcon, label: 'Keyless Entry' };
    case 'gatedEntry': return { icon: AmenitiesIcons.GatedEntryIcon, label: 'Gated Entry' };
    case 'alarmSystem': return { icon: AmenitiesIcons.AlarmSystemIcon, label: 'Alarm System' };
    case 'smokeDetector': return { icon: AmenitiesIcons.SmokeDetectorIcon, label: 'Smoke Det' };
    case 'carbonMonoxideDetector': return { icon: AmenitiesIcons.CarbonMonoxideDetectorIcon, label: 'CO Detector' };

    // Kitchen
    case 'garbageDisposal': return { icon: AmenitiesIcons.GarbageDisposalIcon, label: 'Garbage Disposal' };
    case 'dishwasher': return { icon: AmenitiesIcons.Dishwasher, label: 'Dishwasher' };

    // Furnished
    case 'tv': return { icon: Dumbbell, label: 'TV' };
    case 'workstation': return { icon: Dumbbell, label: 'Workstation' };
    case 'microwave': return { icon: Dumbbell, label: 'Microwave' };
    case 'kitchenEssentails': return { icon: Dumbbell, label: 'Kitchen Essentials' };
    case 'linens': return { icon: Dumbbell, label: 'Linens' };
    case 'privateBathroom': return { icon: Dumbbell, label: 'Private Bathroom' };
    case 'washerInUnit': return { icon: AmenitiesIcons.WasherIcon, label: 'In Unit' };
    case 'washerInComplex': return { icon: AmenitiesIcons.WasherIcon, label: 'In Complex' };

    default: return { icon: Dumbbell, label: amenity };
  }
};

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing }) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const getRandomAmenities = () => {
    const shuffled = [...iconAmenities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  };

  const getRandomHighlights = () => {
    const baseHighlights = [
      { type: "category", value: listing.category },
      { type: "furnished", value: listing.furnished },
      { type: "utilities", value: listing.utilitiesIncluded },
      { type: "pets", value: listing.petFriendly },
    ];
    return baseHighlights.slice(0, 4);
  };

  return (
    <div className={`w-full ${montserrat.className}`}>
      {/* Host Information */}
      <div className="flex items-center justify-between pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={listing.user.imageUrl}
              alt="Host"
              className="w-full h-full object-cover"
            />
          </div>
          <div className=''>
            <p className="text-xl md:text-[24px] text-[#404040] font-medium pb-2 font-montserrat">Hosted by Daniel</p>
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
          <h3 className="text-[#404040] text-[24px] font-medium"> Matchbook Verified Guests Preferred </h3>
        </div>
        <div className="flex flex-wrap gap-y-6 gap-x-1 justify-between">
          {!showAllAmenities ? (
            <>
              {/* Property Type */}
              {listing.category === "singleFamily" || "single_family" && (
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
              {listing.petFriendly ? (
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
        <h3 className="text-2xl font-semibold mb-4">Description</h3>
        <p className="text-gray-600 leading-relaxed">
          Our spacious home, located just a 20-minute drive from ski resorts and a 2-minute drive from downtown Ogden, is the perfect centrally located home for your Utah stay. With modern updates, a private front porch *with mountain views*, and a wonderfully manicured backyard with a gas fire pit and outdoor dining area, this home is well equipped to host large Families, or even guests just looking for a peaceful getaway.
        </p>
      </div>

      {/* Property Amenities */}
      <div className="py-12">
        <h3
          className="text-2xl font-semibold mb-4 cursor-pointer"
          onClick={() => setShowAllAmenities(!showAllAmenities)}
        >
          Amenities {showAllAmenities ? '(show less)' : '(show more)'}
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,104px)] gap-6 justify-between">
          {(showAllAmenities ? iconAmenities : getRandomAmenities()).map((amenity) => {
            const { icon: Icon, label } = getAmenityIcon(amenity.code);
            return (
              <Tile
                key={amenity.code}
                icon={<Icon className="max-h-[40px] max-w-[40px]" />}
                label={label}
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
