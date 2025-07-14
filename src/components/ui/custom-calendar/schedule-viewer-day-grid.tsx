import React from 'react';
import { Booking, ListingUnavailability } from '@prisma/client';
import Day from './day';
import ScheduleViewerPopoverDay from './schedule-viewer-popover-day';

interface ScheduleViewerDayGridProps {
  currentDate: Date;
  bookings: Booking[];
  unavailablePeriods: ListingUnavailability[];
  onDeleteUnavailability?: (unavailabilityId: string) => void;
  onEditUnavailability?: (unavailability: ListingUnavailability) => void;
}

const ScheduleViewerDayGrid: React.FC<ScheduleViewerDayGridProps> = ({ currentDate, bookings=[], unavailablePeriods=[], onDeleteUnavailability, onEditUnavailability }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper function to normalize date by setting time to midnight
  const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // Check if a date is in range of bookings
  const isBookingDateInRange = (date: Date, bookings: Booking[]): Booking | null => {
    const normalizedDate = normalizeDate(date);
    for (const booking of bookings) {
      const startDate = normalizeDate(new Date(booking.startDate));
      const endDate = normalizeDate(new Date(booking.endDate));
      if (normalizedDate >= startDate && normalizedDate <= endDate) {
        return booking;
      }
    }
    return null;
  };

  // Check if a date is in range of unavailability periods
  const isUnavailabilityDateInRange = (date: Date, unavailablePeriods: ListingUnavailability[]): ListingUnavailability | null => {
    const normalizedDate = normalizeDate(date);
    for (const period of unavailablePeriods) {
      const startDate = normalizeDate(new Date(period.startDate));
      const endDate = normalizeDate(new Date(period.endDate));
      if (normalizedDate >= startDate && normalizedDate <= endDate) {
        return period;
      }
    }
    return null;
  };

  // Generate the days for the grid
  const days = [];
  
  // Empty slots for days before the 1st of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12" />);
  }

  // Loop through the days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);

    // Check for a booking on this day
    const booking = isBookingDateInRange(date, bookings);

    // If no booking, check for unavailability
    const unavailability = booking ? null : isUnavailabilityDateInRange(date, unavailablePeriods);

    // Render appropriate day component based on booking/unavailability status
    if (booking) {
      // If there's a booking, show ScheduleViewerPopoverDay with booking details
      days.push(<ScheduleViewerPopoverDay key={day} day={day} booking={booking} />);
    } else if (unavailability) {
      // If there's unavailability, show ScheduleViewerPopoverDay with unavailability details
      days.push(<ScheduleViewerPopoverDay key={day} day={day} unavailability={unavailability} onDeleteUnavailability={onDeleteUnavailability} onEditUnavailability={onEditUnavailability} />);
    } else {
      // If neither, show a regular Day
      days.push(<Day key={day} day={day} />);
    }
  }

  // Render the grid of days
  return <div className="grid grid-cols-7 gap-1 p-2">{days}</div>;
};

export default ScheduleViewerDayGrid;