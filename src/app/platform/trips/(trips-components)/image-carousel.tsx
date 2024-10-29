import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
//Imports
import { ListingImage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { PictureIcon } from '@/components/svgs/svg-components';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ListingImageCarouselProps {
  listingImages: ListingImage[]
}

const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({ listingImages }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Early return for no images
  if (listingImages.length === 0) {
    return <p>No listing Images</p>;
  }

  // Ensure uniqueness of images based on their id
  const uniqueImages = Array.from(new Map(listingImages.map(img => [img.id, img])).values());

  const chunkedImages = uniqueImages.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 4);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, [] as ListingImage[][]);

  const handleImageClick = (index: number) => {
    console.log(`Clicked image index: ${index}`);
    setActiveImage(index);
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  return (

    <div className="flex flex-col md:flex-row md:space-x-4 lg:space-x-4 w-full h-[40vh]">

      {/* Large featured image - hidden on mobile */}
      <div className="w-full hidden md:flex md:w-1/2  md:h-full relative">
        <img
          src={listingImages[activeImage]?.url}
          alt={`${listingImages[activeImage]?.category} image ${listingImages[activeImage]?.rank}`}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Carousel section */}
      <div className="w-full md:w-1/2 md:h-full relative">
        <Carousel opts={{ loop: true }} setApi={setApi} className="">
          <CarouselContent className="">
            {/* Map through chunks of 4 images */}
            {chunkedImages.map((chunk, chunkIndex) => (
              <CarouselItem key={`chunk-${chunkIndex}`} className=" h-[40vh] px-4 ">
                {/* Grid layout for 4 images */}
                <div className="grid grid-cols-2 grid-rows-2 gap-4 ">
                  {chunk.map((image, idx) => (
                    <div
                      key={`image-${image.id}`}
                      className="relative cursor-pointer  h-[19vh] overflow-hidden"
                      onClick={() => handleImageClick(listingImages.findIndex(img => img.id === image.id))}
                    >
                      <img
                        src={image.url}
                        alt={`${image.category} image ${image.rank}`}
                        className="object-cover w-full h-full rounded-lg"
                      />

                      {/* "Show More" dialog trigger on the last image */}
                      {idx === 3 && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={handleDialogOpen}
                              className="absolute md:hidden bottom-[15%] h-6 right-[5%] flex justify-between gap-x-2 bg-white text-black hover:bg-gray-200"
                            >
                              <img src='/picture-icon.png' className='h-5 w-5' />
                              <p className=''>More</p>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-2 ">
                              {uniqueImages.map((image) => (
                                <img
                                  key={image.id}
                                  src={image.url}
                                  alt={`${image.category} image ${image.rank}`}
                                  className="w-full h-auto rounded-lg border my-2 object-cover"
                                />
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Carousel navigation buttons */}
          <CarouselPrevious className="absolute -left-0 h-16 w-16 text-white
                                       bg-black/10 hover:bg-black/70 
                                       hover:text-white"
          />
          <CarouselNext className="absolute -right-0 bottom-6 h-16 w-16
                                   hover:bg-black/70 hover:text-white
                                   text-white bg-black/10"
          />

        </Carousel>
      </div>
    </div>
  );
};

export default ListingImageCarousel;

