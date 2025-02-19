import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/trip-context-provider';

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

const ListingCard: React.FC<ListingCardProps> = ({ listing, distance, onClose, className }) => {
  const router = useRouter();
  const { state } = useTripContext();

  // Using our hook to check if viewport is medium (768px) or larger
  const isMediumOrAbove = useMediaQuery('(min-width: 768px)');
  // Set default positioning based on viewport size:
  const defaultPositionClass = isMediumOrAbove
    ? "bottom-2 left-2" // bottom left for medium and above
    : "top-2 left-1/2 transform -translate-x-1/2"; // top middle for smaller screens

  return (
    <div className={`absolute z-10 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden ${className || defaultPositionClass}`}>
      {/* Carousel Image Container */}
      <div className="relative h-40 w-full">
        <Carousel keyboardControls={false}>
          <CarouselContent>
            {listing.listingImages.map((image, index) => (
              <CarouselItem key={index} className="relative h-40 w-full">
                <Image src={image.url} alt={listing.title} fill className="object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="z-20" />
            <CarouselNext className="z-20" />
          </div>
        </Carousel>
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
          <Link
            href={`/platform/trips/${state.trip.id}/listing/${listing.id}`}
            target={isMediumOrAbove ? "_blank" : undefined}  // open in new tab for medium and above
            rel={isMediumOrAbove ? "noopener noreferrer" : undefined}
          >
            <span className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              See more
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;