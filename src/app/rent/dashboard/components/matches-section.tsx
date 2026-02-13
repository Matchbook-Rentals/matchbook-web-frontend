'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import type { DashboardMatch } from '@/app/actions/renter-dashboard';

interface MatchesSectionProps {
  matches: DashboardMatch[];
}

export const MatchesSection = ({ matches }: MatchesSectionProps) => {
  const router = useRouter();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [cardsPerSlide, setCardsPerSlide] = useState(2);

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

  const handleBookNow = (matchId: string) => {
    router.push(`/app/rent/match/${matchId}/lease-signing`);
  };

  // Transform matches to listing format for HomepageListingCard
  const matchListings = matches.map((match) => ({
    ...match.listing,
    listingImages: match.listing.listingImages.map((img) => ({
      ...img,
      listingId: match.listingId,
      category: null,
      rank: 0,
      createdAt: new Date(),
    })),
  }));

  // Group matches into slides based on screen size
  const matchSlides = [];
  for (let i = 0; i < matches.length; i += cardsPerSlide) {
    matchSlides.push(matches.slice(i, i + cardsPerSlide));
  }

  const showNavigation = matches.length > cardsPerSlide;

  return (
    <section className="mb-8 overflow-x-hidden">
      <Accordion type="single" collapsible defaultValue="matches">
        <AccordionItem value="matches" className="border-b-0">
          <AccordionTrigger className="py-1 mb-4 hover:no-underline justify-start gap-1">
            <span className="font-poppins font-semibold text-[#484a54] text-sm">
              Your Matches
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {matches.length === 0 ? (
              <SectionEmptyState
                imageSrc="/empty-states/no-matches.png"
                title="No matches yet"
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
                    {matchSlides.map((slideMatches, idx) => (
                      <CarouselItem key={idx} className="pl-6 basis-full">
                        <div className="flex flex-wrap gap-6">
                          {slideMatches.map((match, matchIdx) => {
                            const globalIndex = idx * cardsPerSlide + matchIdx;
                            return (
                              <HomepageListingCard
                                key={match.id}
                                listing={matchListings[globalIndex] as any}
                                badge="matched"
                                matchId={match.id}
                                tripId={match.tripId}
                                onBookNow={handleBookNow}
                                initialFavorited={true}
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
                      <span className="sr-only">Previous matches</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => api?.scrollNext()}
                      disabled={!canScrollNext}
                      className="h-6 w-6 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      <span className="sr-only">Next matches</span>
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
