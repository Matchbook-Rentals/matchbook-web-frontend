import React, { useState, useEffect } from 'react'; // Import useEffect
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { ListingImage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RejectIcon } from '@/components/icons';

interface ListingImageCarouselProps {
  listingImages: ListingImage[]
}

const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({ listingImages }) => {
  const [activeImage, setActiveImage] = useState(0); // Index for desktop main image
  const [api, setApi] = useState<CarouselApi>();
  const [dialogApi, setDialogApi] = useState<CarouselApi>(); // API for dialog carousel
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>(); // API for thumbnail carousel
  const [dialogActiveImage, setDialogActiveImage] = useState(0); // Active image in dialog
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

  // Effect to sync dialog carousel with thumbnail selection
  useEffect(() => {
    if (!dialogApi) return;

    const handleDialogSelect = () => {
      const currentSlide = dialogApi.selectedScrollSnap();
      setDialogActiveImage(currentSlide);
      
      // Scroll thumbnail carousel to keep active image visible
      if (thumbnailApi) {
        // Get the scroll info from the thumbnail carousel
        const slidesInView = thumbnailApi.slidesInView();
        
        // Check if current slide is visible
        if (!slidesInView.includes(currentSlide)) {
          // If not visible, scroll to show it
          // We'll position it to be the first visible slide if scrolling backward
          // or last visible slide if scrolling forward
          const firstVisible = slidesInView[0];
          const lastVisible = slidesInView[slidesInView.length - 1];
          
          if (currentSlide < firstVisible) {
            // Need to scroll backward - make it the first visible
            thumbnailApi.scrollTo(currentSlide);
          } else if (currentSlide > lastVisible) {
            // Need to scroll forward - calculate position to make it the last visible
            const visibleCount = slidesInView.length;
            const targetPosition = Math.max(0, currentSlide - visibleCount + 1);
            thumbnailApi.scrollTo(targetPosition);
          }
        }
      }
    };

    dialogApi.on("select", handleDialogSelect);
    return () => dialogApi.off("select", handleDialogSelect);
  }, [dialogApi, thumbnailApi]);

  // Reset dialog active image when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setDialogActiveImage(activeImage);
      if (dialogApi) {
        dialogApi.scrollTo(activeImage);
      }
      if (thumbnailApi) {
        // Calculate position to center or show the active image optimally
        const visibleCount = 5; // Approximate visible thumbnails
        const targetPosition = Math.max(0, activeImage - Math.floor(visibleCount / 2));
        thumbnailApi.scrollTo(targetPosition);
      }
    }
  }, [isDialogOpen, activeImage, dialogApi, thumbnailApi]);

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

  const handleThumbnailClick = (index: number) => {
    setDialogActiveImage(index);
    if (dialogApi) {
      dialogApi.scrollTo(index);
    }
    
    // Update thumbnail carousel position to ensure clicked thumbnail is visible
    if (thumbnailApi) {
      const slidesInView = thumbnailApi.slidesInView();
      
      // Check if clicked thumbnail is already visible
      if (!slidesInView.includes(index)) {
        // If not visible, scroll to show it
        const firstVisible = slidesInView[0];
        const lastVisible = slidesInView[slidesInView.length - 1];
        
        if (index < firstVisible) {
          // Clicked thumbnail is before visible range - scroll to it
          thumbnailApi.scrollTo(index);
        } else if (index > lastVisible) {
          // Clicked thumbnail is after visible range
          // Position it as the last visible thumbnail
          const visibleCount = slidesInView.length;
          const targetPosition = Math.max(0, index - visibleCount + 1);
          thumbnailApi.scrollTo(targetPosition);
        }
      }
    }
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
              draggable={false}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
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
                    {chunk.map((image, idx) => {
                      const isBottomRight = idx === 3 || (idx === chunk.length - 1 && chunk.length < 4);
                      return (
                        <div
                          key={`image-${image.id}-${idx}`}
                          className="relative cursor-pointer h-[24vh] overflow-hidden rounded-lg"
                          onClick={() => handleImageClick(uniqueImages.indexOf(image))}
                        >
                          <img
                            src={image.url}
                            alt={`${image.category} image ${image.rank}`}
                            className="object-cover w-full h-full rounded-lg"
                            draggable={false}
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                          />
                          {isBottomRight && (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                              <DialogTrigger className='' asChild>
                                <Button
                                  className="absolute bottom-2 right-2 py-1 px-2 h-fit text-white border border-white bg-transparent hover:text-black hover:bg-white"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className='text-[12px]'>View All</p>
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          )}
                        </div>
                      );
                    })}
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
                        draggable={false}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      />
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
                className="absolute bottom-2 right-2 py-1 px-2 h-fit text-white border border-white bg-transparent hover:text-black hover:bg-white"
              >
                <p className='text-[12px]'>View All</p>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[90vh] sm:max-h-[95vh] lg:max-w-[90vw] lg:max-h-[90vh] pt-6 pb-4 rounded-lg flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl text-center">All photos</DialogTitle>
              </DialogHeader>
              
              {/* Mobile: Grid layout */}
              <div className="lg:hidden">
                <ScrollArea className="h-[80vh]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-4">
                    {uniqueImages.map((image, index) => (
                      <div key={image.id} className="relative w-full bg-gray-100 rounded-[20px] overflow-hidden" style={{ aspectRatio: '3.6/2.2' }}>
                        <img
                          src={image.url}
                          alt={`${image.category} image ${image.rank}`}
                          className="object-cover w-full h-full"
                          draggable={false}
                          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Desktop: Single large image carousel */}
              <div className="hidden lg:flex flex-col flex-1">
                {/* Main image carousel */}
                <div className="flex-1 mb-4">
                  <Carousel opts={{ loop: true }} setApi={setDialogApi}>
                    <CarouselContent className="h-[70vh]">
                      {uniqueImages.map((image, index) => (
                        <CarouselItem key={image.id} className="flex items-center justify-center">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img
                              src={image.url}
                              alt={`${image.category} image ${image.rank}`}
                              className="max-w-full max-h-full object-contain rounded-lg"
                              draggable={false}
                              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white bg-black/50 hover:bg-black/70 hover:text-white border-0" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white bg-black/50 hover:bg-black/70 hover:text-white border-0" />
                  </Carousel>
                </div>

                {/* Thumbnail carousel */}
                <div className="h-24">
                  <Carousel opts={{ loop: false, align: "start", slidesToScroll: 5 }} setApi={setThumbnailApi}>
                    <CarouselContent className="-ml-2 pt-1">
                      {uniqueImages.map((image, index) => (
                        <CarouselItem key={`thumb-${image.id}`} className="pl-2 basis-auto">
                          <div 
                            className={`relative cursor-pointer h-20 w-28 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                              index === dialogActiveImage 
                                ? 'border-yellow-500 shadow-lg -translate-y-1' 
                                : 'border-transparent hover:border-gray-300'
                            }`}
                            onClick={() => handleThumbnailClick(index)}
                          >
                            <img
                              src={image.url}
                              alt={`${image.category} thumbnail ${image.rank}`}
                              className="object-cover w-full h-full"
                              draggable={false}
                              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:text-white bg-black/80 hover:bg-black hover:scale-110 border border-gray-700 transition-all duration-200" />
                    <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:text-white bg-black/80 hover:bg-black hover:scale-110 border border-gray-700 transition-all duration-200" />
                  </Carousel>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default ListingImageCarousel;
