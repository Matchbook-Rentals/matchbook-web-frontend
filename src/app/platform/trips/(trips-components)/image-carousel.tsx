import React, { useState } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi, } from "@/components/ui/carousel";
import { ListingImage } from '@prisma/client';
import { Button } from '@/components/ui/button';

interface ListingImageCarouselProps {
  listingImages: ListingImage[]
}

const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({ listingImages }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  if (listingImages.length === 0) {
    return <p>No listing Images</p>;
  }

  const handleImageClick = (index: number) => {
    console.log(`Clicked image index: ${index}`);
    setActiveImage(index);
  };

  const chunkedImages = listingImages.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 4);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, [] as ListingImage[][]);

  return (
    <div className="flex flex-col md:flex-row md:space-x-4 lg:space-x-6 xl:space-x-8 h-[600px] md:h-[400px] lg:h-[500px] xl:h-[600px]">
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
        <Image
          src={listingImages[activeImage].url}
          alt={`${listingImages[activeImage].category} image ${listingImages[activeImage].rank}`}
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
        <Carousel opts={{loop: true}} setApi={setApi} className="h-full">
          <CarouselContent className="h-full">
            {chunkedImages.map((chunk, chunkIndex) => (
              <CarouselItem key={chunkIndex} className="h-full pt-1 pb-1">
                <div className="grid grid-cols-2 gap-2 h-full">
                  {chunk.map((image, imageIndex) => (
                    <div
                      key={image.id}
                      className="relative aspect-[4/3] cursor-pointer"
                      onClick={() => handleImageClick(chunkIndex * 4 + imageIndex)}
                    >
                      <Image
                        src={image.url}
                        alt={`${image.category} image ${image.rank}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 md:-left-5 lg:-left-6 text-white bg-black/50 hover:bg-black/70" />
          <CarouselNext className="absolute -right-4 md:-right-5 lg:-right-6 text-white bg-black/50 hover:bg-black/70" />
        </Carousel>
      </div>
    </div>
  );
};

export default ListingImageCarousel;
