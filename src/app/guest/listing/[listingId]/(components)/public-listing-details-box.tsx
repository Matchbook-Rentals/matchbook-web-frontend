'use client'
import React, { useState, useTransition } from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/ui/brandButton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { applyToListingFromSearch } from '@/app/actions/housing-requests';
import { getOrCreateListingConversation } from '@/app/actions/housing-requests';

interface PublicListingDetailsBoxProps {
  listing: ListingAndImages;
  isAuthenticated?: boolean;
  tripContext?: { tripId?: string; startDate: Date; endDate: Date } | null;
  calculatedPrice?: number | null;
  listingState?: { hasApplied: boolean; isMatched: boolean } | null;
}

const PublicListingDetailsBox: React.FC<PublicListingDetailsBoxProps> = ({
  listing,
  isAuthenticated = false,
  tripContext = null,
  calculatedPrice = null,
  listingState = null,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasApplied, setHasApplied] = useState(listingState?.hasApplied ?? false);
  const [isMatched, setIsMatched] = useState(listingState?.isMatched ?? false);
  const [error, setError] = useState<string | null>(null);

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

  const handleGetStarted = () => {
    const redirectPath = window.location.pathname + window.location.search;
    window.location.href = '/sign-up?redirect=' + encodeURIComponent(redirectPath);
  };

  const handleApplyNow = () => {
    setError(null);
    startTransition(async () => {
      const result = await applyToListingFromSearch(listing.id, {
        tripId: tripContext?.tripId,
        startDate: tripContext?.startDate,
        endDate: tripContext?.endDate,
      });

      if (result.success) {
        setHasApplied(true);
        // Optionally navigate to the trip page
        // router.push(`/app/rent/searches/${result.tripId}`);
      } else {
        setError(result.error || 'Failed to apply');
      }
    });
  };

  const handleMessageHost = () => {
    if (!host?.id) return;

    startTransition(async () => {
      const result = await getOrCreateListingConversation(listing.id, host.id);
      if (result.success && result.conversationId) {
        router.push(`/app/messages?conversationId=${result.conversationId}`);
      }
    });
  };

  const getApplyButtonText = () => {
    if (isMatched) return 'Matched';
    if (hasApplied) return 'Applied';
    return 'Apply Now';
  };

  const isApplyButtonDisabled = hasApplied || isMatched || isPending;

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
              {calculatedPrice
                ? `$${calculatedPrice.toLocaleString()}`
                : priceRange.hasRange
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

        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm font-['Poppins']">
            {error}
          </div>
        )}

        {/* CTA Buttons */}
        {!isAuthenticated ? (
          // Not signed in: Show "Get Started" button
          <BrandButton
            variant="outline"
            className="w-full min-w-0 mt-1 border-[#3c8787] text-[#3c8787] font-semibold hover:bg-[#3c8787] hover:text-white transition-colors"
            onClick={handleGetStarted}
          >
            Get Started
          </BrandButton>
        ) : (
          // Signed in: Show "Apply Now" + "Message Host" buttons
          <div className="flex flex-col gap-2 w-full mt-1">
            <BrandButton
              variant={hasApplied || isMatched ? "secondary" : "outline"}
              className={`w-full min-w-0 font-semibold transition-colors ${
                hasApplied || isMatched
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : 'border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white'
              }`}
              onClick={handleApplyNow}
              disabled={isApplyButtonDisabled}
            >
              {isPending ? 'Applying...' : getApplyButtonText()}
            </BrandButton>
            <BrandButton
              variant="ghost"
              className="w-full min-w-0 text-[#3c8787] font-medium hover:bg-[#3c8787]/10"
              onClick={handleMessageHost}
              disabled={isPending}
            >
              Message Host
            </BrandButton>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default PublicListingDetailsBox;
