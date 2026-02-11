import React, { useEffect, useState, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapMarker } from '@/store/map-selection-store';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateRent } from '@/lib/calculate-rent';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

const POPUP_WIDTH = 280;
const SCALE = 1;
const SCALED_WIDTH = POPUP_WIDTH * SCALE;
const TITLE_MAX_LENGTH = 35;

interface MapPinPopupProps {
  marker: MapMarker;
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  onClose: () => void;
  customSnapshot?: any;
  trip?: any;
  tripId?: string;
}

export default function MapPinPopup({ marker, mapRef, onClose, customSnapshot, trip, tripId }: MapPinPopupProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const listing = marker.listing;

  const updatePosition = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const point = map.project(new maplibregl.LngLat(marker.lng, marker.lat));
    setPosition({ x: point.x, y: point.y });
  }, [mapRef, marker.lng, marker.lat]);

  useEffect(() => {
    updatePosition();

    const map = mapRef.current;
    if (!map) return;

    map.on('move', updatePosition);
    return () => { map.off('move', updatePosition); };
  }, [mapRef, updatePosition]);

  // Carousel navigation
  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    carouselApi?.scrollPrev();
  }, [carouselApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    carouselApi?.scrollNext();
  }, [carouselApi]);

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on('select', onSelect);
    onSelect();
    return () => { carouselApi.off('select', onSelect); };
  }, [carouselApi, onSelect]);

  const hasMultipleImages = listing.listingImages.length > 1;
  const canScrollPrev = currentSlide > 0;
  const canScrollNext = currentSlide < listing.listingImages.length - 1;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('.carousel-controls')) return;
    window.open(`/search/listing/${listing.id}`, '_blank');
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customSnapshot) return;
    if (customSnapshot.isLiked(listing.id)) {
      customSnapshot.optimisticRemoveLike(listing.id);
    } else {
      customSnapshot.optimisticLike(listing.id);
    }
  };

  const isLiked = customSnapshot?.isLiked(listing.id) ?? false;
  const hasTripDates = Boolean(trip?.startDate && trip?.endDate);
  const calculatedPrice = hasTripDates ? calculateRent({ listing, trip } as any) : listing.price;
  const displayTitle = listing.title.length > TITLE_MAX_LENGTH
    ? `${listing.title.substring(0, TITLE_MAX_LENGTH)}...`
    : listing.title;

  if (!position) return null;

  const left = position.x - SCALED_WIDTH / 2;
  const top = position.y;

  return (
    <div
      ref={popupRef}
      className="absolute z-30 pointer-events-auto"
      style={{
        left,
        top,
        transform: 'translate(0, -100%)',
        width: POPUP_WIDTH,
        transformOrigin: 'bottom center',
      }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer"
        style={{ transform: `scale(${SCALE})`, transformOrigin: 'bottom center' }}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Carousel with heart button */}
        <div className="relative">
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
                    <div className="w-full aspect-[5/4] overflow-hidden">
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
                  <div className="w-full aspect-[5/4] overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      alt="Property"
                      src="/placeholder-property.jpg"
                    />
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>

            {/* Navigation Arrows */}
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

          {/* Dot Indicators */}
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
          <button
            onClick={handleHeartClick}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-gray-200 transition-colors"
          >
            <Heart
              className={`w-[18px] h-[18px] ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pt-3 pb-4">
          {/* Title */}
          <h3 className="font-medium text-gray-900 text-sm mb-0.5">
            {displayTitle}
          </h3>

          {/* Bed/Bath, Type, Location */}
          <p className="text-gray-500 text-sm mb-2">
            {listing.roomCount || 4} Bed, {listing.bathroomCount || 2} bath {(listing as any).displayCategory || 'Property'}{listing.state ? ` in ${listing.state}` : ''}
          </p>

          {/* Price and Rating */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 text-sm">
              ${calculatedPrice?.toLocaleString() || 0} / Month
            </span>
            {(listing as any).averageRating && (
              <span className="text-gray-500 text-sm">
                {(listing as any).averageRating.toFixed(1)} ({(listing as any).numberOfStays || 0})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
