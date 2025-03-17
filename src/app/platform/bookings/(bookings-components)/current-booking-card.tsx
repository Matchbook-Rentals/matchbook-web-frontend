'use client';
import { Booking } from '@prisma/client';
import React from 'react';
import { CalendarDays, Bookmark, MapPin, Clock, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

// Extended booking type with included relations
type BookingWithRelations = Booking & {
  listing?: {
    title: string;
    imageSrc?: string;
  };
  trip?: {
    numAdults: number;
    numPets: number;
    numChildren: number;
  };
};

interface CurrentBookingCardProps {
  booking: BookingWithRelations;
}

const CurrentBookingCard: React.FC<CurrentBookingCardProps> = ({ booking }) => {
  const router = useRouter();

  // Format date range for display
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  const dateRangeText = booking.startDate && booking.endDate ?
    `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
     ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` :
    'No dates selected';
  
  const daysCount = booking.startDate && booking.endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
    
  const dateDisplayText = booking.startDate && booking.endDate
    ? `${dateRangeText} (${daysCount} days)`
    : dateRangeText;
    
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Get listing title
  const listingTitle = booking.listing?.title || 'Unnamed Property';
  
  // Format guest count
  const getTotalGuests = () => {
    if (!booking.trip) return '';
    const { numAdults, numChildren, numPets } = booking.trip;
    
    let guestText = '';
    if (numAdults > 0) {
      guestText += `${numAdults} adult${numAdults !== 1 ? 's' : ''}`;
    }
    
    if (numChildren > 0) {
      if (guestText) guestText += ', ';
      guestText += `${numChildren} child${numChildren !== 1 ? 'ren' : ''}`;
    }
    
    if (numPets > 0) {
      if (guestText) guestText += ', ';
      guestText += `${numPets} pet${numPets !== 1 ? 's' : ''}`;
    }
    
    return guestText;
  };
  
  // Calculate price display
  const priceDisplay = booking.totalPrice 
    ? `$${(booking.totalPrice / 100).toFixed(2)}` 
    : booking.monthlyRent 
      ? `$${(booking.monthlyRent / 100).toFixed(2)}/mo` 
      : '$0.00';

  return (
    <div className="border border-blueBrand rounded-md overflow-hidden shadow-md">
      <div className=" px-4 py-2 ">
        <p className="text-gray-500 font-medium">Current Booking</p>
      </div>
      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background">
        <div className="flex justify-between items-start w-full md:w-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-gray-900">{listingTitle}</h2>
            </div>
            <p className="text-sm text-gray-600">{dateDisplayText}</p>
            {booking.trip && (
              <p className="text-sm text-gray-500">{getTotalGuests()}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start md:items-center gap-3 w-full md:w-auto">
          <div className="text-right font-medium">{priceDisplay}</div>
          <div className="flex justify-center gap-2 w-full md:w-auto">
            <Button
              className="bg-blueBrand hover:bg-blueBrand/90 text-white rounded-md px-4 py-2 text-sm font-medium flex-1 md:w-auto"
              onClick={() => router.push(`bookings/${booking.id}`)}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="bg-gray-100 h-4 w-full">
        <div 
          className="bg-blueBrand h-full transition-all duration-500 ease-in-out"
          style={{ width: `${Math.min(100, Math.max(0, 100 - (daysLeft / 30) * 100))}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CurrentBookingCard;
