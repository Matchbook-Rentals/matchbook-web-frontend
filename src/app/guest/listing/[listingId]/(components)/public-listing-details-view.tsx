'use client'
import React, { useRef, useState } from 'react';
import ListingImageCarousel from '@/app/app/rent/searches/(trips-components)/image-carousel';
import { ListingAndImages } from '@/types';
import ListingDescription from '@/app/app/rent/searches/(trips-components)/listing-info';
import PublicListingDetailsBox from './public-listing-details-box';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Heart, Share2 } from 'lucide-react';

interface PublicListingDetailsViewProps {
  listing: ListingAndImages;
  locationString: string;
}

export default function PublicListingDetailsView({
  listing,
  locationString,
}: PublicListingDetailsViewProps) {
  const [mapCenter] = useState<[number, number]>([listing.longitude, listing.latitude]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);

  // Set up the map
  React.useEffect(() => {
    if (!mapContainerRef.current || !mapCenter) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: mapCenter,
      zoom: 14,
      scrollZoom: false,
      dragPan: false,
    });

    mapRef.current = map;

    new maplibregl.Marker().setLngLat(mapCenter).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapCenter]);

  // Handle share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title || 'Check out this rental',
          text: `${listing.title} - ${locationString}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  // Public view action buttons
  const PublicActionButtons = () => (
    <div className="flex items-center gap-x-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => {
          // This could redirect to sign up or login to save favorites
          window.location.href = '/sign-up?redirect=' + encodeURIComponent(window.location.pathname);
        }}
      >
        <Heart className="w-4 h-4" />
        Save
      </Button>
    </div>
  );

  return (
    <>
      <div className="w-full mx-auto pb-[100px] md:pb-[160px] lg:pb-6">
        {/* Add action buttons for public view */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {listing.title}
            </h1>
            <p className="text-gray-600">{locationString}</p>
          </div>
          {/* <PublicActionButtons /> */}
        </div>

        <ListingImageCarousel listingImages={listing.listingImages || []} />
        
        <div className="flex justify-between gap-x-8 relative">
          <ListingDescription listing={listing} />
          <div className="w-1/2 h-fit lg:w-3/5 sticky top-[10%] hidden lg:block">
            <PublicListingDetailsBox 
              listing={listing} 
            />
          </div>
        </div>

        {/* Location section */}
        <div className="pb-3 mt-3" ref={locationSectionRef}>
          <h3 className="text-[24px] text-[#404040] font-medium mb-4">Location</h3>
          <div className="w-full h-[526px] mt-4 relative" ref={mapContainerRef}>
            <div className="absolute top-2 right-2 z-10 flex flex-col">
              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.zoomIn();
                  }
                }}
                className="bg-white p-2 rounded-md shadow mb-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.zoomOut();
                  }
                }}
                className="bg-white p-2 rounded-md shadow"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Call to action for public viewers */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Interested in this property?</h3>
          <p className="text-gray-600 mb-4">
            Sign up with MatchBook to contact the host and start your rental application.
          </p>
          <div className="flex gap-3">
            <Button 
              className="bg-[#0B6E6E] hover:bg-[#0B6E6E]/90"
              onClick={() => {
                window.location.href = '/sign-up?redirect=' + encodeURIComponent(window.location.pathname);
              }}
            >
              Get Started
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                window.location.href = '/sign-in?redirect=' + encodeURIComponent(window.location.pathname);
              }}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
