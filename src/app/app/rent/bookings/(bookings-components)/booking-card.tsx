'use client';
import { Booking } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import { Trash, MoreHorizontal, Calendar, Check, XCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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

interface BookingCardProps {
  booking: BookingWithRelations;
  onDelete: (bookingId: string) => void;
  headerText?: string;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onDelete, headerText }) => {
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

  // Get status information
  const getStatusInfo = () => {
    switch (booking.status) {
      case 'upcoming':
        return {
          label: 'Upcoming',
          icon: <Calendar className="h-4 w-4 mr-1" />,
          className: 'bg-blue-100 text-blue-800'
        };
      case 'active':
        return {
          label: 'Active',
          icon: <Clock className="h-4 w-4 mr-1" />,
          className: 'bg-green-100 text-green-800'
        };
      case 'completed':
        return {
          label: 'Past',
          icon: <Check className="h-4 w-4 mr-1" />,
          className: 'bg-gray-100 text-gray-800'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-4 w-4 mr-1" />,
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          label: 'Pending',
          icon: <Clock className="h-4 w-4 mr-1" />,
          className: 'bg-yellow-100 text-yellow-800'
        };
    }
  };

  const statusInfo = getStatusInfo();


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

  // Get listing title
  const listingTitle = booking.listing?.title || 'Unnamed Property';

  // Calculate days left if it's an active booking
  const daysLeft = booking.status === 'active' && booking.endDate ?
    Math.ceil((new Date(booking.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
  return (
    <>
      <div className="border border-blueBrand rounded-md overflow-hidden shadow-md">
        {headerText && (
          <div className="px-4 py-2">
            <p className="text-gray-500 font-medium">{headerText}</p>
          </div>
        )}
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
            <div className="md:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-md h-10 w-10 border border-gray-200"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-1">
                  <Button
                    variant="ghost"
                    className="w-full text-left flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(booking.id);
                    }}
                  >
                   <Trash className="h-4 w-4" /> Delete booking
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
            <div className="text-right font-medium">{priceDisplay}</div>
            <div className="flex justify-center gap-2 w-full md:w-auto">
              <Button
                className="bg-blueBrand hover:bg-blueBrand/90 text-white rounded-md px-4 py-2 text-sm font-medium flex-1 md:w-auto"
                onClick={() => router.push(`bookings/${booking.id}`)}
              >
                View Details
              </Button>
              <Button
                className="bg-blueBrand hover:bg-blueBrand/90 text-white rounded-md px-4 py-2 text-sm font-medium flex-1 md:w-auto"
                onClick={() => {}}
              >
                Payment
              </Button>
              <div className="hidden md:block">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-md h-10 w-10 border border-gray-200"
                    >
                      <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-1">
                    <Button
                      variant="ghost"
                      className="w-full text-left flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(booking.id);
                      }}
                    >
                     <Trash className="h-4 w-4" /> Delete booking
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </>
  )
}

export default BookingCard;
