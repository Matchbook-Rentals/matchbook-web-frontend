'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SectionEmptyState } from './section-empty-state';
import { SearchCard } from './search-card';
import { useToast } from '@/components/ui/use-toast';
import { deleteTrip } from '@/app/actions/trips';
import { getLocationDisplay } from '../lib/dashboard-helpers';
import type { DashboardTrip } from '@/app/actions/renter-dashboard';

interface RecentSearchesSectionProps {
  searches: DashboardTrip[];
  defaultOpen?: boolean;
}

export const RecentSearchesSection = ({ searches, defaultOpen = false }: RecentSearchesSectionProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [hiddenSearchIds, setHiddenSearchIds] = useState<Set<string>>(new Set());
  const deleteTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { toast } = useToast();

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      deleteTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleDelete = useCallback((tripId: string) => {
    const trip = searches.find((s) => s.id === tripId);
    if (!trip) return;

    // Hide immediately (optimistic)
    setHiddenSearchIds((prev) => new Set(prev).add(tripId));

    // Schedule permanent deletion after 5 seconds
    const timer = setTimeout(async () => {
      deleteTimers.current.delete(tripId);
      const result = await deleteTrip(tripId);
      if (!result.success) {
        // Restore on failure
        setHiddenSearchIds((prev) => {
          const next = new Set(prev);
          next.delete(tripId);
          return next;
        });
        toast({
          title: 'Error',
          description: 'Failed to delete search',
          variant: 'destructive',
        });
      }
    }, 5000);
    deleteTimers.current.set(tripId, timer);

    const locationName = getLocationDisplay(trip);
    const { dismiss } = toast({
      title: 'Search deleted',
      description: `${locationName} has been removed`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Cancel the permanent delete
            const existingTimer = deleteTimers.current.get(tripId);
            if (existingTimer) {
              clearTimeout(existingTimer);
              deleteTimers.current.delete(tripId);
            }
            // Restore in UI
            setHiddenSearchIds((prev) => {
              const next = new Set(prev);
              next.delete(tripId);
              return next;
            });
            dismiss();
          }}
        >
          Undo
        </Button>
      ),
    });
  }, [searches, toast]);

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

  const visibleSearches = searches.filter((s) => !hiddenSearchIds.has(s.id));

  // Group searches into pairs for mobile
  const mobileSlides = [];
  for (let i = 0; i < visibleSearches.length; i += 2) {
    mobileSlides.push(visibleSearches.slice(i, i + 2));
  }

  const showNavigation = visibleSearches.length > 1;

  return (
    <section className="mb-8 overflow-x-hidden">
      <Accordion type="single" collapsible defaultValue={defaultOpen ? "recent-searches" : undefined}>
        <AccordionItem value="recent-searches" className="border-b-0">
          <AccordionTrigger className="py-1 mb-4 hover:no-underline justify-start gap-1">
            <span className="font-poppins font-semibold text-[#484a54] text-sm">
              Recent Searches
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {visibleSearches.length === 0 ? (
              <SectionEmptyState
                imageSrc="/empty-states/no-searches.png"
                title="No recent searches"
              />
            ) : (
              <div className="max-w-[400px]">
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
                    <CarouselContent className="ml-0">
                      {mobileSlides.map((slideTrips, idx) => (
                        <CarouselItem key={idx} className="pl-0 basis-full">
                          <div className="flex flex-col gap-2">
                            {slideTrips.map((trip) => (
                              <SearchCard key={trip.id} trip={trip} compact onDelete={handleDelete} />
                            ))}
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
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
    </section>
  );
};
