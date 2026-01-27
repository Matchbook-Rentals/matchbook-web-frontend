'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ListingAndImages } from '@/types';
import { Heart, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

const PLACEHOLDER_IMAGE = '/stock_interior.webp';
const TITLE_MAX_LENGTH = 30;

interface HomepageListingCardProps {
  listing: ListingAndImages;
  badge?: 'matched' | 'liked';
  tripId?: string;
  matchId?: string;
  isApplied?: boolean;
  onApply?: (listing: ListingAndImages, tripId: string) => Promise<void>;
  onBookNow?: (matchId: string) => void;
  initialFavorited?: boolean;
  onFavorite?: (listingId: string, isFavorited: boolean) => void;
}

export default function HomepageListingCard({
  listing,
  badge,
  tripId,
  matchId,
  isApplied,
  onApply,
  onBookNow,
  initialFavorited,
  onFavorite,
}: HomepageListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false);
  useEffect(() => { setIsFavorited(initialFavorited ?? false); }, [initialFavorited]);
  const [imageError, setImageError] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const getImageUrl = () => {
    if (imageError) return PLACEHOLDER_IMAGE;
    return listing.listingImages?.[0]?.url || PLACEHOLDER_IMAGE;
  };

  const getTruncatedTitle = () => {
    const title = listing.title || 'Untitled Listing';
    return title.length > TITLE_MAX_LENGTH
      ? `${title.substring(0, TITLE_MAX_LENGTH)}...`
      : title;
  };

  const getDetailsString = () => {
    const beds = listing.roomCount || 0;
    const baths = listing.bathroomCount || 0;
    const type = listing.category || 'Home';
    return `${beds} Bed, ${baths} bath ${type}`;
  };

  const getLocationString = () => {
    const state = listing.state || '';
    return state ? `in ${state}` : '';
  };

  const getDisplayPrice = () => {
    if (listing.monthlyPricing?.length) {
      const prices = listing.monthlyPricing.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice === maxPrice) {
        return `$${minPrice.toLocaleString()} / mo`;
      }
      return `$${minPrice.toLocaleString()}-$${maxPrice.toLocaleString()} / mo`;
    }
    return listing.shortestLeasePrice
      ? `$${listing.shortestLeasePrice.toLocaleString()} / mo`
      : 'Price on request';
  };

  const getMockRating = () => {
    const hash = listing.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (4.0 + (hash % 10) / 10).toFixed(1);
  };

  const getMockReviewCount = () => {
    const hash = listing.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 10 + (hash % 30);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isFavorited;
    setIsFavorited(newState);
    onFavorite?.(listing.id, newState);
  };

  const renderMatchedBadge = () => {
    if (badge !== 'matched') return null;
    return (
      <span className="absolute top-2 left-2 px-3 py-1 rounded-[6px] text-xs font-medium bg-white text-primaryBrand">
        Matched
      </span>
    );
  };

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tripId || !onApply || isApplying || isApplied) return;
    setIsApplying(true);
    try {
      await onApply(listing, tripId);
    } finally {
      setIsApplying(false);
    }
  };

  const handleBookNowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (matchId && onBookNow) {
      onBookNow(matchId);
    }
  };

  const renderActionButton = () => {
    if (badge === 'matched') {
      const hasHandler = matchId && onBookNow;
      return (
        <button
          onClick={hasHandler ? handleBookNowClick : undefined}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] py-2 rounded-[8px] text-xs font-semibold text-center bg-secondaryBrand text-white hover:bg-primaryBrand transition-colors cursor-pointer"
        >
          Book Now
        </button>
      );
    }
    if (badge === 'liked') {
      const hasHandler = tripId && onApply;
      const isDisabled = isApplied || isApplying || !hasHandler;
      const buttonText = isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply Now';
      return (
        <button
          onClick={hasHandler ? handleApplyClick : undefined}
          disabled={isDisabled}
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] py-2 rounded-[8px] text-xs font-semibold text-center transition-colors ${
            isApplied
              ? 'bg-gray-400 text-white cursor-default'
              : 'bg-secondaryBrand text-white hover:bg-primaryBrand cursor-pointer'
          }`}
        >
          {buttonText}
        </button>
      );
    }
    return null;
  };

  const listingUrl = `/search/listing/${listing.id}`;

  return (
    <Link href={listingUrl} className="block group flex-shrink-0 w-[169px]">
      <div className="flex flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <Image
            src={getImageUrl()}
            alt={listing.title || 'Property'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="169px"
            onError={() => setImageError(true)}
          />
          {renderMatchedBadge()}
          {renderActionButton()}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-1.5 rounded-[6px] bg-white/80 hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        </div>

        <div className="pt-3 flex flex-col gap-0.5">
          <h3 className="font-medium text-[#404040] text-sm truncate">
            {getTruncatedTitle()}
          </h3>
          <p className="font-poppins text-[10px] font-normal text-[#373940]">
            {getDetailsString()} {getLocationString()}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="font-poppins text-[10px] font-normal text-[#373940] whitespace-nowrap">
              {getDisplayPrice()}
            </p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#373940] text-[#373940]" />
              <span className="font-poppins text-[10px] font-normal text-[#373940]">{getMockRating()} ({getMockReviewCount()})</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
