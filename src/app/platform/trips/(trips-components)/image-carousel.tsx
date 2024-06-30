
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi, CarouselPrevious, CarouselNext, } from "@/components/ui/carousel";
import { Listing, ListingImage } from '@prisma/client';

interface ListingImageCarouselProps {
  listingImages: ListingImage[]
}


const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({listingImages}) => {

  const [api, setApi] = React.useState<CarouselApi>();

  return (
    <div className="w-full">
      <Carousel onClick={() => console.log('ListingImages', listingImages)} className="w-full mx-auto" opts={{ loop: true }}>
        <CarouselContent>
          <CarouselItem className="flex items-center justify-center">
            <div className="w-full h-96 relative overflow-hidden">
              {listingImages.length === 1 && (
                <img
                  src={listingImages[0].url}
                  alt="Listing"
                  className="w-full h-full object-cover"
                />
              )}

              {listingImages.length === 2 && (
                <div className="flex h-full">
                  <img
                    src={listingImages[0.].url}
                    alt="Listing 1"
                    className="w-1/2 h-full object-cover"
                  />
                  <img
                    src={listingImages[1].url}
                    alt="Listing 2"
                    className="w-1/2 h-full object-cover"
                  />
                </div>
              )}

              {listingImages?.length > 2 && (
                <div className="flex h-full">
                  <img
                    src={listingImages[0].url}
                    alt="Main Listing"
                    className="w-1/2 h-full object-cover"
                  />
                  <div className="w-1/2 grid grid-cols-2 grid-rows-2 gap-1">
                    {listingImages.slice(1, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={`Listing ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </CarouselItem>
          <CarouselItem className="flex items-center justify-center">
            <div>LISTINGIMAGE</div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default ListingImageCarousel;
