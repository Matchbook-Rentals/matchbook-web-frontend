import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';
import { BrandHeart, RejectIcon } from '@/components/svgs/svg-components';
import { BrandHeartOutline } from '@/components/icons/marketing';
import { ListingStatus } from '@/constants/enums';
import { ArrowLeft, ArrowRight } from '@/components/icons';

interface ListingCardProps {
  listing: {
    listingImages: { url: string }[];
    price: number;
    title: string;
    id: string; // assumed to exist for routing
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Using our hook to check if viewport is medium (768px) or larger
  const isMediumOrAbove = useMediaQuery('(min-width: 768px)');
  // Set default positioning based on viewport size:
  const defaultPositionClass = isMediumOrAbove
    ? "top-14 left-2" // top left just under fullscreen button for desktop
    : "top-2 left-1/2 transform -translate-x-1/2"; // top middle for smaller screens

  const { lookup } = state;
  const { favIds, dislikedIds } = lookup;
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;

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
    <div
      className={`absolute z-10 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden ${className || defaultPositionClass} transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[80vh]' : 'max-h-[320px]'} w-80`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        transitionProperty: 'max-height, transform, opacity',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
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
      </div>

      {/* Collapsed Content Container */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-xl leading-tight tracking-tight text-gray-900">
          {listing.title}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            {typeof distance === 'number' && (
              <p className="text-sm font-medium text-gray-500">
                {distance.toFixed(1)} miles away
              </p>
            )}
            <p className="text-lg font-bold text-gray-900">
              ${listing.price.toLocaleString()}
              <span className="text-sm font-normal text-gray-600">/month</span>
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-all duration-300 flex items-center gap-1"
          >
            <span>{isExpanded ? "See less" : "See more"}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Expanded Content with animation */}
      <div 
        className={`px-4 pb-4 overflow-y-auto max-h-[calc(80vh-220px)] transition-all duration-500 ease-in-out ${
          isExpanded 
            ? 'opacity-100 max-h-[800px]' 
            : 'opacity-0 max-h-0 overflow-hidden'
        }`}
      >
        <div className={`border-t border-gray-200 pt-4 space-y-4 transform transition-transform duration-500 ease-in-out ${
          isExpanded ? 'translate-y-0' : 'translate-y-8'
        }`}>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
            <p className="text-sm text-gray-700">
              Beautiful apartment in a prime location with modern amenities.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Amenities</h4>
            <ul className="text-sm text-gray-700 grid grid-cols-2 gap-2">
              <li>Air Conditioning</li>
              <li>Washer/Dryer</li>
              <li>Parking</li>
              <li>Pet Friendly</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <Link
              href={`/platform/trips/${state.trip.id}/listing/${listing.id}`}
              target={isMediumOrAbove ? "_blank" : undefined}
              rel={isMediumOrAbove ? "noopener noreferrer" : undefined}
              className="px-4 py-2 bg-[#4F4F4F] text-white rounded-md hover:bg-[#404040] text-center"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;