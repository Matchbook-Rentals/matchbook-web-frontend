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
import { ScrollArea } from '@/components/ui/scroll-area';

interface DesktopListingCardProps {
  listing: {
    listingImages: { url: string }[];
    price: number;
    title: string;
    id: string;
  };
  distance?: number;
  onClose: () => void;
}

const DesktopListingCard: React.FC<DesktopListingCardProps> = ({ listing, distance, onClose }) => {
  const router = useRouter();
  const { state, actions } = useTripContext();
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
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
      className={`absolute z-20 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ${
        expanded 
          ? 'top-14 left-2 bottom-4 w-96' 
          : 'top-14 left-2 w-96'
      }`}
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
            <CarouselPrevious Icon={ArrowLeft} className="left-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pl-[4px] z-20" />
            <CarouselNext Icon={ArrowRight} className="right-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pr-[4px] z-20" />
          </div>
        </Carousel>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 z-10 transition-opacity duration-300 opacity-60">
          {getStatusIcon()}
        </div>
        
        {/* Close Button */}
        <div className="absolute top-2 left-2 z-10 transition-opacity duration-300 opacity-60">
          <div
            className="bg-black/50 rounded-full p-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-xl leading-tight tracking-tight text-gray-900">
          {listing.title}
        </h3>
        {typeof distance === 'number' && (
          <p className="text-sm font-medium text-gray-500">
            {distance.toFixed(1)} miles away
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <p className="text-lg font-bold text-gray-900">
            ${listing.price.toLocaleString()}
            <span className="text-sm font-normal text-gray-600">/month</span>
          </p>
          
          {expanded ? (
            <button
              onClick={() => setExpanded(false)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Show less
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              See more
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200">
          <ScrollArea className="h-[calc(100%-200px)] w-full px-4 py-3">
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Additional Information</h4>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="text-gray-600">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <p className="text-gray-600">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              <p className="text-gray-600">
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.
              </p>
              <p className="text-gray-600">
                Consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.
              </p>
            </div>
          </ScrollArea>
          <div className="border-t border-gray-200 p-4">
            <Link
              href={`/platform/trips/${state.trip.id}/listing/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center transition-colors"
            >
              View full details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopListingCard;