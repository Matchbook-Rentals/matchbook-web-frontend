'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SectionEmptyState } from './section-empty-state';
import { formatDateRange, formatOccupants } from '../lib/dashboard-helpers';
import type { DashboardBooking } from '@/app/actions/renter-dashboard';

interface BookingsSectionProps {
  bookings: DashboardBooking[];
}

const PLACEHOLDER_IMAGE = '/stock_interior.webp';

export const BookingsSection = ({ bookings }: BookingsSectionProps) => {
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

  // Group bookings into pairs (showing 2 stacked vertically per slide)
  const bookingSlides = [];
  for (let i = 0; i < bookings.length; i += 2) {
    bookingSlides.push(bookings.slice(i, i + 2));
  }

  const showNavigation = bookings.length > 2;

  return (
    <section className="mb-8 overflow-x-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value="bookings" className="border-b-0">
          <AccordionTrigger className="py-1 mb-4 hover:no-underline justify-start gap-1">
            <span className="font-poppins font-semibold text-[#484a54] text-sm">
              Bookings
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {bookings.length === 0 ? (
              <SectionEmptyState
                imageSrc="/empty-states/no-bookings.png"
                title="No bookings yet"
              />
            ) : (
              <div className="max-w-[600px]">
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
                      {bookingSlides.map((slideBookings, idx) => (
                        <CarouselItem key={idx} className="pl-3 basis-full">
                          <div className="flex flex-col gap-4">
                            {slideBookings.map((booking) => (
                              <Card
                                key={booking.id}
                                className="w-full bg-white rounded-[15px] border-0 shadow-none"
                              >
                                <CardContent className="p-0 h-full">
                                  <div className="flex flex-col sm:flex-row items-stretch h-full overflow-hidden rounded-[15px]">
                                    <div className="relative flex-shrink-0 w-full sm:w-[207px] h-[200px] sm:h-auto overflow-hidden rounded-[15px]">
                                      <Image
                                        src={booking.listing?.listingImages?.[0]?.url || booking.listing?.imageSrc || PLACEHOLDER_IMAGE}
                                        alt={booking.listing?.title || 'Property'}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>

                                    <div className="flex flex-col flex-1 sm:pl-6 sm:pr-3 p-4 sm:p-0 min-w-0 justify-between">
                                      <div className="flex flex-col gap-2 min-w-0">
                                        <h3 className="font-poppins font-medium text-[#373940] text-base truncate">
                                          {booking.listing?.title || 'Untitled Property'}
                                        </h3>
                                        <p className="font-poppins font-normal text-[#777b8b] text-xs">
                                          {formatDateRange(booking.startDate, booking.endDate)}
                                        </p>
                                        <p className="font-poppins font-normal text-[#777b8b] text-xs">
                                          {booking.listing?.locationString || 'Location not available'}
                                        </p>
                                        {booking.trip && (
                                          <p className="font-poppins font-normal text-[#777b8b] text-xs">
                                            {formatOccupants(booking.trip.numAdults, booking.trip.numChildren, booking.trip.numPets)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 pt-2">
                                        <Button
                                          variant="outline"
                                          className="h-[29px] px-3.5 py-2.5 rounded-lg border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787]/10 font-poppins font-semibold text-[11px]"
                                          asChild
                                        >
                                          <Link href={`/rent/bookings/${booking.id}`}>View Details</Link>
                                        </Button>
                                        {booking.listingId && (
                                          <Button
                                            className="h-[29px] px-3.5 py-2.5 rounded-lg bg-[#3c8787] hover:bg-[#3c8787]/90 text-white font-poppins font-semibold text-[11px]"
                                            asChild
                                          >
                                            <Link href={`/app/rent/messages?listingId=${booking.listingId}`}>Message Host</Link>
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
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
                        <span className="sr-only">Previous bookings</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => api?.scrollNext()}
                        disabled={!canScrollNext}
                        className="h-6 w-6 rounded-md border border-[#3c8787] bg-background text-[#3c8787] hover:bg-[#3c8787] hover:text-white disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-[#3c8787] transition-all duration-300 p-0"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="sr-only">Next bookings</span>
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
