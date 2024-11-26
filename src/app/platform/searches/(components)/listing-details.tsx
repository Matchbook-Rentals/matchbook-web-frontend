import React from 'react';
import { ListingAndImages } from '@/types';
import { Home, Sofa, Zap, Dog, Star, Mountain, Trees, Tv, Car, Wifi, Coffee, Snowflake, Waves, Dumbbell, Lock, UtensilsCrossed, Bath, Warehouse } from 'lucide-react';
import * as AmenitiesIcons from '@/components/icons/amenities';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Tile from '@/components/ui/tile';
import { amenities, iconAmenities, highlightAmenities } from '@/lib/amenities-list';
import { Montserrat } from 'next/font/google';

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
    case 'smokeDetector': return { icon: AmenitiesIcons.SmokeDetectorIcon, label: 'Smoke Detector' };
    case 'carbonMonoxideDetector': return { icon: AmenitiesIcons.CarbonMonoxideDetectorIcon, label: 'Carbon Monoxide Det' };

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
  return (
    <div className={`md:w-1/2 p-6 ${montserrat.className}`}>

      {/* Property Stats */}
      <div className="flex justify-between items-center mb-12 md:mb-0">
        <div>
          <h2 className="text-2xl md:text-4xl mb-2 md:mb-8 font-medium">3 BR | 2 BA</h2>
          <p className="text-lg md:text-2xl text-gray-600">1,500 Sqft</p>
        </div>
        <div className="text-right">
          <p className="text-2xl md:text-4xl mb-2 md:mb-8 font-medium">$2,350 / Mo</p>
          <p className="text-lg md:text-2xl text-gray-600">$1500 Dep.</p>
        </div>
      </div>

      {/* Host Information */}
      <div className="flex items-center justify-between border-b pb-6 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={listing.user.imageUrl}
              alt="Host"
              className="w-full h-full object-cover"
            />
          </div>
          <div className=''>
            <p className="text-xl md:text-lg lg:text-xl">Hosted by Daniel</p>
            <p className="text-gray-600 md:text-lg lg:text-xl">2 years on Matchbook</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-col">
          <p className="hidden sm:block md:hidden lg:block text-xl truncate ">23 stays</p>
          <HoverCard>
            <HoverCardTrigger>
              <div className="flex items-center gap-1 cursor-default">
                <Star className="fill-current text-gray-700" size={24} />
                <span className="text-xl">{(listing?.uScore / 10).toFixed(1)}<span className="sm:hidden md:inline lg:hidden align-sub text-sm">(23)</span></span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-auto">
              <p className="text-sm">Raw Score: {listing?.uScore?.toFixed(3)}</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      {/* Host Badges */}
      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 mt-6">
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/matchbook-verified.png' alt='Matchbook Verified Badge' />
          </div>
          <span className='font-semibold'>Verified</span>
        </div>
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/trailblazer.png' alt='Trailblazer Badge' />
          </div>
          <span className='font-semibold'>Trailblazer</span>
        </div>
        <div className="flex items-center gap-2 ">
          <div className="w-7 h-7" >
            <img src='/badges_png/hallmark-host.png' alt='Hallmark Host Badge' />
          </div>
          <span className='font-semibold'>Hallmark Host</span>
        </div>
      </div>

      {/* Property Highlights */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-4">Highlights</h3>
        <div className="flex flex-wrap gap-y-6 gap-x-1 justify-between">
          <Tile icon={<Home size={64} className='' />} label="Single Family" />
          <Tile icon={<Sofa size={64} />} label="Furnished" />
          <Tile icon={<Zap size={64} />} label="Utilities included" />
          <Tile icon={<Dog size={64} />} label="Pets Allowed" />
        </div>
      </div>

      {/* Property Description */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-4">Description</h3>
        <p className="text-gray-600 leading-relaxed">
          Our spacious home, located just a 20-minute drive from ski resorts and a 2-minute drive from downtown Ogden, is the perfect centrally located home for your Utah stay. With modern updates, a private front porch *with mountain views*, and a wonderfully manicured backyard with a gas fire pit and outdoor dining area, this home is well equipped to host large Families, or even guests just looking for a peaceful getaway.
        </p>
      </div>

      {/* Property Availability */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-4">Property availability</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primaryBrand"></div>
            <span onClick={() => console.log('unavailablities:', listing.unavailablePeriods)}>Preferred</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-300"></div>
            <span>Available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Move in Calendar */}
          <div>
            <h4 className="text-xl mb-2">Move in</h4>
            <p className="text-gray-600 mb-2">Jan 23</p>
            <div className="grid grid-cols-7 gap-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-sm text-gray-600">{day}</div>
              ))}
              {Array(30).fill(null).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 flex items-center justify-center rounded-full
                    ${i === 9 ? 'bg-primaryBrand text-white' :
                      i >= 12 && i <= 29 ? 'bg-gray-200' : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Move out Calendar */}
          <div>
            <h4 className="text-xl mb-2">Move out</h4>
            <p className="text-gray-600 mb-2">Dec 23</p>
            <div className="grid grid-cols-7 gap-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-sm text-gray-600">{day}</div>
              ))}
              {Array(30).fill(null).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 flex items-center justify-center rounded-full
                    ${i === 15 ? 'bg-primaryBrand text-white' :
                      i <= 4 ? 'bg-gray-200' : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Property Amenities */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-4">Amenities</h3>
        <div className="flex flex-wrap gap-y-6 gap-x-2 justify-start">
          {iconAmenities.map((amenity) => {
            const { icon: Icon, label } = getAmenityIcon(amenity.code);
            return <Tile key={amenity.code} icon={<Icon className='' />} label={label} />;
          })}
        </div>
      </div>

    </div>
  );
};

export default ListingDetails;
