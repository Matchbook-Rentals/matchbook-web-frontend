import React, { useState, useEffect, useRef } from 'react';
import { ListingAndImages } from '@/types';
import { BrandHeart, ReturnIcon, RejectIcon, VerifiedBadge, TrailBlazerBadge, HallmarkHostBadge, StarIcon } from '@/components/icons';


interface ListingDetailsBoxProps {
  listing: ListingAndImages;
  onReject: () => void;
  onReturn: () => void;
  onLike: () => void;
  setIsDetailsVisible: (isVisible: boolean) => void;
}

const SearchListingDetailsBox: React.FC<ListingDetailsBoxProps> = ({ listing, onReject, onReturn, onLike, setIsDetailsVisible }) => {
  const host = listing.user;
  const detailsBoxRef = useRef<HTMLDivElement>(null);
  // Style variables
  const bigButtonControl = "max-w-[120px] min-w-[80px] aspect-square flex items-center justify-center rounded-full hover:opacity-90 transition-opacity";
  const smallButtonControl = "max-w-[80px] min-w-[80px] aspect-square flex items-center justify-center rounded-full hover:opacity-90 transition-opacity";
  const bigIcon = "w-[40%] h-[40%]";
  const smallIcon = "w-[55%] h-[55%]";
  const currencyStyles = "md:text-[24px] lg:text-[30px] xl:text-[32px] 2xl:text-[36px] font-medium";
  const currencyStylesUnderline = "md:text-[16px] lg:text-[20px] xl:text-[21px] 2xl:text-[24px] font-normal underline";
  const badgeSpans = "flex items-center gap-2 whitespace-nowrap text-[16px] font-medium";
  const mediumText = "md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-medium";
  const normalText = "md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-normal";

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

  useEffect(() => {
    const handleScroll = () => {
      if (detailsBoxRef.current) {
        const detailsBoxRect = detailsBoxRef.current.getBoundingClientRect();
        const isVisible = detailsBoxRect.top >= 0;
        setIsDetailsVisible(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsDetailsVisible]);

  return (
    <div className='p-4 rounded-md font-poppin' style={{ fontFamily: 'Poppins' }} ref={detailsBoxRef}>
      {/* Action Buttons Section - Reject, Return, Like */}
      <div className="flex justify-center items-center gap-4 my-4">
        <button
          onClick={onReject}
          className={`${bigButtonControl} bg-gradient-to-br from-[#C68087BF] to-[#7D383FBF]`}
        >
          <RejectIcon className={`${bigIcon} text-white`} />
        </button>

        <button
          onClick={onReturn}
          className={`${smallButtonControl} bg-gradient-to-br from-[#6CC3FF] to-[#5B96BE]`}
        >
          <ReturnIcon className={`${smallIcon} text-white`} />
        </button>

        <button
          onClick={onLike}
          className={`${bigButtonControl} bg-gradient-to-br from-[#A3B899] to-[#5F6F58]`}
        >
          <BrandHeart className={bigIcon} />
        </button>
      </div>

      {/* Pricing Information Section */}
      <div className='flex justify-between items-center gap-x-4 mb-4'>
        <div className='whitespace-nowrap'>
          <p className={currencyStyles}>${listing.price?.toLocaleString()} <span className={currencyStylesUnderline}>month</span></p>
        </div>
        <div className='whitespace-nowrap'>
          <p className={currencyStyles}>${listing.depositSize?.toLocaleString()} <span className={currencyStylesUnderline}>deposit</span></p>
        </div>
      </div>

      {/* Host Information Section */}
      <div className='mb-4 space-y-2'>
        <div className='flex items-center justify-between'>
          <p className={mediumText}>Hosted by {host?.firstName}</p>
          <p className={normalText}>{listing?.numberOfStays || 23} stays</p>
        </div>
        <div className='flex items-center justify-between'>
          <p className={normalText}>{calculateTimeOnMatchbook()}</p>
          <p className={`${normalText} flex gap-x-2 items-center`}><StarIcon /> {listing?.averageRating || listing.uScore ? (listing?.averageRating || listing.uScore?.toFixed(1)) : 'N/A'}</p>
        </div>
      </div>

      {/* Host Badges Section */}
      <div className='flex justify-between gap-2'>
        <span className={badgeSpans}><VerifiedBadge />Verified</span>
        <span className={badgeSpans}><TrailBlazerBadge />Trail Blazer</span>
        <span className={badgeSpans}><HallmarkHostBadge />Hallmark Host</span>
      </div>
    </div>
  );
};

export default SearchListingDetailsBox;
