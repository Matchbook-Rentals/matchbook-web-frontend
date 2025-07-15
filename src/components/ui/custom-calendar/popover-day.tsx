'use client'
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { Booking, ListingUnavailability } from '@prisma/client';

interface PopoverDayProps {
  day: number;
  booking?: Booking;
  unavailability?: ListingUnavailability;
}

const PopoverDay: React.FC<PopoverDayProps> = ({ day, booking, unavailability }) => {
  const getStatusClass = (booking: Booking | undefined, unavailability: ListingUnavailability | undefined) => {
    if (unavailability) {
      return 'bg-gray-300 hover:bg-gray-500';
    }
    if (booking) {
      switch (booking.status) {
        case 'active':
          return 'bg-primaryBrand/80 hover:bg-primaryBrand/100';
        case 'finished':
          return 'bg-pinkBrand/80 hover:bg-pinkBrand/100';
        case 'reserved':
          return 'bg-blueBrand/80 hover:bg-blueBrand/100';
        default:
          return '';
      }
    }
    return '';
  };

  const bgColor = getStatusClass(booking, unavailability);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={`h-12 test flex items-center justify-center border transition ${bgColor} cursor-pointer`}>
          {day}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        {booking && (
          <div>
            <p><strong>ID:</strong> {booking.id}</p>
            <p><strong>Name:</strong> {booking.userId}</p>
            <p><strong>Start Date:</strong> {booking.startDate.toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {booking.endDate.toLocaleDateString()}</p>
          </div>
        )}
        {unavailability && (
          <div>
            <p><strong>Start Date:</strong> {unavailability.startDate.toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {unavailability.endDate.toLocaleDateString()}</p>
            {unavailability.reason && <p><strong>Reason:</strong> {unavailability.reason}</p>}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default PopoverDay;
