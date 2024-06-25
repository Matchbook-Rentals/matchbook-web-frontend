'use client'
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
        return 'bg-primaryBrand/80 hover:bg-primaryBrand/100';
      case 'finished':
        return 'bg-pinkBrand/80 hover:bg-pinkBrand/100';
      case 'reserved':
        return 'bg-blueBrand/80 hover:bg-blueBrand/100';
      default:
        return '';
    }
  };

  const bgColor = getStatusClass(booking.status);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div onClick={() => alert(bgColor + "/80")} className={`h-12 flex items-center justify-center border transition ${bgColor}  cursor-pointer`}>
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