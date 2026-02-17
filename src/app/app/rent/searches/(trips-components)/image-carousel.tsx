import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Import useEffect
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { ListingImage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RejectIcon } from '@/components/icons';

interface ListingImageCarouselProps {
  listingImages: ListingImage[]
  nextListingImages?: ListingImage[]
  maxHeight?: number
}

// Helper functions for image optimization

// Keep track of preload links for cleanup
const preloadLinksRef = new Set<HTMLLinkElement>();

const preloadImage = (url: string, sizeHint?: 'main' | 'thumbnail') => {
  // For Next.js optimized images, we can add size parameters to the URL
  // The Next.js image optimizer will use these to generate appropriate sizes
  let optimizedUrl = url;

  if (sizeHint === 'main') {
    // Add URL parameters to hint at larger size for main display
    // This helps Next.js Image optimizer prepare the right size
    const separator = url.includes('?') ? '&' : '?';
    optimizedUrl = `${url}${separator}w=1200&q=85`;
  }

  // Check if already preloaded
  const existingLink = Array.from(document.head.querySelectorAll('link[rel="preload"]')).find(
    (link) => link.getAttribute('href') === optimizedUrl
  );
  if (existingLink) return existingLink as HTMLLinkElement;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimizedUrl;
  document.head.appendChild(link);
  preloadLinksRef.add(link);
  return link;
};

// Preload an image specifically for main display (full size)
const preloadMainImage = (url: string) => {
  preloadImage(url, 'main');
};

const cleanupPreloadLinks = () => {
  preloadLinksRef.forEach(link => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  });
  preloadLinksRef.clear();
};

