import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star as StarIcon, CheckCircle } from 'lucide-react';
import { ListingAndImages } from '@/types';
import SearchMessageHostDialog from '@/components/ui/search-message-host-dialog';

interface HostInformationProps {
  listing: ListingAndImages;
}

const HostInformation: React.FC<HostInformationProps> = ({ listing }) => {
  return (
    <Card className="border-none bg-[#FAFAFA] rounded-xl mt-5 lg:hidden">
      <CardContent className="flex flex-col items-start gap-5 p-4">
        {/* Host information */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage 
              src={listing.user?.imageUrl || ''} 
              alt={`${listing.user?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-secondaryBrand text-white font-medium text-xl md:text-2xl lg:text-3xl">
              {(listing.user?.firstName?.charAt(0) + listing.user?.lastName?.charAt(0)) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-[#373940] text-sm">
              Hosted by {listing.user?.firstName || 'Host'}
            </div>

            <div className="flex items-center gap-1 h-8">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="font-normal text-[#717680] text-sm">
                {listing?.averageRating || listing.uScore 
                  ? (listing?.averageRating || listing.uScore?.toFixed(1)) 
                  : 'N/A'} ({listing?.numberOfStays || 0})
              </span>
            </div>
          </div>
        </div>

        {/* Verified badge */}
        {listing.user?.verifiedAt && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-[#717680]" />
            <span className="font-normal text-[#717680] text-xs">
              Verified
            </span>
          </div>
        )}

        {/* Message button */}
        <div className="w-full">
          <SearchMessageHostDialog 
            listingId={listing.id} 
            hostName={listing.user?.firstName || 'Host'} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default HostInformation;