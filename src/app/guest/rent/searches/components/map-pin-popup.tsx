import React, { useEffect, useState, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapMarker } from '@/store/map-selection-store';
import { Heart } from 'lucide-react';
import { calculateRent } from '@/lib/calculate-rent';

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

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
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
      >
        {/* Image with heart button */}
        <div className="relative">
          <img
            className="w-full aspect-[5/4] object-cover"
            alt={listing.title}
            src={listing.listingImages[0]?.url || '/placeholder-property.jpg'}
          />
          <button
            onClick={handleHeartClick}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
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
