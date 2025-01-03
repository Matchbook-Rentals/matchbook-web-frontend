import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { ListingImage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ListingImageCarouselProps {
  listingImages: ListingImage[]
}

const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({ listingImages }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (listingImages.length === 0) {
    return <p>No listing Images</p>;
  }

  const uniqueImages = Array.from(new Map(listingImages.map(img => [img.id, img])).values());

  const handleImageClick = (index: number) => {
    setActiveImage(index);
  };

  const chunkedImages = uniqueImages.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 4);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, [] as ListingImage[][]);

  return (
    <>
      {/* Desktop Layout - Side by side */}
      <div className="hidden md:flex flex-row space-x-8 w-full h-[50vh]">
        {/* Main image */}
        <div className="w-1/2 h-full relative">
          <img
            src={listingImages[activeImage]?.url}
            alt={`${listingImages[activeImage]?.category} image ${listingImages[activeImage]?.rank}`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Desktop grid carousel */}
        <div className="w-1/2 h-full">
          <Carousel opts={{ loop: true }} setApi={setApi}>
            <CarouselContent>
              {chunkedImages.map((chunk, chunkIndex) => (
                <CarouselItem key={`chunk-${chunkIndex}`} className="h-[50vh] pl-4">
                  <div className="grid grid-cols-2 grid-rows-2 gap-4">
                    {chunk.map((image, idx) => (
                      <div
                        key={`image-${image.id}-${idx}`}
                        className="relative cursor-pointer h-[24vh] overflow-hidden rounded-lg"
                        onClick={() => handleImageClick(uniqueImages.indexOf(image))}
                      >
                        <img
                          src={image.url}
                          alt={`${image.category} image ${image.rank}`}
                          className="object-cover w-full h-full rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-0 h-16 w-16 text-white bg-black/10 hover:bg-black/70 hover:text-white" />
            <CarouselNext className="absolute -right-0 bottom-6 h-16 w-16 hover:bg-black/70 hover:text-white text-white bg-black/10" />
          </Carousel>
        </div>
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="md:hidden flex flex-col space-y-4 w-full">
        {/* Main image with Show More button */}
        <div className="w-full h-[30vh] relative">
          <img
            src={listingImages[activeImage]?.url}
            alt={`${listingImages[activeImage]?.category} image ${listingImages[activeImage]?.rank}`}
            className="w-full h-full object-cover rounded-[30px]"
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="absolute bottom-4 right-4 flex justify-between gap-x-2 bg-white hover:bg-gray-200"
              >
                <img src='/picture-icon.png' className='h-5 w-5' />
                <p className='text-[#404040]'>Show All</p>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[90vh] pt-16 overflow-y-auto ">
              <div className="flex flex-col space-y-4">
                {uniqueImages.map((image, index) => (
                  <div key={image.id} className="relative w-full">
                    <img
                      src={image.url}
                      alt={`${image.category} image ${image.rank}`}
                      className="w-full h-auto rounded-[30px] shadow-sm"
                    />
                    <p className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {index + 1} / {uniqueImages.length}
                    </p>
                  </div>
                ))}
              </div>
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent md:hidden">
              </div>
              <Button
                onClick={() => document.querySelector('[role="dialog"] button[aria-label="Close"]')?.click()}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mobile horizontal thumbnail carousel */}
        <div className="w-full">
          <Carousel
            opts={{
              loop: true,
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {uniqueImages.map((image, index) => (
                <CarouselItem key={image.id} className="basis-1/4 pl-4">
                  <div
                    className="relative cursor-pointer h-20 rounded-lg"
                    onClick={() => handleImageClick(index)}
                  >
                    <img
                      src={image.url}
                      alt={`${image.category} image ${image.rank}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </>
  );
};

export default ListingImageCarousel;
