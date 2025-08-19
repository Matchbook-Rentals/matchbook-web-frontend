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
      <div className="flex flex-wrap w-full max-w-[424px] items-center justify-between gap-[24px_24px] relative hidden lg:flex">
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

      {/* Mobile Property Details - Medium+ screens */}
      <div className="md:flex flex-wrap items-center justify-between gap-[24px_24px] relative self-stretch w-full lg:hidden hidden">
        <div className="inline-flex items-center gap-2 relative">
          <MapPin className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
            {listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.city || listing.address || "Location"}
          </span>
        </div>
        
        <div className="inline-flex items-center gap-2 relative">
          <Bed className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
            {listing.roomCount || 0} Bed
          </span>
        </div>
        
        <div className="inline-flex items-center gap-2 relative">
          <Bath className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
            {listing.bathroomCount || 0} Bath
          </span>
        </div>
        
        <div className="inline-flex items-center gap-2 relative">
          <Square className="w-5 h-5 text-[#5d606d]" />
          <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
            {listing.squareFootage?.toLocaleString() || 0} sqft
          </span>
        </div>
      </div>

      {/* Mobile Property Details - Small screens */}
      <div className="flex flex-wrap items-center justify-between gap-[24px_24px] relative self-stretch w-full md:hidden">
        <div className="flex items-center justify-between gap-[24px] relative w-full">
          <div className="inline-flex items-center gap-2 relative">
            <MapPin className="w-5 h-5 text-[#5d606d]" />
            <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
              {listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.city || listing.address || "Location"}
            </span>
          </div>
          
          <div className="inline-flex items-center gap-2 relative">
            <Bed className="w-5 h-5 text-[#5d606d]" />
            <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
              {listing.roomCount || 0} Bed
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-[24px] relative w-full">
          <div className="inline-flex items-center gap-2 relative">
            <Bath className="w-5 h-5 text-[#5d606d]" />
            <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
              {listing.bathroomCount || 0} Bath
            </span>
          </div>
          
          <div className="inline-flex items-center gap-2 relative">
            <Square className="w-5 h-5 text-[#5d606d]" />
            <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
              {listing.squareFootage?.toLocaleString() || 0} sqft
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyDetails;
