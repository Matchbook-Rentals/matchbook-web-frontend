import Image from 'next/image'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BrandButton } from "@/components/ui/brandButton"
import { MoreHorizontal, Star, ChevronLeft, ChevronRight, Heart, Share2 as Share2Icon, Heart as HeartIcon, Bed, Bath, Square } from "lucide-react"
import { ListingAndImages } from "@/types"
import { useState, useRef, useEffect } from 'react'
import { useTripContext } from '@/contexts/trip-context-provider'
import { RejectIcon } from '@/components/svgs/svg-components'
import { useListingHoverStore } from '@/store/listing-hover-store'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ArrowLeft, ArrowRight, QuestionMarkIcon } from '@/components/icons'
import { ListingStatus } from '@/constants/enums'
import { calculateRent } from '@/lib/calculate-rent'

const TITLE_MAX_LENGTH = 40

// Text style variables
const headerTextStyle = "font-medium text-black text-base"
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
}

export default function SearchListingCard({ listing, status, className, style, detailsClassName, detailsStyle, callToAction, contextLabel, customSnapshot }: SearchListingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const setHoveredListing = useListingHoverStore((state) => state.setHoveredListing)
  const router = useRouter()
  const { userId } = useAuth()
  const { state, actions } = useTripContext()
  let isFlexible = state.trip.flexibleStart || state.trip.flexibleEnd;
  
  // Calculate trip-specific price to match map markers
  const { trip } = state;
  const calculatedPrice = trip ? calculateRent({ listing, trip }) : listing.price;
  
  // Debug logging for price consistency
  console.log('🏷️ Listing Card Price Debug:', {
    listingId: listing.id,
    title: listing.title,
    originalPrice: listing.price,
    calculatedPrice,
    shortestLeasePrice: listing.shortestLeasePrice,
    longestLeasePrice: listing.longestLeasePrice,
    hasMonthlyPricing: listing.monthlyPricing?.length > 0,
    tripLength: trip ? `${Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 'No trip'
  });

  // Create ref for the image container and state for dimensions
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (imageContainerRef.current) {
        setDimensions({
          width: imageContainerRef.current.clientWidth,
          height: imageContainerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Either use the custom snapshot passed in or fall back to the context
  const snapshot = customSnapshot || { 
    isLiked: (id: string) => state.lookup.favIds.has(id),
    isDisliked: (id: string) => state.lookup.dislikedIds.has(id),
    optimisticLike: actions.optimisticLike,
    optimisticDislike: actions.optimisticDislike,
    optimisticRemoveLike: actions.optimisticRemoveLike,
    optimisticRemoveDislike: actions.optimisticRemoveDislike
  };

  const { lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;

  const getStatusStyles = (status: ListingStatus) => {
    if (snapshot.isLiked(listing.id)) {
      return 'bg-primaryBrand'
    } else if (snapshot.isDisliked(listing.id)) {
      return 'bg-pinkBrand'
    }

    switch (status) {
      case ListingStatus.Applied:
        return 'bg-primaryBrand'
      case ListingStatus.None:
      default:
        return 'bg-transparent hover:bg-white/60'
    }
  }

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

    window.open(`/app/rent/searches/${state.trip.id}/listing/${listing.id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={`flex flex-col w-full max-w-[361.5px] items-start relative border border-solid border-[#0000001a] rounded-xl overflow-hidden cursor-pointer ${className || ''}`}
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
        {/* Property Image */}
        <div className="w-full">
          <img
            className="w-full h-[175px] object-cover"
            alt="Property"
            src={listing.listingImages[0]?.url || '/placeholder-property.jpg'}
          />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <BrandButton
            variant="default"
            size="icon"
            className="w-[30px] h-[30px] bg-white hover:bg-white/90 text-gray-600 hover:text-gray-700 min-w-[30px] rounded-lg"
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
          </BrandButton>
          {/* <BrandButton
            variant="default"
            size="icon"
            className="w-[31px] h-[31px] bg-white hover:bg-white/90 text-gray-600 hover:text-gray-700 min-w-[31px]"
          >
            <Share2Icon className="w-[18px] h-[18px]" />
          </BrandButton> */}
        </div>
      </div>

      <CardContent className="w-full p-4 pt-3 flex flex-col gap-0">
        {/* Row 1: Property Title */}
        <div className="flex flex-col gap-0 pb-1">
          <h3 className={`${headerTextStyle} truncate whitespace-nowrap`}>
            {listing.title.length > TITLE_MAX_LENGTH
              ? `${listing.title.substring(0, TITLE_MAX_LENGTH)}...`
              : listing.title}
          </h3>
        </div>

        {/* Row 2: Location and Rating */}
        <div className="flex flex-col gap-0 pb-6">
          <div className="flex items-center justify-between w-full">
            <div className={bodyTextStyle}>
              {(() => {
                switch (listing.category) {
                  case 'privateRoom':
                    return 'Private Room';
                  case 'singleFamily':
                    return 'Single Family';
                  case 'townhouse':
                    return 'Townhouse';
                  case 'apartment':
                    return 'Apartment';
                  default:
                    return 'Property';
                }
              })()} in {listing.state}
            </div>

            <div className="flex items-center gap-0.5">
              <div className="flex items-center">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                <span className={bodyTextStyle}>
                  {(listing as any).rating ?? 4.9}
                </span>
              </div>
              <span className={bodyTextStyle}>
                ({(listing as any).reviews ?? 127})
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Property Features */}
        <div className="flex flex-col gap-3 pb-3">
          <div className="flex items-center justify-between w-full">
            <Badge
              variant="outline"
              className="bg-transparent border-none p-0 flex items-center gap-1.5"
            >
              <div className="relative w-5 h-5">
                <Bed className="w-[18px] h-4 text-[#5d606d]" />
              </div>
              <span className={bodyTextStyle}>
                {listing.roomCount || 4} bds
              </span>
            </Badge>
            <div className="h-4 border-l-2 border-gray-200"></div>
            <Badge
              variant="outline"
              className="bg-transparent border-none p-0 flex items-center gap-1.5"
            >
              <div className="relative w-5 h-5">
                <Bath className="w-[18px] h-4 text-[#5d606d]" />
              </div>
              <span className={bodyTextStyle}>
                {listing.bathroomCount || 2} ba
              </span>
            </Badge>
            <div className="h-4 border-l-2 border-gray-200"></div>
            <Badge
              variant="outline"
              className="bg-transparent border-none p-0 flex items-center gap-1.5"
            >
              <div className="relative w-5 h-5">
                <Square className="w-5 h-5 text-[#5d606d]" />
              </div>
              <span className={bodyTextStyle}>
                {listing.squareFootage?.toLocaleString() || 0} sqft
              </span>
            </Badge>
          </div>
        </div>

        {/* Row 4: Availability */}
        <div className="flex flex-col gap-3">
          <div className={bodyTextStyle}>
            Available {state.trip.startDate?.toLocaleDateString('en-gb', {
              day: '2-digit',
              month: 'short'
            }) || 'now'} - {state.trip.endDate?.toLocaleDateString('en-gb', {
              day: '2-digit',
              month: 'short'
            }) || 'ongoing'}
          </div>
        </div>
      </CardContent>

      <CardFooter className="w-full p-4 border-t border-[#002c581a]">
        <div className="w-full">
          <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#484a54] text-xl">
            ${calculatedPrice?.toLocaleString() || 0} / month
          </h2>
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

      {/* Display the image container's dimensions at the bottom of the card */}
      {/* <div className="text-center text-xs text-gray-500 pb-2">
        Dimensions: {dimensions.width}px x {dimensions.height}px
      </div> */}
    </Card>
  )
}
