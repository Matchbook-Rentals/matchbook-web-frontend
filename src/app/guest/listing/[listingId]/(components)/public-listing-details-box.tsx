'use client'
import React from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/ui/brandButton';
import Image from 'next/image';

interface PublicListingDetailsBoxProps {
  listing: ListingAndImages;
}

const PublicListingDetailsBox: React.FC<PublicListingDetailsBoxProps> = ({ listing }) => {
  const host = listing.user;

  const getPriceRange = () => {
    if (!listing.monthlyPricing || listing.monthlyPricing.length === 0) {
      return { min: listing.price || 0, max: listing.price || 0, hasRange: false };
    }

    const prices = listing.monthlyPricing.map(pricing => pricing.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      min: minPrice,
      max: maxPrice,
      hasRange: minPrice !== maxPrice
    };
  };

  const priceRange = getPriceRange();

  return (
    <Card className="w-full border border-[#0000001a] rounded-xl">
      <CardContent className="flex flex-col items-start gap-5 p-4">
        {/* Host information */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage
              src={host?.imageUrl || ''}
              alt={`${host?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-[#3c8787] text-white font-medium text-xl">
              {((host?.firstName?.charAt(0) || '') + (host?.lastName?.charAt(0) || '')) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-[#373940] text-sm font-['Poppins']">
              Hosted by {host?.firstName || 'Host'}
            </div>

            <div className="flex items-center gap-1 h-8">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="font-normal text-[#717680] text-sm font-['Poppins']">
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
          <span className="font-normal text-xs text-[#717680] font-['Poppins']">
            Verified
          </span>
        </Badge>

        <Separator className="w-full" />

        {/* Pricing information */}
        <div className="flex justify-between w-full">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-[#373940] text-sm font-['Poppins']">
              {priceRange.hasRange
                ? `$${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()}`
                : `$${priceRange.min.toLocaleString()}`
              }
            </div>
            <div className="font-normal text-[#5d606d] text-base font-['Poppins']">Month</div>
          </div>

          {listing.depositSize && (
            <div className="flex flex-col gap-1 items-end">
              <div className="font-semibold text-[#373940] text-sm font-['Poppins']">
                ${listing.depositSize?.toLocaleString()}
              </div>
              <div className="font-normal text-[#5d606d] text-base font-['Poppins']">Deposit</div>
            </div>
          )}
        </div>

        {/* Get Started Button */}
        <BrandButton
          variant="outline"
          className="w-full min-w-0 mt-1 border-[#3c8787] text-[#3c8787] font-semibold hover:bg-[#3c8787] hover:text-white transition-colors"
          onClick={() => {
            window.location.href = '/sign-up?redirect=' + encodeURIComponent(window.location.pathname);
          }}
        >
          Get Started
        </BrandButton>

      </CardContent>
    </Card>
  );
};

export default PublicListingDetailsBox;
