import React from 'react';
import { Booking } from '@prisma/client';
import Day from './day';
import PopoverDay from './popover-day';

interface DayGridProps {
  currentDate: Date;
  bookings: Booking[];
}

const DayGrid: React.FC<DayGridProps> = ({ currentDate, bookings }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isDateInRange = (date: Date, bookings: Booking[]) => {
    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const normalizedDate = normalizeDate(date);

    for (const booking of bookings) {
      const startDate = normalizeDate(new Date(booking.startDate));
      const endDate = normalizeDate(new Date(booking.endDate));
      if (normalizedDate >= startDate && normalizedDate <= endDate) {
        console.log('date in range', normalizedDate, startDate, endDate);
        return booking;
      }
    }
    console.log('date not in range', normalizedDate, bookings);
    return null;
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const booking = isDateInRange(date, bookings);
    if (booking) {
      days.push(<PopoverDay key={day} day={day} booking={booking} />);
    } else {
      days.push(<Day key={day} day={day} />);
    }
  }
  return <div onClick={() => console.log(days)} className="grid grid-cols-7 gap-1 p-2">{days}</div>;
};

export default DayGrid;
