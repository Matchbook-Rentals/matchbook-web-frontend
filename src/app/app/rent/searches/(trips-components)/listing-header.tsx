import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ShareButton from '@/components/ui/share-button';
import { ListingAndImages } from '@/types';

interface ListingHeaderProps {
  listing: ListingAndImages;
  pathname: string;
  tripId: string;
  baseUrl: string;
}

const ListingHeader: React.FC<ListingHeaderProps> = ({ 
  listing, 
  pathname, 
  tripId, 
  baseUrl 
}) => {
  return (
    <>
      {/* Desktop Title and Details Section */}
      <Card className="border-none shadow-none mt-6 hidden lg:block">
        <CardContent className="flex flex-col items-start gap-3 p-0">
          <div className="items-center justify-between self-stretch w-full flex relative">
            <div className="flex-col items-start gap-4 flex-1 grow flex relative">
              <div className="items-center justify-between self-stretch w-full flex relative">
                <h1 className="relative w-fit mt-[-1.00px] font-medium text-[#404040] text-[32px] tracking-[-2.00px] font-['Poppins',Helvetica]">
                  {listing.title || "Your Home Away From Home"}
                </h1>
              </div>
            </div>

            <ShareButton
              title={`${listing.title} on Matchbook`}
              text={`Check out this listing on Matchbook: ${pathname}`}
              url={`${baseUrl}/guest/trips/${tripId}/listing/${listing.id}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Title and Details Section */}
      <Card className="border-none shadow-none mt-6 lg:hidden">
        <CardContent className="flex flex-col items-start gap-3 p-0">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between w-full">
              <h2 className="flex-1 font-medium text-[#404040] text-xl md:text-2xl tracking-[-2.00px] font-['Poppins',Helvetica]">
                {listing.title || "Your Home Away From Home"}
              </h2>

              <ShareButton
                title={`${listing.title} on Matchbook`}
                text={`Check out this listing on Matchbook: ${pathname}`}
                url={`${baseUrl}/guest/trips/${tripId}/listing/${listing.id}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ListingHeader;