const generateBlurDataURL = (width: number = 4, height: number = 3) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({ listingImages, nextListingImages = [], maxHeight }) => {
  const [activeImage, setActiveImage] = useState(0); // Index for desktop main image
  const [api, setApi] = useState<CarouselApi>();
  const [dialogApi, setDialogApi] = useState<CarouselApi>(); // API for dialog carousel
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>(); // API for thumbnail carousel
  const [dialogActiveImage, setDialogActiveImage] = useState(0); // Active image in dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Memoize unique images to prevent unnecessary recalculations
  const uniqueImages = useMemo(() =>
    Array.from(new Map(listingImages.map(img => [img.id, img])).values()),
    [listingImages]
  );

  // Cap mobile carousel at 20 images to prevent horizontal overflow issue
  const mobileImages = uniqueImages.slice(0, 20);

  // Chunk images into groups of 4 for the desktop grid carousel
  const chunkedImages = useMemo(() =>
    uniqueImages.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / 4);
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [];
      }
      resultArray[chunkIndex].push(item);
      return resultArray;
    }, [] as ListingImage[][]),
    [uniqueImages]
  );

  // Reset activeImage if it exceeds mobile carousel length
  useEffect(() => {
    if (activeImage >= mobileImages.length) {
      setActiveImage(0);
    }
  }, [mobileImages.length, activeImage]);

  // Preload adjacent images
  const preloadAdjacentImages = useCallback((currentIndex: number) => {
    const preloadIndices = [
      currentIndex - 1,
      currentIndex + 1,
      currentIndex - 2,
      currentIndex + 2
    ].filter(idx => idx >= 0 && idx < uniqueImages.length);

    preloadIndices.forEach(idx => {
      if (uniqueImages[idx]) {
        preloadImage(uniqueImages[idx].url);
      }
    });
  }, [uniqueImages]);

  // Preload next listing images (first 4 images for better UX)
  const preloadNextListingImages = useCallback(() => {
    if (nextListingImages.length > 0) {
      const nextUniqueImages = Array.from(new Map(nextListingImages.map(img => [img.id, img])).values());
      // Preload first 4 images of next listing
      [0, 1, 2, 3].forEach(idx => {
        if (nextUniqueImages[idx]) {
          preloadImage(nextUniqueImages[idx].url);
        }
      });
    }
  }, [nextListingImages]);

  // Effect to preload adjacent images when active image changes
  useEffect(() => {
    preloadAdjacentImages(activeImage);
  }, [activeImage, preloadAdjacentImages]);

  // Preload initial images on component mount
  useEffect(() => {
    if (uniqueImages.length > 0) {
      // Preload first image at main size (it's displayed in the left pane)
      if (uniqueImages[0]) {
        preloadMainImage(uniqueImages[0].url);
      }

      // Preload next few images as thumbnails
      [1, 2, 3].forEach(idx => {
        if (uniqueImages[idx]) {
          preloadImage(uniqueImages[idx].url);
        }
      });
    }

    // Preload next listing images after a short delay to prioritize current content
    const nextListingTimer = setTimeout(() => {
      preloadNextListingImages();
    }, 500);

    return () => clearTimeout(nextListingTimer);
  }, [uniqueImages, preloadNextListingImages]);

  // Preload main-size versions of visible grid images for smooth transitions
  useEffect(() => {
    if (!api || chunkedImages.length === 0) return;

    const currentChunkIndex = api.selectedScrollSnap();
    const currentChunk = chunkedImages[currentChunkIndex];

    if (currentChunk) {
      // Preload main-size versions of all images in the current visible grid
      currentChunk.forEach(image => {
        const imageIndex = uniqueImages.indexOf(image);
        // Don't preload the currently active image (already displayed at main size)
        if (imageIndex !== activeImage) {
          preloadMainImage(image.url);
        }
      });
    }
  }, [api, chunkedImages, uniqueImages, activeImage]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    // This effect runs when listingImages change, indicating a new listing is loaded
    // We should limit the total number of preload links to avoid memory issues
    const currentPreloadLinks = document.head.querySelectorAll('link[rel="preload"][as="image"]');
    if (currentPreloadLinks.length > 50) {
      // Remove oldest preload links if we have too many
      Array.from(currentPreloadLinks).slice(0, 20).forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
          preloadLinksRef.delete(link as HTMLLinkElement);
        }
      });
    }
  }, [listingImages]);

  // Effect to update activeImage based on mobile carousel scroll
  useEffect(() => {
    if (!api) {
      return;
    }
    const handleSelect = () => {
      const currentSlide = api.selectedScrollSnap();
      if (currentSlide !== activeImage) {
         setActiveImage(currentSlide);
      }
    };

    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api, activeImage]);

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

  if (uniqueImages.length === 0) {
    return (
      <div className="w-full h-[50vh] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        Loading Images...
      </div>
    );
  }

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

  return (
    <>
      {/* Desktop Layout - Side by side */}
      <div className="hidden lg:flex flex-row space-x-3 lg:space-x-4 xl:space-x-5 w-full h-[50vh]" style={maxHeight ? { maxHeight } : undefined}>
        {/* Main image */}
        <div
          className="w-1/2 h-full relative overflow-hidden rounded-lg bg-cover bg-center"
          style={{
            backgroundImage: uniqueImages[activeImage] ? `url(${uniqueImages[activeImage].url})` : 'none'
          }}
        >
          {uniqueImages[activeImage] && (
            <>
              {/* Thumbnail - loads fast, stretched */}
              <Image
                key={`${uniqueImages[activeImage].id}-thumb`}
                src={uniqueImages[activeImage].url}
                alt={`${uniqueImages[activeImage]?.category} image ${uniqueImages[activeImage]?.rank}`}
                fill
                className="object-cover"
                priority={activeImage === 0}
                placeholder="blur"
                blurDataURL={generateBlurDataURL()}
                sizes="300px"
                draggable={false}
              />
              {/* Full-size - loads on top, fades in when ready */}
              <Image
                key={`${uniqueImages[activeImage].id}-full`}
                src={uniqueImages[activeImage].url}
                alt={`${uniqueImages[activeImage]?.category} image ${uniqueImages[activeImage]?.rank}`}
                fill
                className="object-cover transition-opacity duration-500"
                priority={activeImage === 0}
                placeholder="empty"
                sizes="(max-width: 1024px) 100vw, 50vw"
                draggable={false}
              />
            </>
          )}
        </div>

        {/* Desktop grid carousel */}
        <div className="w-1/2 h-full">
          <Carousel opts={{ loop: true }} setApi={setApi}>
            <CarouselContent>
              {chunkedImages.map((chunk, chunkIndex) => (
                <CarouselItem key={`chunk-${chunkIndex}`} className="h-[50vh] pl-4" style={maxHeight ? { maxHeight } : undefined}>
                  <div className={`grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4${maxHeight ? ' h-full' : ''}`}>
                    {chunk.map((image, idx) => {
                      const isBottomRight = idx === 3 || (idx === chunk.length - 1 && chunk.length < 4);
                      const imageIndex = uniqueImages.indexOf(image);
                      return (
                        <div
                          key={`image-${image.id}-${idx}`}
                          className={`relative cursor-pointer overflow-hidden rounded-lg${maxHeight ? '' : ' h-[24vh]'}`}
                          onClick={() => handleImageClick(imageIndex)}
                        >
                          <Image
                            src={image.url}
                            alt={`${image.category} image ${image.rank}`}
                            fill
                            className="object-cover"
                            placeholder="blur"
                            blurDataURL={generateBlurDataURL()}
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            draggable={false}
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
      <div className="lg:hidden flex flex-col w-full">
        {/* Main image carousel */}
        <div className="w-full h-[30vh] relative" style={maxHeight ? { maxHeight: Math.round(maxHeight * 0.65) } : undefined}>
          <Carousel opts={{ loop: true }} setApi={setApi}>
            <CarouselContent>
              {mobileImages.map((image, index) => (
                  <CarouselItem key={image.id} className="w-full h-[30vh]" style={maxHeight ? { maxHeight: Math.round(maxHeight * 0.65) } : undefined}>
                    <div className="relative w-full h-full overflow-hidden rounded-2xl">
                      {/* Thumbnail - loads fast, stretched */}
                      <Image
                        src={image.url}
                        alt={`${image.category} image ${image.rank}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        placeholder="blur"
                        blurDataURL={generateBlurDataURL()}
                        sizes="300px"
                        draggable={false}
                      />
                      {/* Full-size - loads on top, fades in when ready */}
                      <Image
                        src={image.url}
                        alt={`${image.category} image ${image.rank}`}
                        fill
                        className="object-cover transition-opacity duration-500"
                        priority={index === 0}
                        placeholder="empty"
                        sizes="100vw"
                        draggable={false}
                      />
                    </div>
                  </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          {/* Bottom-right: photo counter that opens "View All" modal */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className='' asChild>
              <button
                className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-md bg-black/60 text-white text-xs font-medium backdrop-blur-sm hover:bg-black/70 transition-colors"
              >
                {activeImage + 1} / {mobileImages.length}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[90vh] sm:max-h-[95vh] lg:max-w-[90vw] lg:max-h-[98vh] pt-6 pb-4 rounded-lg flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-xl text-center">All photos</DialogTitle>
              </DialogHeader>
              
              {/* Mobile: Grid layout */}
              <div className="lg:hidden overflow-hidden">
                <ScrollArea className="h-[80vh]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-4">
                    {uniqueImages.map((image, index) => (
                      <div key={image.id} className="relative w-full bg-gray-100 rounded-[20px] overflow-hidden" style={{ aspectRatio: '3.6/2.2' }}>
                        <Image
                          src={image.url}
                          alt={`${image.category} image ${image.rank}`}
                          fill
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL={generateBlurDataURL()}
                          sizes="(max-width: 640px) 100vw, 50vw"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Desktop: Single large image carousel */}
              <div className="hidden lg:flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Main image carousel */}
                <div className="flex-[0_0_auto] mb-4">
                  <Carousel opts={{ loop: true }} setApi={setDialogApi}>
                    <CarouselContent className="h-[65dvh]">
                      {uniqueImages.map((image, index) => (
                        <CarouselItem key={image.id} className="flex items-center justify-center">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                              src={image.url}
                              alt={`${image.category} image ${image.rank}`}
                              fill
                              className="object-contain rounded-lg"
                              placeholder="blur"
                              blurDataURL={generateBlurDataURL()}
                              sizes="90vw"
                              draggable={false}
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
                <div className="flex-[3] min-h-0">
                  <Carousel opts={{ loop: false, align: "start", slidesToScroll: 5 }} setApi={setThumbnailApi} className="h-full">
                    <CarouselContent className="-ml-2 pt-1 h-full">
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
                            <Image
                              src={image.url}
                              alt={`${image.category} thumbnail ${image.rank}`}
                              fill
                              className="object-cover"
                              placeholder="blur"
                              blurDataURL={generateBlurDataURL()}
                              sizes="112px"
                              draggable={false}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 text-white hover:text-white bg-black/40 hover:bg-black/80 hover:scale-110 border border-gray-700 transition-all duration-200 disabled:hidden" />
                    <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 text-white hover:text-white bg-black/40 hover:bg-black/80 hover:scale-110 border border-gray-700 transition-all duration-200 disabled:hidden" />
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
