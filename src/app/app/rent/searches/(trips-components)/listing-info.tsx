import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ListingAndImages } from '@/types';
import PropertyDetails from './property-details';
import HighlightsSection from './highlights-section';
import AmenitiesSection from './amenities-section';
import DescriptionSection from './description-section';
import { calculateRent } from '@/lib/calculate-rent';
const sectionStyles = 'border-b pb-5 mt-5';

interface ListingDescriptionProps {
  listing: ListingAndImages;
  showFullAmenities?: boolean;
  isFlexible?: boolean;
  trip?: any;
}

const ListingDescription: React.FC<ListingDescriptionProps> = ({
  listing,
  showFullAmenities = false,
  isFlexible = false,
  trip,
}) => {
  const calculatedPrice = trip ? calculateRent({ listing, trip }) : null;

  return (
    <div className='w-full'>
      <Card className="border-none shadow-none rounded-xl mt-5 lg:block hidden">
        <CardContent className="p-0">
          <PropertyDetails listing={listing} />
        </CardContent>
      </Card>

      <Card className="border-none bg-transparent rounded-none mt-5 lg:hidden">
        <CardContent className="p-0">
          <PropertyDetails listing={listing} />
        </CardContent>
      </Card>

      {isFlexible && (
        <p className={`flex justify-between ${sectionStyles} text-[#404040] text-[16px] sm:text-[24px] font-normal`}>
          Available {' '}
          {listing.availableStart?.toLocaleDateString('en-gb', {
            day: '2-digit',
            month: 'short'
          })} - {listing.availableEnd?.toLocaleDateString('en-gb', {
            day: '2-digit',
            month: 'short'
          })}
        </p>
      )}

      <div className="lg:mt-8 mt-5">
        <HighlightsSection listing={listing} trip={trip} />
      </div>

      <div className="mt-5">
        <DescriptionSection listing={listing} />
      </div>

      <div className="mt-5">
        <AmenitiesSection
          listing={listing}
          showFullAmenities={showFullAmenities}
        />
      </div>

    </div>
  );
};

export default ListingDescription;
