import React, { useState } from 'react';
import Header from './calendar-header';
import ColumnHeaders from './column-headers';
import DayGrid from './day-grid';
import { Booking, ListingUnavailability } from '@prisma/client';
import { Button } from '../button';

interface DisplayCalendarProps {
  bookings: Booking[];
  unavailablePeriods: ListingUnavailability[]
}

const DisplayCalendar: React.FC<DisplayCalendarProps> = ({ bookings, unavailablePeriods }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="w-[95%] max-w-[800px]  mx-auto border-2 border-gray-300 p-1 shadow-lg rounded-lg overflow-hidden">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <ColumnHeaders />
      <DayGrid currentDate={currentDate} bookings={bookings} unavailablePeriods={unavailablePeriods}  />
    </div>
  );
};

export default DisplayCalendar;
