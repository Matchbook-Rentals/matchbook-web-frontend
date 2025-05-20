import React from 'react';
import { ListingAndImages } from '@/types';
import { RejectIcon, HeartIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { aspectRatio, listing_banner_no_price, listing_banner_with_price } from '@/constants/styles';

interface ListingCardProps {
  listing: ListingAndImages & { price: number };
  distance: number;
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
  className?: string;
}

const DesktopMapClickCardRefactored: React.FC<ListingCardProps> = ({
  listing,
  distance,
  onClose,
  onLike,
  onDislike,
  className = 'absolute top-[2.5%] left-[2.5%] w-[40%] h-fit'
}) => {
  const mainImage = listing.images && listing.images.length > 0 ? listing.images[0].url : '';
  const formattedDistance = distance.toFixed(1);
  const formattedPrice = listing.price ? `$${Math.floor(listing.price).toLocaleString()}` : 'Contact for Price';

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden z-10 ${className}`}>
      {/* Card Header with close button */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onClose}
            className="p-1 bg-charcoalBrand bg-opacity-70 rounded-full text-white hover:bg-opacity-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main image */}
        <div className={`${aspectRatio}`}>
          {mainImage ? (
            <img src={mainImage} alt={listing.name || 'Property'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>
        
        {/* Price banner */}
        {listing.price ? (
          <div className={`${listing_banner_with_price}`}>
            <span className="font-semibold">{formattedPrice}</span>
            <span className="mx-1">&middot;</span>
            <span>{formattedDistance} mi</span>
          </div>
        ) : (
          <div className={`${listing_banner_no_price}`}>
            <span>Contact for Price</span>
            <span className="mx-1">&middot;</span>
            <span>{formattedDistance} mi</span>
          </div>
        )}
      </div>
      
      {/* Card body */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{listing.name}</h3>
        <p className="text-gray-600 mb-2 truncate">{listing.location}</p>
        
        <div className="flex space-x-2 text-sm text-gray-500 mb-3">
          <span>{listing?.bedrooms?.length || 0} Beds</span>
          <span>&middot;</span>
          <span>{listing.bathroomCount} Baths</span>
          {listing.squareFootage && (
            <>
              <span>&middot;</span>
              <span>{listing.squareFootage} sqft</span>
            </>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={onDislike} 
            variant="outline" 
            className="flex-1 gap-2 border-gray-300"
            aria-label="Dislike this listing"
          >
            <RejectIcon className="h-4 w-4" />
            <span>Pass</span>
          </Button>
          <Button 
            onClick={onLike} 
            className="flex-1 gap-2 bg-charcoalBrand text-white"
            aria-label="Like this listing"
          >
            <HeartIcon className="h-4 w-4" />
            <span>Like</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesktopMapClickCardRefactored;