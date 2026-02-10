'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListingAndImages } from '@/types';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

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
  onSignInPrompt?: () => void;
  initialFavorited?: boolean;
  onFavorite?: (listingId: string, isFavorited: boolean) => void;
  isSignedIn?: boolean;
}

export default function HomepageListingCard({
  listing,
  badge,
  tripId,
  matchId,
  isApplied,
  onApply,
  onBookNow,
  onSignInPrompt,
  initialFavorited,
  onFavorite,
  isSignedIn,
}: HomepageListingCardProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false);
  useEffect(() => { setIsFavorited(initialFavorited ?? false); }, [initialFavorited]);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [isHovered, setIsHovered] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Carousel navigation handlers
  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    carouselApi?.scrollPrev();
  }, [carouselApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    carouselApi?.scrollNext();
  }, [carouselApi]);

  // Update current slide when carousel changes
  const onCarouselSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  // Set up carousel event listeners
  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on('select', onCarouselSelect);
    onCarouselSelect();
    return () => {
      carouselApi.off('select', onCarouselSelect);
    };
  }, [carouselApi, onCarouselSelect]);

  const hasMultipleImages = (listing.listingImages?.length ?? 0) > 1;
  const canScrollPrev = currentSlide > 0;
  const canScrollNext = currentSlide < (listing.listingImages?.length ?? 1) - 1;

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
    // Prevent unfavoriting when matched or has pending application
    if (badge === 'matched' || isApplied) return;
    // Enforce sign-in for liking
    if (!isSignedIn) {
      onSignInPrompt?.();
      return;
    }
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

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tripId || isApplied) return;
    router.push(`/search/listing/${listing.id}?tripId=${tripId}&isApplying=true`);
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
      const canApply = !!tripId;
      const hasSignInPrompt = !canApply && onSignInPrompt;
      const isDisabled = isApplied || (!canApply && !hasSignInPrompt);
      const buttonText = isApplied ? 'Applied' : 'Apply Now';

      const handleClick = canApply
        ? handleApplyClick
        : hasSignInPrompt
          ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onSignInPrompt(); }
          : undefined;

      return (
        <button
          onClick={handleClick}
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
    <Link
      href={listingUrl}
      className="@container block group flex-shrink-0 w-[calc(50%-12px)] sm:w-[calc(33.333%-16px)] md:w-[calc(25%-18px)] lg:w-[calc(20%-19.2px)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col">
        <div className="relative w-full overflow-hidden rounded-xl">
          <Carousel
            opts={{ loop: false }}
            setApi={setCarouselApi}
            className="w-full"
            keyboardControls={false}
          >
            <CarouselContent className="ml-0">
              {(listing.listingImages?.length ?? 0) > 0 ? (
                listing.listingImages!.map((image, index) => (
                  <CarouselItem key={image.id || index} className="pl-0">
                    <div className="relative aspect-[4/3] w-full">
                      {failedImages.has(index) ? (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="font-poppins text-gray-500 text-sm">Image unavailable</span>
                        </div>
                      ) : (
                        <Image
                          src={image.url || PLACEHOLDER_IMAGE}
                          alt={`${listing.title || 'Property'} image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="280px"
                          onError={() => setFailedImages(prev => new Set(prev).add(index))}
                        />
                      )}
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem className="pl-0">
                  <div className="relative aspect-[4/3] w-full bg-gray-200 flex items-center justify-center">
                    <span className="font-poppins text-gray-500 text-sm">Image unavailable</span>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>

            {/* Navigation Arrows - only show on hover and if multiple images */}
            {hasMultipleImages && isHovered && (
              <>
                {canScrollPrev && (
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all z-10"
                    onClick={scrollPrev}
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                )}
                {canScrollNext && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all z-10"
                    onClick={scrollNext}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                )}
              </>
            )}
          </Carousel>

          {/* Dot Indicators - shows in batches of 5 */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 items-center z-10">
              {(() => {
                const totalImages = listing.listingImages!.length;
                const batchSize = 5;
                const currentBatch = Math.floor(currentSlide / batchSize);
                const batchStart = currentBatch * batchSize;
                const batchEnd = Math.min(batchStart + batchSize, totalImages);
                const positionInBatch = currentSlide - batchStart;

                return Array.from({ length: batchEnd - batchStart }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === positionInBatch ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ));
              })()}
            </div>
          )}

          {renderMatchedBadge()}
          {renderActionButton()}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-1.5 rounded-[6px] bg-white/80 hover:bg-white transition-colors z-10"
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
          <p className="listing-card-details">
            {getDetailsString()}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="listing-card-details whitespace-nowrap">
              {getDisplayPrice()}
            </p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#373940] text-[#373940]" />
              <span className="listing-card-details">{getMockRating()} ({getMockReviewCount()})</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
