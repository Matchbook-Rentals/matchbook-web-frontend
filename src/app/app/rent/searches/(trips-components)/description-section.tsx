import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ListingAndImages } from '@/types';

interface DescriptionSectionProps {
  listing: ListingAndImages;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({ listing }) => {
  return (
    <Card className="bg-[#FAFAFA] border-none rounded-xl mt-5">
      <CardContent className="flex flex-col items-start gap-[18px] p-5">
        <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
          Description
        </h3>
        <p className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
          {listing.description + listing.description + listing.description + listing.description}
        </p>
      </CardContent>
    </Card>
  );
};

export default DescriptionSection;