import React, { useState, useEffect, useRef } from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Heart, CheckCircle, Check } from 'lucide-react';
import { BrandButton } from '@/components/ui/brandButton';
import Image from 'next/image';
import { useTripContext } from '@/contexts/trip-context-provider';
import SearchMessageHostDialog from '@/components/ui/search-message-host-dialog';

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
  const { actions } = useTripContext();
  const { optimisticApply } = actions;
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
              className="rounded-lg w-[80px] h-[45px] flex items-center justify-center border-none"
              style={{ backgroundColor: '#F65C6D' }}
              onClick={onReject}
            >
              <X className="h-4 w-4 text-white" />
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
                {listing?.averageRating
                  ? `${listing.averageRating.toFixed(1)} (${listing?.numberOfStays || 0})`
                  : <span className="italic">No reviews yet</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Verified badge */}
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-0 py-1 bg-transparent border-0"
        >
          <Image
            src="/svg/verified-badge.svg"
            alt="Verified"
            width={16}
            height={16}
          />
          <span className="font-normal text-xs text-greygrey-500 font-['Poppins',Helvetica]">
            Verified
          </span>
        </Badge>

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

        {/* Message Host */}
        <SearchMessageHostDialog
          listingId={listing.id}
          hostName={host?.firstName || 'Host'}
        />

        {/* Apply Now Button */}
        <BrandButton
          variant="default"
          className="w-full min-w-0 mt-1 font-semibold bg-[#0B6E6E] hover:bg-[#0B6E6E]/90"
          onClick={() => optimisticApply(listing)}
        >
          Apply Now
        </BrandButton>

      </CardContent>
    </Card>
  );
};

export default SearchListingDetailsBox;
