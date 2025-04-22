'use client'
import React from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon, VerifiedBadge, TrailBlazerBadge, HallmarkHostBadge } from '@/components/icons';

interface ListingDetailsBoxProps {
  listing: ListingAndImages;
  calculatedPrice: number;
}

const ListingDetailsBox: React.FC<ListingDetailsBoxProps> = ({ listing, calculatedPrice }) => {
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
      <div className="flex justify-between items-center gap-x-4 mb-4">
        <div className="whitespace-nowrap">
          <p className="md:text-[24px] lg:text-[30px] xl:text-[32px] 2xl:text-[36px] font-medium">
            {"$" + calculatedPrice.toLocaleString()} <span className="md:text-[16px] lg:text-[20px] xl:text-[21px] 2xl:text-[24px] font-normal underline">month</span>
          </p>
        </div>
        <div className="whitespace-nowrap">
          {listing.depositSize && (
            <p className="md:text-[24px] lg:text-[30px] xl:text-[32px] 2xl:text-[36px] font-medium">
              {"$" + listing.depositSize.toLocaleString()} <span className="md:text-[16px] lg:text-[20px] xl:text-[21px] 2xl:text-[24px] font-normal underline">deposit</span>
            </p>
          )}
        </div>
      </div>

      {/* Host Information Section - Updated Rating Display */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-medium">
            Hosted by {host?.firstName || 'Unknown'}
          </p>
          <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-normal flex gap-x-2 items-center">
            <StarIcon className="w-4 h-4" /> {listing.uScore ? listing.uScore.toFixed(1) : 'N/A'} <span className=''> (23) </span>
          </p>
        </div>
        <div className="flex items-center justify-between">
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
