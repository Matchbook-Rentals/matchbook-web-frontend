'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import HomepageListingCard from '@/components/home-components/homepage-listing-card';
import { SectionEmptyState } from './section-empty-state';
import { useToast } from '@/components/ui/use-toast';
import { optimisticRemoveFavorite, optimisticFavorite } from '@/app/actions/favorites';
import type { DashboardFavorite } from '@/app/actions/renter-dashboard';

interface FavoritesSectionProps {
  favorites: DashboardFavorite[];
  defaultOpen?: boolean;
}

export const FavoritesSection = ({ favorites: initialFavorites, defaultOpen = false }: FavoritesSectionProps) => {
  const [allFavorites, setAllFavorites] = useState<DashboardFavorite[]>(initialFavorites);
  const [hiddenFavoriteIds, setHiddenFavoriteIds] = useState<Set<string>>(new Set());
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [cardsPerSlide, setCardsPerSlide] = useState(2);
  const { toast } = useToast();

  // Filter out hidden favorites (for optimistic UI after unlike)
  const visibleFavorites = allFavorites.filter((fav) => !hiddenFavoriteIds.has(fav.id));

  // Transform favorites to listing format for HomepageListingCard
  const favoriteListings = visibleFavorites
    .filter((fav) => fav.listing !== null)
    .map((fav) => ({
      ...fav.listing,
      listingImages: fav.listing?.listingImages?.map((img) => ({
        ...img,
        listingId: fav.listingId,
        category: null,
        rank: 0,
        createdAt: new Date(),
      })) || [],
    }));

  // Handle unlike with undo toast
  const handleUnlike = useCallback(async (listingId: string) => {
    const favorite = allFavorites.find((fav) => fav.listingId === listingId);
    if (!favorite) return;

    // Optimistic UI - hide the favorite immediately
    setHiddenFavoriteIds((prev) => new Set(prev).add(favorite.id));

    // Remove from database
    const result = await optimisticRemoveFavorite(favorite.tripId, listingId);

    if (!result.success) {
      // If failed, show error and restore the favorite
      setHiddenFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(favorite.id);
        return next;
      });
      toast({
        title: 'Error',
        description: 'Failed to remove favorite',
        variant: 'destructive',
      });
      return;
    }

    // Show success toast with undo option
    const listingTitle = favorite.listing?.title || 'Listing';
    const { dismiss } = toast({
      title: 'Removed from favorites',
      description: `${listingTitle} has been removed from your favorites`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            // Restore the favorite
            setHiddenFavoriteIds((prev) => {
              const next = new Set(prev);
              next.delete(favorite.id);
              return next;
            });

            // Re-add to database
            const undoResult = await optimisticFavorite(favorite.tripId, listingId);

            if (!undoResult.success) {
              toast({
                title: 'Error',
                description: 'Failed to undo. Please try adding the favorite again.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Restored',
                description: `${listingTitle} has been added back to your favorites`,
              });
            }

            dismiss();
          }}
        >
          Undo
        </Button>
      ),
    });
  }, [allFavorites, toast]);

  // Determine cards per slide based on screen size
  useEffect(() => {
    const updateCardsPerSlide = () => {
      const width = window.innerWidth;
      if (width >= 1024) setCardsPerSlide(5);
      else if (width >= 768) setCardsPerSlide(4);
      else if (width >= 640) setCardsPerSlide(3);
      else setCardsPerSlide(2);
    };

    updateCardsPerSlide();
    window.addEventListener('resize', updateCardsPerSlide);
    return () => window.removeEventListener('resize', updateCardsPerSlide);
  }, []);

  useEffect(() => {
    if (!api) return;

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());

    api.on('select', () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });

    api.on('reInit', () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });
  }, [api]);

  // Group favorites into slides based on screen size
  const favoriteSlides = [];
  for (let i = 0; i < visibleFavorites.length; i += cardsPerSlide) {
    favoriteSlides.push(visibleFavorites.slice(i, i + cardsPerSlide));
  }

  const showNavigation = visibleFavorites.length > cardsPerSlide;

  return (
    <section className="mb-8 overflow-x-hidden">
      <Accordion type="single" collapsible defaultValue={defaultOpen ? "favorites" : undefined}>
        <AccordionItem value="favorites" className="border-b-0">
          <AccordionTrigger className="py-1 mb-4 hover:no-underline justify-start gap-1">
            <span className="font-poppins font-semibold text-[#484a54] text-sm">
              Favorites
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {visibleFavorites.length === 0 ? (
              <SectionEmptyState
                imageSrc="/empty-states/no-favorites.png"
                title="No favorites yet"
              />
            ) : (
              <>
                <Carousel
                  setApi={setApi}
                  opts={{
                    align: 'start',
                    loop: false,
                    slidesToScroll: 1,
                  }}
                  className="w-full"
                  keyboardControls={false}
                >
                  <CarouselContent className="-ml-6">
                    {favoriteSlides.map((slideFavorites, idx) => (
                      <CarouselItem key={idx} className="pl-6 basis-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                          {slideFavorites.map((fav, favIdx) => {
                            const globalIndex = idx * cardsPerSlide + favIdx;
                            return (
                              <HomepageListingCard
                                key={fav.id}
                                listing={favoriteListings[globalIndex] as any}
                                badge="liked"
                                tripId={fav.tripId}
                                isApplied={fav.isApplied}
                                initialFavorited={true}
                                onUnlike={handleUnlike}
                                isSignedIn={true}
                              />
                            );
                          })}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                {showNavigation && (
                  <div className="flex items-center gap-1 mt-4 ml-[2px]">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => api?.scrollPrev()}
                      disabled={!canScrollPrev}
                      className="h-6 w-6 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span className="sr-only">Previous favorites</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => api?.scrollNext()}
                      disabled={!canScrollNext}
                      className="h-6 w-6 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      <span className="sr-only">Next favorites</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
};
