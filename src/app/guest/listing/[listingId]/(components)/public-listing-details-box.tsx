'use client'
import React from 'react';
import { ListingAndImages } from '@/types';
import { VerifiedBadge, TrailBlazerBadge, HallmarkHostBadge, StarIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface PublicListingDetailsBoxProps {
  listing: ListingAndImages;
}

const PublicListingDetailsBox: React.FC<PublicListingDetailsBoxProps> = ({ listing }) => {
  const host = listing.user;

  // Style variables (matching search-listing-details-box.tsx exactly)
  const currencyStyles = "md:text-[24px] lg:text-[30px] xl:text-[32px] 2xl:text-[36px] font-medium";
  const currencyStylesUnderline = "md:text-[16px] lg:text-[20px] xl:text-[21px] 2xl:text-[24px] font-normal underline";
  const badgeSpans = "flex items-center gap-2 whitespace-nowrap text-[16px] font-medium";
  const mediumText = "md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-medium";
  const normalText = "md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-normal";

  // Calculate price range from monthlyPricing table
  const getPriceRange = () => {
    if (!listing.monthlyPricing || listing.monthlyPricing.length === 0) {
      // Fallback to listing.price if no pricing table
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

  const calculateTimeOnMatchbook = () => {
    if (!host?.createdAt) return 'New to Matchbook';

    const createdDate = new Date(host?.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days on Matchbook`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months on Matchbook`;

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} years on Matchbook`;
  };

  const priceRange = getPriceRange();

  return (
    <div className='p-4 rounded-md font-poppin' style={{ fontFamily: 'Poppins' }}>
      {/* Pricing Information Section */}
      <div className='flex justify-between items-center gap-x-4 mb-4'>
        <div className='whitespace-nowrap'>
          {priceRange.hasRange ? (
            <p className={currencyStyles}>
              ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()} 
              <span className={currencyStylesUnderline}>month</span>
            </p>
          ) : (
            <p className={currencyStyles}>
              ${priceRange.min.toLocaleString()} 
              <span className={currencyStylesUnderline}>month</span>
            </p>
          )}
        </div>
        {/* Only show deposit if there's no price range (single price) */}
        {!priceRange.hasRange && listing.depositSize && (
          <div className='whitespace-nowrap'>
            <p className={currencyStyles}>${listing.depositSize.toLocaleString()} <span className={currencyStylesUnderline}>deposit</span></p>
          </div>
        )}
      </div>

      {/* Host Information Section */}
      <div className='mb-4 space-y-2'>
        <div className='flex items-center justify-between'>
          <p className={mediumText}>Hosted by {host?.firstName || 'Host'}</p>
          <p className={`${normalText} flex gap-x-2 items-center`}>
            <StarIcon /> {listing?.averageRating ? listing.averageRating.toFixed(1) : <span className="italic">No reviews yet</span>}
            {listing?.averageRating && <span className='text-sm pt-2 pl-0 -translate-x-1'>({listing?.numberOfStays || 0})</span>}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{calculateTimeOnMatchbook()}</p>
        </div>
      </div>

      {/* Host Badges Section */}
      <div className='flex justify-between gap-2 mb-4'>
        <span className={badgeSpans}><VerifiedBadge />Verified</span>
        <span className={badgeSpans}><TrailBlazerBadge />Trail Blazer</span>
        <span className={badgeSpans}><HallmarkHostBadge />Hallmark Host</span>
      </div>

      {/* Public view call to action */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-700 mb-2">
          Interested in this property?
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Sign up with MatchBook to contact the host and start your application.
        </p>
        <Button 
          onClick={() => {
            window.location.href = '/sign-up?redirect=' + encodeURIComponent(window.location.pathname);
          }}
          className="w-full bg-[#0B6E6E] hover:bg-[#0B6E6E]/90 text-white"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default PublicListingDetailsBox;