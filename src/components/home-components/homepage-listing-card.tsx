'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ListingWithRelations } from '@/types';
import { getCategoryDisplayForCards, normalizeCategory } from '@/constants/enums';
import { applyServiceFee } from '@/lib/calculate-rent';
import { Heart, Star, ChevronLeft, ChevronRight, MoreVertical, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const PLACEHOLDER_IMAGE = '/stock_interior.webp';
const TITLE_MAX_LENGTH = 30;

function MatchedBadge({ badge }: { badge?: 'matched' | 'liked' }) {
  if (badge !== 'matched') return null;
  return (
    <span className="absolute top-2 left-2 px-3 py-1 rounded-[6px] text-xs font-medium bg-white text-primaryBrand">
      Matched
    </span>
  );
}

function MatchedActionButton({ matchId, onBookNow }: { matchId?: string; onBookNow?: (matchId: string) => void }) {
  const handleClick = matchId && onBookNow
    ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onBookNow(matchId); }
    : undefined;

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] py-2 rounded-[8px] text-xs font-semibold text-center bg-secondaryBrand text-white hover:bg-primaryBrand transition-colors cursor-pointer"
    >
      Book Now
    </button>
  );
}

function LikedActionButton({
  listingId,
  tripId,
  isApplied,
  isSignedIn,
  onSignInPrompt,
}: {
  listingId: string;
  tripId?: string;
  isApplied?: boolean;
  isSignedIn?: boolean;
  onSignInPrompt?: () => void;
}) {
  const router = useRouter();
  const canApply = !!tripId;
  const hasSignInPrompt = !canApply && onSignInPrompt;
  const buttonText = isApplied ? 'Applied' : 'Apply Now';

  const handleClick = canApply
    ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (!isApplied) router.push(`/search/listing/${listingId}?tripId=${tripId}&isApplying=true`); }
    : hasSignInPrompt
      ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onSignInPrompt!(); }
      : isSignedIn && !isApplied
        ? (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); router.push(`/search/listing/${listingId}`); }
        : undefined;

  const isDisabled = isApplied || !handleClick;

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

interface HomepageListingCardProps {
  listing: ListingWithRelations;
  badge?: 'matched' | 'liked';
  tripId?: string;
  matchId?: string;
  isApplied?: boolean;
  onApply?: (listing: ListingWithRelations, tripId: string) => Promise<void>;
  onBookNow?: (matchId: string) => void;
  onSignInPrompt?: () => void;
  initialFavorited?: boolean;
  onFavorite?: (listingId: string, isFavorited: boolean) => void;
  onUnlike?: (listingId: string) => void;
  onUnmatch?: (matchId: string) => void;
  isSignedIn?: boolean;
  disableSwipe?: boolean;
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
  onUnlike,
  onUnmatch,
  isSignedIn,
  disableSwipe = false,
}: HomepageListingCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false);
  const prevInitialFavorited = useRef(initialFavorited);
  if (prevInitialFavorited.current !== initialFavorited) {
    prevInitialFavorited.current = initialFavorited;
    setIsFavorited(initialFavorited ?? false);
  }

  // Derive effective badge from local favorite state (avoids parent re-render)
  const effectiveBadge = badge === 'matched' ? 'matched' : isFavorited ? 'liked' : undefined;
  const [failedImages, setFailedImages] = useState<Set<number>>(() => new Set());
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
    const normalizedCategory = normalizeCategory(listing.category);
    const type = getCategoryDisplayForCards(normalizedCategory);
    return `${beds} Bed, ${baths} bath ${type}`;
  };

  const getLocationString = () => {
    const state = listing.state || '';
    return state ? `in ${state}` : '';
  };

  const getDisplayPrice = (): { price: string; suffix: string; isRange: boolean } => {
    if (listing.monthlyPricing?.length) {
      const prices = listing.monthlyPricing.map(p => applyServiceFee(p.price, p.months));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice === maxPrice) {
        return { price: `$${minPrice.toLocaleString()}`, suffix: ' / mo', isRange: false };
      }
      return { price: `$${minPrice.toLocaleString()}-$${maxPrice.toLocaleString()}`, suffix: ' / mo', isRange: true };
    }
    if (listing.shortestLeasePrice) {
      const priceWithFee = applyServiceFee(listing.shortestLeasePrice, 1);
      return { price: `$${priceWithFee.toLocaleString()}`, suffix: ' / mo', isRange: false };
    }
    return { price: 'Price on request', suffix: '', isRange: false };
  };


  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent unfavoriting when matched or has pending application
    if (effectiveBadge === 'matched' || isApplied) return;
    // Enforce sign-in for liking
    if (!isSignedIn) {
      onSignInPrompt?.();
      return;
    }
    const newState = !isFavorited;
    
    // Use onUnlike callback if provided and we're unfavoriting
    if (!newState && onUnlike) {
      onUnlike(listing.id);
    } else {
      setIsFavorited(newState);
      onFavorite?.(listing.id, newState);
    }
  };

  const renderActionButton = () => {
    if (effectiveBadge === 'matched' && onBookNow) {
      return <MatchedActionButton matchId={matchId} onBookNow={onBookNow} />;
    }
    if (effectiveBadge === 'liked' && (tripId || isApplied)) {
      return (
        <LikedActionButton
          listingId={listing.id}
          tripId={tripId}
          isApplied={isApplied}
          isSignedIn={isSignedIn}
          onSignInPrompt={onSignInPrompt}
        />
      );
    }
    return null;
  };

  const listingUrl = `/search/listing/${listing.id}?from=${encodeURIComponent(pathname)}${tripId ? `&tripId=${tripId}` : ''}`;

  return (
    <Link
      href={listingUrl}
      className="@container block group w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col">
        <div className="relative w-full overflow-hidden rounded-xl">
          <Carousel
            opts={{ loop: false, watchDrag: !disableSwipe }}
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

          <MatchedBadge badge={effectiveBadge} />
          {renderActionButton()}
          {effectiveBadge === 'matched' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute top-2 right-2 p-1.5 rounded-[6px] bg-white/80 hover:bg-white transition-colors z-10"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    if (matchId && onUnmatch) onUnmatch(matchId);
                  }}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <X className="w-4 h-4 mr-2" />
                  Withdraw Application
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-2 right-2 p-1.5 rounded-[6px] bg-white/80 hover:bg-white transition-colors z-10"
            >
              <Heart
                className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </button>
          )}
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
              {(() => { const { price, suffix, isRange } = getDisplayPrice(); return <>{price}<span className={isRange ? "price-suffix" : ""}>{suffix}</span></>; })()}
            </p>
            {listing.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-[#373940] text-[#373940]" />
                <span className="listing-card-details">{listing.averageRating.toFixed(1)} ({listing.reviewCount || 0})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
