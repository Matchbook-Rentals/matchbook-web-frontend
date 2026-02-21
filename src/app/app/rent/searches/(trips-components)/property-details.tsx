import React from 'react';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import { ListingAndImages } from '@/types';

interface PropertyDetailsProps {
  listing: ListingAndImages;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ listing }) => {
  return (
    <>
      {/* Desktop Property Details */}
      <div className="flex flex-wrap w-full items-center gap-8 relative hidden lg:flex">
        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
          <MapPin className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
            {listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.city || listing.address || "Location"}
          </span>
        </div>
        
        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
          <Bed className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
            {listing.roomCount || 0} Bed
          </span>
        </div>
        
        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
          <Bath className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
            {listing.bathroomCount || 0} Bath
          </span>
        </div>
        
        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
          <Square className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
            {listing.squareFootage?.toLocaleString() || 0} sqft
          </span>
        </div>
      </div>

      {/* Mobile Property Details */}
      <div className="flex items-center gap-3 w-full lg:hidden">
        <div className="inline-flex items-center gap-2 min-w-0 flex-shrink">
          <MapPin className="w-5 h-5 text-[#5d606d] flex-shrink-0" />
          <span className="font-normal text-[#5d606d] text-sm font-['Poppins',Helvetica] truncate">
            {listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.city || listing.address || "Location"}
          </span>
        </div>

        <div className="inline-flex items-center gap-2 flex-shrink-0">
          <Bed className="w-5 h-5 text-[#5d606d]" />
          <span className="font-normal text-[#5d606d] text-sm font-['Poppins',Helvetica]">
            {listing.roomCount || 0} Bed
          </span>
        </div>

        <div className="inline-flex items-center gap-2 flex-shrink-0">
          <Bath className="w-5 h-5 text-[#5d606d]" />
          <span className="font-normal text-[#5d606d] text-sm font-['Poppins',Helvetica]">
            {listing.bathroomCount || 0} Bath
          </span>
        </div>

        <div className="inline-flex items-center gap-2 flex-shrink-0">
          <Square className="w-5 h-5 text-[#5d606d]" />
          <span className="font-normal text-[#5d606d] text-sm font-['Poppins',Helvetica]">
            {listing.squareFootage?.toLocaleString() || 0} sqft
          </span>
        </div>
      </div>
    </>
  );
};

export default PropertyDetails;
