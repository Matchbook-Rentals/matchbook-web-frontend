import React, { useState } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { RejectIcon } from '@/components/svgs/svg-components';
import { Heart } from 'lucide-react';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useListingsSnapshot } from '@/hooks/useListingsSnapshot';
import { usePathname, useParams } from 'next/navigation';
import ShareButton from '@/components/ui/share-button';
import PropertyDetails from '@/app/app/rent/searches/(trips-components)/property-details';
import PricingInfo from '@/app/app/rent/searches/(trips-components)/pricing-info';
import HighlightsSection from '@/app/app/rent/searches/(trips-components)/highlights-section';
import AmenitiesSection from '@/app/app/rent/searches/(trips-components)/amenities-section';
import HostInformation from '@/app/app/rent/searches/(trips-components)/host-information';
import DescriptionSection from '@/app/app/rent/searches/(trips-components)/description-section';

import { ListingAndImages } from '@/types';

interface SelectedListingDetailsProps {
  listing: ListingAndImages;
  distance?: number;
  customSnapshot?: any;
  height?: string;
}

const SelectedListingDetails: React.FC<SelectedListingDetailsProps> = ({ 
  listing, 
  distance, 
  customSnapshot,
  height = 'calc(100vh-200px)'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const { tripId } = useParams();
  const baseUrl = process.env.NEXT_PUBLIC_URL || "";
  
  // Always call the hook unconditionally to comply with rules of hooks
  const snapshotFromHook = useListingsSnapshot();
  // Then use either the custom snapshot or the one from the hook
  const listingsSnapshot = customSnapshot || snapshotFromHook;

  // Use properties and functions from the snapshot
  const isLiked = listingsSnapshot.isLiked(listing.id);
  const isDisliked = listingsSnapshot.isDisliked(listing.id);

  const getStatusIcon = () => {
    if (isLiked) {
      return (
        <div
          className="bg-black/50 rounded-full p-2"
          onClick={(e: React.MouseEvent) => {
            listingsSnapshot.optimisticRemoveLike(listing.id);
            e.stopPropagation();
          }}
        >
          <Heart
            className="w-6 h-6 text-white cursor-pointer fill-red-500"
            strokeWidth={2}
          />
        </div>
      );
    } else if (isDisliked) {
      return (
        <div
          className="bg-black/50 rounded-full"
          onClick={(e: React.MouseEvent) => {
            listingsSnapshot.optimisticRemoveDislike(listing.id);
            e.stopPropagation();
          }}
        >
          <RejectIcon className="w-9 h-9 text-white cursor-pointer p-2" />
        </div>
      );
    }

    return (
      <div
        className="bg-black/50 rounded-full p-2"
        onClick={(e: React.MouseEvent) => {
          listingsSnapshot.optimisticLike(listing.id);
          e.stopPropagation();
        }}
      >
        <Heart
          className="w-6 h-6 text-white cursor-pointer"
          strokeWidth={2}
        />
      </div>
    );
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full" style={{ height }}>
        <div className="w-full px-4 pb-8">
          {/* Image Carousel */}
          <div 
            className="relative h-64 w-full mb-6 rounded-lg overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Carousel keyboardControls={false} opts={{ loop: true }}>
              <CarouselContent>
                {listing.listingImages.map((image, index) => (
                  <CarouselItem key={index} className="relative h-64 w-full">
                    <Image src={image.url} alt={listing.title} fill className="object-cover" unoptimized />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <CarouselPrevious
                  Icon={ArrowLeft}
                  className="left-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pl-[4px] z-20"
                />
                <CarouselNext
                  Icon={ArrowRight}
                  className="right-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pr-[4px] z-20"
                />
              </div>
            </Carousel>

            {/* Action Button */}
            <div className="absolute top-3 right-3 z-10 transition-opacity duration-300 opacity-80">
              {getStatusIcon()}
            </div>
          </div>

          {/* Header Section - mirroring ListingHeader */}
          <Card className="border-none shadow-none mt-2">
            <CardContent className="flex flex-col items-start gap-3 p-0">
              <div className="flex items-center justify-between w-full">
                <h1 className="flex-1 font-medium text-[#404040] text-xl md:text-2xl lg:text-[32px] tracking-[-2.00px] font-['Poppins',Helvetica]">
                  {listing.title || "Your Home Away From Home"}
                </h1>

                <ShareButton
                  title={`${listing.title} on Matchbook`}
                  text={`Check out this listing on Matchbook: ${pathname}`}
                  url={`${baseUrl}/guest/trips/${tripId}/listing/${listing.id}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Details Section */}
          <Card className="border-none shadow-none rounded-xl mt-2 lg:block hidden">
            <CardContent className="p-0">
              <PropertyDetails listing={listing} />
            </CardContent>
          </Card>

          <Card className="border-none bg-[#FAFAFA] rounded-xl mt-2 lg:hidden">
            <CardContent className="p-0">
              <PricingInfo listing={listing} />
              <PropertyDetails listing={listing} />
            </CardContent>
          </Card>

          {/* Highlights Section */}
          <div className="lg:mt-4 mt-2">
            <HighlightsSection listing={listing} />
          </div>

          {/* Description Section */}
          <div className="mt-2">
            <DescriptionSection listing={listing} />
          </div>

          {/* Amenities Section */}
          <div className="mt-2">
            <AmenitiesSection 
              listing={listing}
              showFullAmenities={false}
            />
          </div>

          {/* Host Information Section */}
          <div className="mt-2">
            <HostInformation listing={listing} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SelectedListingDetails;
