import React from 'react';
import { ListingAndImages } from '@/types';

interface PricingInfoProps {
  listing: ListingAndImages;
}

const PricingInfo: React.FC<PricingInfoProps> = ({ listing }) => {
  return (
    <div className="flex items-start justify-between w-full lg:hidden">
      {/* Monthly price */}
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold text-[#373940] text-sm tracking-[0] font-['Poppins',Helvetica]">
          ${listing.price?.toLocaleString()}
        </span>
        <span className="font-normal text-[#5d606d] text-base tracking-[0] font-['Poppins',Helvetica]">
          Month
        </span>
      </div>

      {/* Deposit price */}
      <div className="flex flex-col items-end gap-1">
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