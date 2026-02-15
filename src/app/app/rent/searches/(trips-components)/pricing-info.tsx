import React from 'react';
import { ListingAndImages } from '@/types';

interface PricingInfoProps {
  listing: ListingAndImages;
  calculatedPrice?: number;
}

const PricingInfo: React.FC<PricingInfoProps> = ({ listing, calculatedPrice }) => {
  const getPriceRange = () => {
    if (!listing.monthlyPricing || listing.monthlyPricing.length === 0) {
      return { min: listing.price || 0, max: listing.price || 0, hasRange: false };
    }

    const prices = listing.monthlyPricing.map(pricing => pricing.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      min: minPrice,
      max: maxPrice,
      hasRange: minPrice !== maxPrice
    };
  };

  const priceRange = getPriceRange();

  const getPriceDisplay = () => {
    if (calculatedPrice) {
      return `$${calculatedPrice.toLocaleString()}`;
    }
    if (priceRange.hasRange) {
      return `$${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()}`;
    }
    return `$${priceRange.min.toLocaleString()}`;
  };

  return (
    <div className="flex items-start justify-between w-full lg:hidden">
      {/* Monthly price */}
      <div className="flex flex-col items-start gap-1 pb-4">
        <span className="font-semibold text-[#373940] text-sm tracking-[0] font-['Poppins',Helvetica]">
          {getPriceDisplay()}
        </span>
        <span className="font-normal text-[#5d606d] text-base tracking-[0] font-['Poppins',Helvetica]">
          Month
        </span>
      </div>

      {/* Deposit price */}
      <div className="flex flex-col items-end gap-1 pb-4">
        <span className="font-semibold text-[#373940] text-sm tracking-[0] font-['Poppins',Helvetica]">
          ${listing.depositSize ? listing.depositSize.toLocaleString() : 'N/A'}
        </span>
        <span className="font-normal text-[#5d606d] text-base tracking-[0] font-['Poppins',Helvetica]">
          Deposit
        </span>
      </div>
    </div>
  );
};

export default PricingInfo;