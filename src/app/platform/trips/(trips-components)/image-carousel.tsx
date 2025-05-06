import React, { useState, useEffect } from 'react'; // Import useEffect
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { ListingImage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RejectIcon } from '@/components/icons';

interface ListingImageCarouselProps {
  listingImages: ListingImage[]
}

const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({ listingImages }) => {
  const [activeImage, setActiveImage] = useState(0); // Index for desktop main image
  const [api, setApi] = useState<CarouselApi>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false); // Loading state for active image

  // Effect to reset loading state when active image or image list changes
  useEffect(() => {
    setIsMainImageLoaded(false);
    // Potentially sync mobile carousel's active slide if api is available
    // api?.scrollTo(activeImage); // Example, might need adjustment based on CarouselApi
  }, [activeImage, listingImages]); // Watch both activeImage index and the image array

  // Effect to update activeImage based on mobile carousel scroll
  useEffect(() => {
    if (!api) {
      return;
    }
    const handleSelect = () => {
      const currentSlide = api.selectedScrollSnap();
      // Update activeImage state based on mobile carousel, but only if it differs
      // This helps keep the loading state somewhat in sync
      if (currentSlide !== activeImage) {
         setActiveImage(currentSlide);
      }
       // Always reset loading state on mobile scroll snap
       setIsMainImageLoaded(false);
    };

    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api, activeImage]); // Rerun when api is available or activeImage changes externally

  if (listingImages.length === 0) {
    // Still show pulse if listingImages is empty initially before this check
    return (
      <div className="w-full h-[50vh] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        Loading Images...
      </div>
    );
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
      <div className="hidden lg:flex flex-row space-x-3 lg:space-x-4 xl:space-x-5 w-full h-[50vh]">
        {/* Main image */}
        <div className="w-1/2 h-full relative">
          {/* Placeholder */}
          {!isMainImageLoaded && (
            <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
          )}
          {/* Actual Image */}
          {uniqueImages.length > 0 && uniqueImages[activeImage] && ( // Check if image exists at index
            <img
              key={uniqueImages[activeImage].id} // Add key to help React detect changes
              src={uniqueImages[activeImage].url}
              alt={`${uniqueImages[activeImage]?.category} image ${uniqueImages[activeImage]?.rank}`}
              className={`w-full h-full object-cover rounded-lg ${isMainImageLoaded ? 'block' : 'hidden'}`} // Hide until loaded
              onLoad={() => setIsMainImageLoaded(true)}
              onError={() => setIsMainImageLoaded(true)} // Stop pulse on error too
            />
          )}
           {/* Fallback pulse if array has items but index is somehow invalid */}
           {(uniqueImages.length === 0 || !uniqueImages[activeImage]) && !isMainImageLoaded && (
             <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
           )}
        </div>

        {/* Desktop grid carousel */}
        <div className="w-1/2 h-full">
          <Carousel opts={{ loop: true }} setApi={setApi}>
            <CarouselContent>
              {chunkedImages.map((chunk, chunkIndex) => (
                <CarouselItem key={`chunk-${chunkIndex}`} className="h-[50vh] pl-4">
                  <div className="grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4">
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
      <div className="lg:hidden flex flex-col space-y-4 w-full">
        {/* Main image with Show More button */}
        <div className="w-full h-[30vh] relative">
          <Carousel opts={{ loop: true }} setApi={setApi}>
            <CarouselContent>
              {uniqueImages.map((image, index) => {
                 // Determine if this specific item should show loading state
                 // This relies on activeImage state being updated by the carousel's 'select' event
                 const isCurrentItemLoading = index === activeImage && !isMainImageLoaded;

                 return (
                  <CarouselItem key={image.id} className="w-full h-[30vh]">
                    <div className="relative w-full h-full">
                      {/* Placeholder for the current item if loading */}
                      {isCurrentItemLoading && (
                        <div className="absolute inset-0 w-full h-full bg-gray-200 animate-pulse rounded-[5px]" />
                      )}
                      <img
                        key={image.id + '-mobile'} // Unique key for mobile image
                        src={image.url}
                        alt={`${image.category} image ${image.rank}`}
                        className={`w-full h-full object-cover rounded-[5px] ${isCurrentItemLoading ? 'invisible' : 'visible'}`} // Use visibility to prevent layout shift
                        // onLoad/onError only relevant for the active image to update the state
                        onLoad={() => { if (index === activeImage) setIsMainImageLoaded(true); }}
                        onError={() => { if (index === activeImage) setIsMainImageLoaded(true); }} // Stop pulse on error
                      />
                      <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm z-10">
                        {index + 1} / {uniqueImages.length}
                      </p>
                    </div>
                  </CarouselItem>
                 );
              })}
            </CarouselContent>
            {/* Removed duplicate/stray elements below */}
            <CarouselPrevious className="hidden sm:flex absolute -left-0 h-16 w-16 text-white bg-black/10 hover:bg-black/70 hover:text-white" />
            <CarouselNext className="hidden sm:flex absolute -right-0 bottom-6 h-16 w-16 hover:bg-black/70 hover:text-white text-white bg-black/10" />
          </Carousel>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className='' asChild>
              <Button
                className="absolute bottom-2 right-2 py-1 px-2 h-fit  flex justify-between gap-x-2 bg-white hover:bg-gray-200"
              >
                <img src='/picture-icon.png' className='h-4 w-4 ' />
                <p className='text-[#404040] text-[12px] '>Show All</p>
              </Button>
            </DialogTrigger>
            <DialogContent hideCloseButton className="max-w-[95vw] max-h-[75vh] sm:max-h-[90vh] pt-6 pb-4 overflow-y-auto rounded-lg">
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {uniqueImages.map((image, index) => (
                  <div key={image.id} className="relative w-full bg-gray-100  rounded-[20px] overflow-hidden">
                    <img
                      src={image.url}
                      alt={`${image.category} image ${image.rank}`}
                      className="object-contain w-full h-full min-h-[200px] max-h-[400px]"
                    />
                    <p className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {index + 1} / {uniqueImages.length}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setIsDialogOpen(false)}
                className="w-1/3 max-w-[300px] text-[16px] sticky bottom-0 mx-auto mt-2 rounded-full bg-charcoalBrand text-background"
              >
                <RejectIcon className='h-full p-1 mr-2 hidden xxs:inline' />
                Close
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default ListingImageCarousel;
