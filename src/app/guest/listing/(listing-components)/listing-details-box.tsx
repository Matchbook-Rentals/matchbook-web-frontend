'use client'
import React from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon, VerifiedBadge, TrailBlazerBadge, HallmarkHostBadge } from '@/components/icons';

interface ListingDetailsBoxProps {
  listing: ListingAndImages;
}

const ListingDetailsBox: React.FC<ListingDetailsBoxProps> = ({ listing }) => {
  const host = listing.user;

  const calculateTimeOnMatchbook = () => {
    if (!host?.createdAt) return 'New to Matchbook';
    const createdDate = new Date(host.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} days on Matchbook`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months on Matchbook`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} years on Matchbook`;
  };

  return (
    <div className="p-4 rounded-md font-poppin" style={{ fontFamily: 'Poppins' }}>
      {/* Pricing Information Section - Updated Display */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-col items-start ">
          <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-medium">
            {listing.shortestLeasePrice && listing.longestLeasePrice
              ? <>Price between: ${listing.shortestLeasePrice.toLocaleString()} - ${listing.longestLeasePrice.toLocaleString()} <span className="underline font-normal">month</span></>
              : listing.shortestLeasePrice
                ? <>${listing.shortestLeasePrice.toLocaleString()}<span className="underline font-normal">month</span></>
                : listing.longestLeasePrice
                  ? <>${listing.longestLeasePrice.toLocaleString()}<span className="underline font-normal">month</span></>
                  : ''}
          </p>
        <p className="md:text-[16px] text-gray-500 font-normal">
          Prices vary depending on stay length
        </p>
        </div>
        {listing.depositSize && (
          <div className="whitespace-nowrap">
            <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-medium">
              ${listing.depositSize.toLocaleString()} <span className="underline font-normal">deposit</span>
            </p>
          </div>
        )}
      </div>

      {/* Host Information Section - Updated Rating Display */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-medium">
            Hosted by {host?.firstName || 'Unknown'}
          </p>
          <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-normal">
            {listing?.numberOfStays || 23} stays
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-normal">
            {calculateTimeOnMatchbook()}
          </p>
          <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-normal flex gap-x-2 items-center">
            <StarIcon className="w-4 h-4" /> {listing.uScore ? listing.uScore.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Host Badges Section remains unchanged */}
      <div className="flex justify-between gap-2">
        <span className="flex items-center gap-2 whitespace-nowrap text-[16px] font-medium">
          <VerifiedBadge /> Verified
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap text-[16px] font-medium">
          <TrailBlazerBadge /> Trail Blazer
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap text-[16px] font-medium">
          <HallmarkHostBadge /> Hallmark Host
        </span>
      </div>
    </div>
  );
};

export default ListingDetailsBox;