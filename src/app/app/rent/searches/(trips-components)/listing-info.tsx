import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ListingAndImages } from '@/types';
import PropertyDetails from './property-details';
import PricingInfo from './pricing-info';
import HighlightsSection from './highlights-section';
import AmenitiesSection from './amenities-section';
import HostInformation from './host-information';
import DescriptionSection from './description-section';
import { calculateRent } from '@/lib/calculate-rent';
const sectionStyles = 'border-b pb-5 mt-5';

interface ListingDescriptionProps {
  listing: ListingAndImages;
  showFullAmenities?: boolean;
  isFlexible?: boolean;
  trip?: any;
  isAuthenticated?: boolean;
  tripContext?: {
    tripId?: string;
    startDate: Date;
    endDate: Date;
    numAdults?: number;
    numChildren?: number;
    numPets?: number;
  } | null;
  calculatedPrice?: number | null;
  listingState?: { hasApplied: boolean; isMatched: boolean } | null;
  onApplyClick?: () => void;
  onDatesSelected?: (start: Date, end: Date, guests: { adults: number; children: number; pets: number }) => void;
  requestOpenDates?: number;
  requestApply?: number;
  onMobileStateChange?: (state: { hasDates: boolean; startDate: Date | null; endDate: Date | null; guests: { adults: number; children: number; pets: number } }) => void;
}

const ListingDescription: React.FC<ListingDescriptionProps> = ({
  listing,
  showFullAmenities = false,
  isFlexible = false,
  trip,
  isAuthenticated,
  tripContext,
  calculatedPrice: calculatedPriceProp,
  listingState,
  onApplyClick,
  onDatesSelected,
  requestOpenDates,
  requestApply,
  onMobileStateChange,
}) => {
  const calculatedPrice = trip ? calculateRent({ listing, trip }) : calculatedPriceProp;

  return (
    <div className='w-full'>
      <Card className="border-none shadow-none rounded-xl mt-5 lg:block hidden">
        <CardContent className="p-0">
          <PropertyDetails listing={listing} />
        </CardContent>
      </Card>

      <Card className="border-none bg-[#FAFAFA] rounded-xl mt-5 lg:hidden">
        <CardContent className="p-0">
          <PricingInfo listing={listing} calculatedPrice={calculatedPrice} />
          <PropertyDetails listing={listing} />
        </CardContent>
      </Card>

      {/* Host info + trip details - mobile only, right after property details */}
      <HostInformation
        listing={listing}
        isAuthenticated={isAuthenticated}
        tripContext={tripContext}
        calculatedPrice={calculatedPrice}
        listingState={listingState}
        onApplyClick={onApplyClick}
        onDatesSelected={onDatesSelected}
        requestOpenDates={requestOpenDates}
        requestApply={requestApply}
        onMobileStateChange={onMobileStateChange}
      />

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
