'use client';
import { Booking } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import { Trash, MoreHorizontal, Calendar, Check, XCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useRouter } from 'next/navigation';

interface BookingCardProps {
  booking: Booking;
  onDelete: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onDelete }) => {
  const router = useRouter();

  // Format date range for display
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  const dateRangeText = booking.startDate && booking.endDate ?
    `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
     ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` :
    'No dates selected';
  
  const durationText = booking.startDate && booking.endDate
    ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
    : '';

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

  // Define border color based on status
  const getBorderColor = () => {
    switch (booking.status) {
      case 'upcoming':
        return 'border-blue-300';
      case 'active':
        return 'border-green-300';
      case 'completed':
        return 'border-gray-300';
      case 'cancelled':
        return 'border-red-300';
      default:
        return 'border-yellow-300';
    }
  };

  return (
    <>
      <div className={`border ${getBorderColor()} rounded-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background`}>
        <div className="flex justify-between items-start w-full md:w-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-gray-900">Booking #{booking.id.substring(0, 8)}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusInfo.className}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{dateRangeText}</p>
            <p className="text-sm text-gray-500">{durationText}</p>
          </div>
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-md h-9 w-9 border border-gray-200"
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
        <div className="flex flex-col items-start md:items-center gap-3 w-full md:w-auto">
          <div className="text-right font-medium">${booking.amount ? (booking.amount / 100).toFixed(2) : '0.00'}</div>
          <div className="flex justify-center gap-2 w-full md:w-auto">
            <Button
              className="bg-blueBrand hover:bg-blueBrand/90 text-white rounded-md px-4 py-2 text-sm font-medium flex-1 md:w-auto"
              onClick={() => router.push(`bookings/${booking.id}`)}
            >
              View Details
            </Button>
            <div className="hidden md:block">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-md h-9 w-9 border border-gray-200"
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
    </>
  )
}

export default BookingCard;