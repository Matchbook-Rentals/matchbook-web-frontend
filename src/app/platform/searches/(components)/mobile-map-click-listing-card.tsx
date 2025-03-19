import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';
import { BrandHeart, RejectIcon } from '@/components/svgs/svg-components';
import { BrandHeartOutline } from '@/components/icons/marketing';
import { ListingStatus } from '@/constants/enums';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TallDialogContent } from '@/constants/styles';
import { ListingAndImages } from '@/types';
import SearchListingDetailsView from '../../trips/(trips-components)/search-listing-details-view';

interface ListingCardProps {
  listing: {
    listingImages: { url: string }[];
    price: number;
    title: string;
    id: string; // assumed to exist for routing
    roomCount?: number;
    bathroomCount?: number;
    squareFootage?: number;
    depositSize?: number;
  };
  distance?: number;
  onClose: () => void;
  // Allow parent to override the container positioning/styling
  className?: string;
  status?: ListingStatus;
}

// Custom hook to detect media query matches
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);
      const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
      // set the initial state
      setMatches(mediaQueryList.matches);
      mediaQueryList.addEventListener('change', listener);
      return () => mediaQueryList.removeEventListener('change', listener);
    }
  }, [query]);

  return matches;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, distance, onClose, className, status = ListingStatus.None }) => {
  const router = useRouter();
  const { state, actions } = useTripContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Using our hook to check if viewport is medium (768px) or larger
  const isMediumOrAbove = useMediaQuery('(min-width: 768px)');
  // Set default positioning based on viewport size:
  const defaultPositionClass = isMediumOrAbove
    ? "bottom-2 left-2" // bottom left for medium and above
    : "top-2 left-1/2 transform -translate-x-1/2"; // top middle for smaller screens

  const { lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMediumOrAbove) {
      // For desktop, open in new tab
      window.open(`/platform/trips/${state.trip.id}/listing/${listing.id}`, '_blank');
    } else {
      // For mobile, open dialog
      setIsDialogOpen(true);
    }
  };

  const getStatusIcon = () => {
    if (favIds?.has(listing.id)) {
      return (
        <div
          className="bg-black/50 rounded-full p-1"
          onClick={(e: React.MouseEvent) => {
            optimisticRemoveLike(listing.id);
            e.stopPropagation();
          }}
        >
          <BrandHeartOutline
            className="w-9 h-9 stroke-white text-white cursor-pointer pt-2 hover:fill-black"
            stroke="white"
            strokeWidth={1}
            fill="white"
          />
        </div>
      );
    } else if (dislikedIds?.has(listing.id)) {
      return (
        <div
          className="bg-black/50 rounded-full"
          onClick={(e: React.MouseEvent) => {
            optimisticRemoveDislike(listing.id);
            e.stopPropagation();
          }}
        >
          <RejectIcon
            className="w-9 h-9 text-white cursor-pointer p-2"
          />
        </div>
      );
    }

    return (
      <div
        className="flex items-center"
        onClick={(e: React.MouseEvent) => {
          optimisticLike(listing.id);
          e.stopPropagation();
        }}
      >
        <BrandHeartOutline
          className="w-9 h-9 stroke-white text-white cursor-pointer pt-2 hover:fill-black"
          stroke="white"
          strokeWidth={1.5}
          fill="black"
        />
      </div>
    );
  };

  return (
    <>
      <div
        className={`absolute z-10 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden ${className || defaultPositionClass}`}
        style={{ width: isMediumOrAbove ? '24rem' : '92%', maxWidth: isMediumOrAbove ? '24rem' : '92%' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Carousel Image Container */}
        <div className="relative h-40 w-full">
          <Carousel keyboardControls={false} opts={{ loop: true }}>
            <CarouselContent>
              {listing.listingImages.map((image, index) => (
                <CarouselItem key={index} className="relative h-40 w-full">
                  <Image src={image.url} alt={listing.title} fill className="object-cover" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              {isMediumOrAbove ? (
                <>
                  <CarouselPrevious Icon={ArrowLeft} className="left-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pl-[4px] z-20" />
                  <CarouselNext Icon={ArrowRight} className="right-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pr-[4px] z-20" />
                </>
              ) : (
                <>
                  <CarouselPrevious className="z-20" />
                  <CarouselNext className="z-20" />
                </>
              )}
            </div>
          </Carousel>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 z-10 transition-opacity duration-300 opacity-60">
            {getStatusIcon()}
          </div>
          
          {/* Close Button - mimicking desktop version */}
          <div className="absolute top-2 left-2 z-10 transition-opacity duration-300 opacity-60">
            <div
              className="bg-black/50 rounded-full p-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Container - styled like desktop map click card */}
        <div className="px-4 pt-4 pb-2 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-normal text-[20px] text-[#404040] leading-tight truncate max-w-[calc(100%-80px)]">
              {listing.title}
            </h3>
            <button
              onClick={handleViewDetails}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-2 shrink-0"
            >
              See more
            </button>
          </div>
          
          <div className="py-3 flex flex-col space-y-4 text-[#404040]">
            <div className="w-full flex justify-between">
              <p className="text-[16px]">
                {listing.roomCount || 0} beds | {listing.bathroomCount || 0} baths
              </p>
              <p className="text-[16px] font-medium">${listing.price.toLocaleString()}/month</p>
            </div>
            <div className="w-full flex justify-between">
              <p className="text-[16px]">{listing.squareFootage?.toLocaleString() || 0} sqft</p>
              <p className="text-[16px]">${listing.depositSize?.toLocaleString() || 0} deposit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full screen dialog for mobile view */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${TallDialogContent} max-w-full w-full h-full sm:h-full p-0 m-0`} xOnRight hideCloseButton={false}>
          <div className="h-full overflow-y-auto">
            <SearchListingDetailsView listingId={listing.id} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ListingCard;
