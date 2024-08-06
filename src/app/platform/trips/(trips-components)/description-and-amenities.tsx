import React from 'react';
import { AmenityCards } from './amenity-cards';
import Tile from '@/components/ui/tile';
import { ApartmentIcon, SingleHomeIcon } from '@/components/svgs/svg-components';
import { CrossIcon } from 'lucide-react';
import { AmenityTiles } from './amenity-tiles';
import SearchMap from '../../searches/(components)/search-map';
import { User } from '@prisma/client';
import RatingStar from '@/components/ui/rating-star';

interface ComponentProps {
  description: string;
  roomCount?: number;
  address?: string;
  bathroomCount?: number;
  propertyType?: string;
  rating?: number;
  user?: User
  amenities?: string[];
  listingPin?: {
    lat: number;
    lng: number;
  };
}

const getIconAndLabel = (amenity: string): React.ReactElement => {
  switch (amenity) {
    case 'single_family':
      return <Tile icon={<SingleHomeIcon />} label="Single Family" />;
    default:
      return <Tile icon={<SingleHomeIcon />} label="update switch" />;
  }
};

const DescriptionAndAmenities: React.FC<ComponentProps> = ({ description, amenities, listingPin, user, rating = 3.5, address, bathroomCount, roomCount, propertyType }) => {
  const getTimeOnMatchbook = (createdAt: Date | undefined) => {
    if (!createdAt) return 'Joined today';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 730) { // More than 23 months (approx. 2 years)
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} on Matchbook`;
    } else if (diffDays > 59) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} on Matchbook`;
    } else if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} on Matchbook`;
    } else {
      return 'Joined today';
    }
  };

  return (
    <div className="flex gap-x-4">
      {/* Left half */}
      <div className="w-1/2 min-h-[600px] p-4">
        <p className='text-lg text-center flex items-center justify-center pb-2 font-semibold'>{address}</p>
        <SearchMap markers={[listingPin]} center={listingPin!} zoom={15} />
      </div>
      {/* Right half */}
      <div className="w-1/2 flex flex-col">
        {/* Hosted by, Rating, Badges */}
        <div className="flex justify-between mb-4">
          <div className='flex flex-col gap-y-2'>
            <div className='flex gap-x-2'>
              <img src={user?.imageUrl || ''} alt={user?.fullName || ''} className='w-10 h-10 rounded-full'></img>
              <div className='flex flex-col'>
                <p>Hosted by {user?.fullName || user?.firstName + ' ' + user?.lastName}</p>
                <p className='text-gray-500'>{getTimeOnMatchbook(user?.createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="flex" onClick={() => console.log(user)}>
            <RatingStar rating={rating} /> {rating.toFixed(2).replace(/\.?0*$/, '')}
          </div>
          <p>Badges</p>
        </div>

        {/* Highlights */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-center">Highlights</h2>
          <div className='mt-3 flex test w-full justify-between'>
            {getIconAndLabel(propertyType)}
            <Tile icon={<CrossIcon />} label={`${bathroomCount} bathrooms`} />
            <Tile icon={<CrossIcon />} label={`${roomCount} bedrooms`} />
            <Tile icon={<CrossIcon />} label={`${1} bedrooms`} />
          </div>
        </div>

        {/* Property Description */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">Property Description</h2>
          <div className="text-gray-700">{description}</div>
        </div>

        {/* Other Amenities */}
        <div>
          <h2 className="text-2xl font-bold">OTHER AMENITIES</h2>
        </div>
      </div>
    </div>
  );
};

export { DescriptionAndAmenities }