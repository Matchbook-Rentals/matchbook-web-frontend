import React, { useState } from 'react';
import Header from './calendar-header';
import ColumnHeaders from './column-headers';
import DayGrid from './day-grid';
import { Booking } from '@prisma/client';

interface DisplayCalendarProps {
  bookings: Booking[];
}

const DisplayCalendar: React.FC<DisplayCalendarProps> = ({ bookings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="w-[95%] mx-auto border-2 border-gray-300 p-1 shadow-lg rounded-lg overflow-hidden">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <ColumnHeaders />
      <DayGrid currentDate={currentDate} bookings={bookings} />
    </div>
  );
};

export default DisplayCalendar;
