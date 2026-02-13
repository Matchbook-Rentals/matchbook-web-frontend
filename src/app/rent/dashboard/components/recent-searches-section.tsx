'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { SectionEmptyState } from './section-empty-state';
import { SectionHeader } from './section-header';
import { SearchCard } from './search-card';
import type { DashboardTrip } from '@/app/actions/renter-dashboard';

interface RecentSearchesSectionProps {
  searches: DashboardTrip[];
}

export const RecentSearchesSection = ({ searches }: RecentSearchesSectionProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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

  if (searches.length === 0) return (
    <section className="mb-8">
      <SectionHeader title="Recent Searches" />
      <SectionEmptyState
        imageSrc="/empty-states/no-searches.png"
        title="No recent searches"
      />
    </section>
  );

  // Group searches into pairs for mobile
  const mobileSlides = [];
  for (let i = 0; i < searches.length; i += 2) {
    mobileSlides.push(searches.slice(i, i + 2));
  }

  return (
    <section className="mb-8 overflow-x-hidden">
      <div className="max-w-[400px]">
        <SectionHeader 
          title="Recent Searches"
          inlineActions
          actions={
            searches.length > 1 ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => api?.scrollPrev()}
                  disabled={!canScrollPrev}
                  className="h-6 w-6 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="sr-only">Previous searches</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => api?.scrollNext()}
                  disabled={!canScrollNext}
                  className="h-6 w-6 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">Next searches</span>
                </Button>
              </div>
            ) : undefined
          }
        />

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
          <CarouselContent className="-ml-3">
            {mobileSlides.map((slideTrips, idx) => (
              <CarouselItem key={idx} className="pl-3 basis-full">
                <div className="flex flex-col gap-2">
                  {slideTrips.map((trip) => (
                    <SearchCard key={trip.id} trip={trip} compact />
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};
