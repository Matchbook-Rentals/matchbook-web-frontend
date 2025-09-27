import React from 'react';
import { ListingAndImages } from '@/types';

interface PricingInfoProps {
  listing: ListingAndImages;
  calculatedPrice?: number;
}

const PricingInfo: React.FC<PricingInfoProps> = ({ listing, calculatedPrice }) => {
  return (
    <div className="flex items-start justify-between w-full lg:hidden">
      {/* Monthly price */}
      <div className="flex flex-col items-start gap-1 pb-4">
        <span className="font-semibold text-[#373940] text-sm tracking-[0] font-['Poppins',Helvetica]">
          ${(calculatedPrice || listing.price)?.toLocaleString()}
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