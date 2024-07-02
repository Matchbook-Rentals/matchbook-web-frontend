import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { ListingImage } from '@prisma/client';

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
    <div className="flex flex-col md:flex-row md:space-x-4 lg:space-x-8 w-full h-[50vh]">
      <div className="w-full md:w-1/2  md:h-full relative">
        <img
          src={listingImages[activeImage].url}
          alt={`${listingImages[activeImage].category} image ${listingImages[activeImage].rank}`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-full md:w-1/2 md:h-full relative">
        <Carousel opts={{loop: true}} setApi={setApi} className="">
          <CarouselContent className="">
            {chunkedImages.map((chunk, chunkIndex) => (
              <CarouselItem key={chunkIndex} className=" h-[50vh] p-0">
                <div className="grid grid-cols-2 grid-rows-2 gap-2 ">
                  {chunk.map((image, imageIndex) => (
                    <div
                      key={image.id}
                      className="relative cursor-pointer h-[25vh] overflow-hidden"
                      onClick={() => handleImageClick(chunkIndex * 4 + imageIndex)}
                    >
                      <img
                        src={image.url}
                        alt={`${image.category} image ${image.rank}`}
                        className=" object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 md:-left-5 lg:-left-0 h-16 w-16 text-white bg-black/10 hover:bg-black/70 hover:text-white" />
          <CarouselNext className="absolute -right-4 md:-right-5 lg:-right-0 bottom-6  h-16 w-16 text-white bg-black/10 hover:bg-black/70 hover:text-white" />
        </Carousel>
      </div>
    </div>
  );
};

export default ListingImageCarousel;
