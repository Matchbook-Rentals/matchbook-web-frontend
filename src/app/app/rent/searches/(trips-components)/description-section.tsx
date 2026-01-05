import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BrandButton } from '@/components/ui/brandButton';
import { ListingAndImages } from '@/types';

interface DescriptionSectionProps {
  listing: ListingAndImages;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({ listing }) => {
  const MAX_LENGTH = 300;
  const [showMore, setShowMore] = useState(false);
  
  const fullDescription = listing.description;
  const shouldTruncate = fullDescription.length > MAX_LENGTH;
  const displayText = shouldTruncate && !showMore 
    ? fullDescription.slice(0, MAX_LENGTH) 
    : fullDescription;

  return (
    <Card className="border-none shadow-none rounded-xl mt-5">
      <CardContent className="flex flex-col items-start gap-[18px] py-5 px-0">
        <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
          Description
        </h3>
        <p className="font-['Poppins'] text-[16px] font-normal text-[#484A54] whitespace-pre-wrap break-words overflow-hidden">
          {displayText}
          {shouldTruncate && (
            <BrandButton
              variant="ghost"
              className="text-primaryBrand px-0 py-0 h-auto min-w-0 inline ml-1"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'See less' : 'See more'}
            </BrandButton>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default DescriptionSection;
