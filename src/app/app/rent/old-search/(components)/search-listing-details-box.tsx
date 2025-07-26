import React, { useState, useEffect, useRef } from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import SearchMessageHostDialog from '@/components/ui/search-message-host-dialog';
import { X, Heart, CheckCircle } from 'lucide-react';
import { BrandButton } from '@/components/ui/brandButton';

interface ListingDetailsBoxProps {
  listing: ListingAndImages;
  onReject: () => void;
  onReturn: () => void;
  onLike: () => void;
  setIsDetailsVisible: (isVisible: boolean) => void;
}

const SearchListingDetailsBox: React.FC<ListingDetailsBoxProps> = ({ 
  listing, 
  onReject, 
  onReturn, 
  onLike, 
  setIsDetailsVisible 
}) => {
  const host = listing.user;
  const detailsBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (detailsBoxRef.current) {
        const detailsBoxRect = detailsBoxRef.current.getBoundingClientRect();
        const isVisible = detailsBoxRect.top >= -90;
        setIsDetailsVisible(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsDetailsVisible]);

  return (
    <Card className="w-full  border border-[#0000001a] rounded-xl" ref={detailsBoxRef}>
      <CardContent className="flex flex-col items-start gap-5 p-4">
        {/* Header with buttons */}
        <div className="flex justify-between w-full mb-2">
          <Button 
            variant="ghost" 
            className="h-9 px-3.5 py-2.5 rounded-lg"
            onClick={onReturn}
          >
            <span className="font-semibold text-sm text-[#5d606d] underline">
              Undo
            </span>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-lg w-[80px] h-[45px] flex items-center justify-center"
              onClick={onReject}
            >
              <X className="h-4 w-4" />
            </Button>

            <BrandButton
              variant="default"
              className="rounded-lg w-[80px] h-[45px] min-w-0 flex items-center justify-center"
              onClick={onLike}
            >
              <Heart className="h-4 w-4 text-white" />
            </BrandButton>
          </div>
        </div>

        {/* Host information */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage 
              src={host?.imageUrl || ''} 
              alt={`${host?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-secondaryBrand text-white font-medium text-xl md:text-2xl lg:text-3xl">
              {(host?.firstName?.charAt(0) + host?.lastName?.charAt(0)) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-[#373940] text-sm">
              Hosted by {host?.firstName || 'Host'}
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
        {host?.verifiedAt && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-[#717680]" />
            <span className="font-normal text-[#717680] text-xs">
              Verified
            </span>
          </div>
        )}

        <Separator className="w-full" />

        {/* Pricing information */}
        <div className="flex justify-between w-full">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-[#373940] text-sm">
              ${listing.price?.toLocaleString()}
            </div>
            <div className="font-normal text-[#5d606d] text-base">Month</div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <div className="font-semibold text-[#373940] text-sm">
              ${listing.depositSize?.toLocaleString()}
            </div>
            <div className="font-normal text-[#5d606d] text-base">Deposit</div>
          </div>
        </div>

        {/* Message button - Custom styled for the new design */}
        <div className="w-full">
          <SearchMessageHostDialog 
            listingId={listing.id} 
            hostName={host?.firstName || 'Host'} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchListingDetailsBox;
