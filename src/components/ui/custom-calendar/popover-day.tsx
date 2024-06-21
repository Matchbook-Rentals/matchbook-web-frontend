import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { Booking } from '@prisma/client';

interface PopoverDayProps {
  day: number;
  booking: Booking;
}

const PopoverDay: React.FC<PopoverDayProps> = ({ day, booking }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primaryBrand';
      case 'finished':
        return 'bg-pinkBrand';
      case 'reserved':
        return 'bg-blueBrand';
      default:
        return '';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={`h-12 flex items-center justify-center border transition  cursor-pointer ${getStatusClass(booking.status)} hover:${getStatusClass(booking.status)}/60`}>
          {day}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div>
          <p><strong>ID:</strong> {booking.id}</p>
          <p><strong>Name:</strong> {booking.userId}</p>
          <p><strong>Start Date:</strong> {booking.startDate.toLocaleDateString()}</p>
          <p><strong>End Date:</strong> {booking.endDate.toLocaleDateString()}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PopoverDay;