import React from 'react';
import { ListingAndImages } from '@/types';
import { BrandHeart, ReturnIcon, RejectIcon, VerifiedBadge, TrailBlazerBadge, HallmarkHostBadge, StarIcon } from '@/components/icons';


interface ListingDetailsBoxProps {
  listing: ListingAndImages;
}

const ListingDetailsBox: React.FC<ListingDetailsBoxProps> = ({ listing }) => {
  const host = listing.user;

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

  return (
    <div className='p-4 rounded-md font-poppin' style={{ fontFamily: 'Poppins' }}>
      {/* Action Buttons Section - Reject, Return, Like */}
      <div className="flex justify-center items-center gap-4 my-4">
        <button
          className="w-[120px] h-[120px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#C68087BF] to-[#7D383FBF] hover:opacity-90 transition-opacity"
        >
          <RejectIcon className='h-[48px] w-[48px] text-white' />

        </button>

        <button
          className="w-[80px] h-[80px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#6CC3FF] to-[#5B96BE] hover:opacity-90 transition-opacity"
        >
          <ReturnIcon className='h-[44px] w-[44px] text-white' />
        </button>

        <button
          className="w-[120px] h-[120px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#A3B899] to-[#5F6F58] hover:opacity-90 transition-opacity"
        >
          <BrandHeart className='h-[44px] w-[44px]' />

        </button>
      </div>

      {/* Pricing Information Section */}
      <div className='flex justify-between items-center mb-4'>
        <div className='text-center'>
          <p className='text-[36px] font-medium'>${listing.price?.toLocaleString()} <span className='text-[24px] font-normal underline'>month</span></p>
        </div>
        <div className='text-center'>
          <p className='text-[36px] font-medium'>${listing.depositSize?.toLocaleString()} <span className='text-[24px] font-normal underline'>deposit</span></p>
        </div>
      </div>

      {/* Host Information Section */}
      <div className='mb-4 space-y-2'>
        <div className='flex items-center justify-between'>
          <p className='text-[24px] font-medium'>Hosted by {host?.firstName}</p>
          <p className='text-[24px] '>{listing?.stays || 23} stays</p>
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-[24px] font-normal'>{calculateTimeOnMatchbook()}</p>
          <p className='text-[24px] flex gap-x-2 items-center '><StarIcon /> {listing?.rating || listing.uScore?.toFixed(1)}</p>
        </div>
      </div>


      {/* Host Badges Section */}
      <div className='flex justify-between gap-2'>
        <span className='flex items-center gap-2'><VerifiedBadge />Verified</span>
        <span className='flex items-center gap-2'><TrailBlazerBadge />Trail Blazer</span>
        <span className='flex items-center gap-2'><HallmarkHostBadge />Hallmark Host</span>
      </div>
    </div>
  );
};

export default ListingDetailsBox;
