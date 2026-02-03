import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { BrandButton } from "@/components/ui/brandButton"
import { Heart, Heart as HeartIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { ListingAndImages } from "@/types"
import { useState, useCallback, useEffect } from 'react'
import { useGuestTripContext } from '@/contexts/guest-trip-context-provider'
import { RejectIcon } from '@/components/svgs/svg-components'
import { useListingHoverStore } from '@/store/listing-hover-store'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ListingStatus } from '@/constants/enums'
import { calculateRent } from '@/lib/calculate-rent'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

const TITLE_MAX_LENGTH = 40

// Text style variables
const headerTextStyle = "font-medium text-black text-sm"
const bodyTextStyle = "font-normal text-[#4f4f4f] text-sm"

interface SearchListingCardProps {
  listing: ListingAndImages
  status: ListingStatus
  className?: string
  style?: React.CSSProperties
  detailsClassName?: string
  detailsStyle?: React.CSSProperties
  callToAction?: {
    label: string
    action: () => void
    className?: string
  }
  contextLabel?: {
    label: string
    action: () => void
    className?: string
  }
  customSnapshot?: any // Allow passing custom snapshot with overridden functions
  trip?: any // Mock trip object from guest session
  tripId?: string
}

export default function SearchListingCard({ listing, status, className, style, detailsClassName, detailsStyle, callToAction, contextLabel, customSnapshot, trip, tripId }: SearchListingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const setHoveredListing = useListingHoverStore((state) => state.setHoveredListing)
  const router = useRouter()
  const { userId } = useAuth()
  const { state, actions } = useGuestTripContext()
  const hasTripDates = Boolean(trip?.startDate && trip?.endDate);

  // Carousel navigation handlers
  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    carouselApi?.scrollPrev()
  }, [carouselApi])

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    carouselApi?.scrollNext()
  }, [carouselApi])

  // Update current slide when carousel changes
  const onSelect = useCallback(() => {
    if (!carouselApi) return
    setCurrentSlide(carouselApi.selectedScrollSnap())
  }, [carouselApi])

  // Set up carousel event listeners
  useEffect(() => {
    if (!carouselApi) return
    carouselApi.on('select', onSelect)
    onSelect()
    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi, onSelect])

  const hasMultipleImages = listing.listingImages.length > 1
  const canScrollPrev = currentSlide > 0
  const canScrollNext = currentSlide < listing.listingImages.length - 1

  // Calculate trip-specific price using the same logic as authenticated users
  const calculatedPrice = hasTripDates ? calculateRent({ listing, trip }) : listing.price;

  // When no dates, derive price range from monthlyPricing table
  const priceRange = !hasTripDates && listing.monthlyPricing?.length
    ? {
        min: Math.min(...listing.monthlyPricing.map(p => p.price)),
        max: Math.max(...listing.monthlyPricing.map(p => p.price)),
      }
    : null;

  // Either use the custom snapshot passed in or fall back to the guest context
  const snapshot = customSnapshot || {
    isLiked: () => false,
    isDisliked: () => false,
    optimisticLike: (id: string) => actions.showAuthPrompt('like', id),
    optimisticDislike: (id: string) => actions.showAuthPrompt('like', id),
    optimisticRemoveLike: (id: string) => actions.showAuthPrompt('like', id),
    optimisticRemoveDislike: (id: string) => actions.showAuthPrompt('like', id)
  };

  const getStatusIcon = (status: ListingStatus) => {
    if (snapshot.isLiked(listing.id)) {
      return (
        <div
          className="bg-black/50 rounded-full p-2"
          onClick={(e: React.MouseEvent) => {
            snapshot.optimisticRemoveLike(listing.id);
            e.stopPropagation();
          }}
        >
          <Heart
            className="w-6 h-6 text-white cursor-pointer fill-red-500"
            strokeWidth={2}
          />
        </div>
      );
    } else if (snapshot.isDisliked(listing.id)) {
      return (
        <div
          className="bg-black/50 rounded-full "
          onClick={(e: React.MouseEvent) => {
            snapshot.optimisticRemoveDislike(listing.id);
            e.stopPropagation();
          }}
        >
          <RejectIcon
            className="w-9 h-9 text-white cursor-pointer p-2 "
          />
        </div>
      );
    }

    return (
      <div
        className="bg-black/50 rounded-full p-2"
        onClick={(e: React.MouseEvent) => {
          snapshot.optimisticLike(listing.id);
          e.stopPropagation();
        }}
      >
        <Heart
          className="w-6 h-6 text-white cursor-pointer"
          strokeWidth={2}
        />
      </div>
    );
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons or carousel controls
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('.carousel-controls')
    ) {
      return;
    }

    const url = tripId
      ? `/search/listing/${listing.id}?tripId=${tripId}`
      : `/search/listing/${listing.id}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={`flex flex-col w-full items-start relative border-none shadow-none rounded-xl overflow-hidden cursor-pointer ${className || ''}`}
      onMouseEnter={() => {
        setIsHovered(true)
        setHoveredListing(listing)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setHoveredListing(null)
      }}
      onClick={handleCardClick}
    >
      <div className="relative w-full">
        {/* Property Image Carousel */}
        <Carousel
          opts={{ loop: false }}
          setApi={setCarouselApi}
          className="w-full"
          keyboardControls={false}
        >
          <CarouselContent className="ml-0">
            {listing.listingImages.length > 0 ? (
              listing.listingImages.map((image, index) => (
                <CarouselItem key={image.id || index} className="pl-0">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl">
                    <img
                      className="w-full h-full object-cover"
                      alt={`Property image ${index + 1}`}
                      src={image.url}
                    />
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="pl-0">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl">
                  <img
                    className="w-full h-full object-cover"
                    alt="Property"
                    src="/placeholder-property.jpg"
                  />
                </div>
              </CarouselItem>
            )}
          </CarouselContent>

          {/* Navigation Arrows - only show on hover and if multiple images */}
          {hasMultipleImages && isHovered && (
            <>
              {canScrollPrev && (
                <button
                  className="carousel-controls absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all"
                  onClick={scrollPrev}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
              )}
              {canScrollNext && (
                <button
                  className="carousel-controls absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all"
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
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
            {(() => {
              const totalImages = listing.listingImages.length;
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

        {/* Heart Button */}
        <div className="absolute top-3 right-3">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-gray-200 transition-colors"
            onClick={(e: React.MouseEvent) => {
              if (snapshot.isLiked(listing.id)) {
                snapshot.optimisticRemoveLike(listing.id);
              } else {
                snapshot.optimisticLike(listing.id);
              }
              e.stopPropagation();
            }}
          >
            <HeartIcon
              className={`w-[18px] h-[18px] ${snapshot.isLiked(listing.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        </div>
      </div>

      <CardContent className="w-full pt-3 pb-0 px-0 flex flex-col gap-0">
        {/* Row 1: Property Title */}
        <div className="flex flex-col gap-0 pb-1">
          <h3 className={`${headerTextStyle} truncate whitespace-nowrap`}>
            {listing.title.length > TITLE_MAX_LENGTH
              ? `${listing.title.substring(0, TITLE_MAX_LENGTH)}...`
              : listing.title}
          </h3>
        </div>

        {/* Row 2: Bed/Bath, Type, Location */}
        <div className="flex flex-col gap-0 pb-2">
          <div className={`${bodyTextStyle} truncate`}>
            {listing.roomCount || 4} Bed, {listing.bathroomCount || 2} bath {listing.displayCategory || 'Property'}{listing.state ? ` in ${listing.state}` : ''}
          </div>
        </div>
      </CardContent>

      <CardFooter className="w-full py-0 px-0 border-none">
        <div className="w-full flex items-center justify-between">
          <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#484a54] text-sm">
            {priceRange && priceRange.min !== priceRange.max
              ? `$${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()} / Month`
              : `$${(priceRange?.min ?? calculatedPrice)?.toLocaleString() || 0} / Month`
            }
          </h2>
          {listing.averageRating && (
            <span className={bodyTextStyle}>
              {listing.averageRating.toFixed(1)} ({listing.numberOfStays || 0})
            </span>
          )}
        </div>
      </CardFooter>

      {callToAction && (
        <div className="pt-2 pb-4 w-full flex justify-center">
          <BrandButton
            variant="default"
            onClick={() => callToAction.action()}
            className="w-[95%] mx-auto"
          >
            {callToAction.label}
          </BrandButton>
        </div>
      )}
    </Card>
  )
}