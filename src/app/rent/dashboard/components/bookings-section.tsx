'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SectionEmptyState } from './section-empty-state';
import { formatDateRange, formatOccupants } from '../lib/dashboard-helpers';
import type { DashboardBooking } from '@/app/actions/renter-dashboard';

interface BookingsSectionProps {
  bookings: DashboardBooking[];
}

const PLACEHOLDER_IMAGE = '/stock_interior.webp';

export const BookingsSection = ({ bookings }: BookingsSectionProps) => {
  const [showPast, setShowPast] = useState(false);

  const now = Date.now();
  const upcomingBookings = bookings.filter((b) => new Date(b.endDate).getTime() >= now);
  const pastBookings = bookings.filter((b) => new Date(b.endDate).getTime() < now);
  const visibleBookings = showPast ? [...upcomingBookings, ...pastBookings] : upcomingBookings;

  return (
    <section className="mb-8">
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
                <div className="flex flex-col gap-4">
                  {visibleBookings.map((booking) => (
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

                {pastBookings.length > 0 && (
                  <div className="mt-4">
                    <BrandButton
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPast((prev) => !prev)}
                    >
                      {showPast ? 'Show Less' : 'Show More'}
                    </BrandButton>
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
