"use client";

import React, { useState } from 'react';
import { getDaysInMonth, startOfMonth, format, isWithinInterval, isSameDay, parseISO, isAfter, isBefore } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  status?: string;
  guestName?: string;
}

interface Unavailability {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string;
}

interface CalendarDialogProps {
  bookings?: Booking[];
  unavailabilities?: Unavailability[];
  triggerText?: string;
  triggerClassName?: string;
  listingId?: string;
}

const CalendarHeader = ({ currentDate, setCurrentDate }: { currentDate: Date; setCurrentDate: (date: Date) => void }) => {
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="flex justify-between items-center py-2 px-4 border-b">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrevMonth}
        className="text-gray-700 font-semibold hover:text-gray-900"
      >
        Prev
      </Button>
      <h2 className="text-lg font-semibold">{`${month} ${year}`}</h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNextMonth}
        className="text-gray-700 font-semibold hover:text-gray-900"
      >
        Next
      </Button>
    </div>
  );
};

const ColumnHeaders = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const shortDaysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="grid grid-cols-7 py-2">
      {daysOfWeek.map((day, index) => (
        <div key={day} className="text-center font-semibold text-sm">
          <span className="hidden md:inline">{day}</span>
          <span className="md:hidden">{shortDaysOfWeek[index]}</span>
        </div>
      ))}
    </div>
  );
};

const CalendarDays = ({ 
  currentDate, 
  bookings = [], 
  unavailabilities = [] 
}: { 
  currentDate: Date; 
  bookings: Booking[]; 
  unavailabilities: Unavailability[];
}) => {
  const daysInMonth = getDaysInMonth(currentDate);
  const startDate = startOfMonth(currentDate);
  const startDayOfWeek = startDate.getDay();

  // Helper function to convert string dates to Date objects
  const parseDate = (date: Date | string): Date => {
    return typeof date === 'string' ? parseISO(date) : date;
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    
    // Check if date is in any booking period and get booking info
    const currentBooking = bookings.find(booking => {
      const bookingStart = parseDate(booking.startDate);
      const bookingEnd = parseDate(booking.endDate);
      return isWithinInterval(date, { start: bookingStart, end: bookingEnd }) || 
             isSameDay(date, bookingStart) || 
             isSameDay(date, bookingEnd);
    });

    // Check if date is in any unavailability period and get unavailability info
    const currentUnavailability = unavailabilities.find(unavail => {
      const unavailStart = parseDate(unavail.startDate);
      const unavailEnd = parseDate(unavail.endDate);
      return isWithinInterval(date, { start: unavailStart, end: unavailEnd }) || 
             isSameDay(date, unavailStart) || 
             isSameDay(date, unavailEnd);
    });

    // Base styling
    let className = "p-2 text-center text-sm min-h-8 md:min-h-12 flex items-center justify-center";
    
    // Apply styling based on status
    if (currentBooking) {
      className += " bg-blueBrand text-white font-medium opacity-60 hover:opacity-100 transition-opacity";
    } else if (currentUnavailability) {
      className += " bg-gray-300 text-gray-600 opacity-60 hover:opacity-100 transition-opacity";
    } else {
      className += " hover:bg-gray-100";
    }

    const dayContent = (
      <div className={className}>
        {i + 1}
      </div>
    );

    // Wrap with tooltip if there's booking or unavailability info
    if (currentBooking || currentUnavailability) {
      let tooltipContent = '';
      
      if (currentBooking) {
        const startDate = format(parseDate(currentBooking.startDate), 'MMM d');
        const endDate = format(parseDate(currentBooking.endDate), 'MMM d, yyyy');
        tooltipContent = `Guest: ${currentBooking.guestName || 'Unknown Guest'}\n${startDate} - ${endDate}`;
      } else if (currentUnavailability) {
        const startDate = format(parseDate(currentUnavailability.startDate), 'MMM d');
        const endDate = format(parseDate(currentUnavailability.endDate), 'MMM d, yyyy');
        tooltipContent = `Unavailable: ${currentUnavailability.reason || 'No reason provided'}\n${startDate} - ${endDate}`;
      }

      return (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            {dayContent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="whitespace-pre-line">
              {tooltipContent}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={i}>{dayContent}</div>;
  });

  // Add blank cells for days before the start of the month
  const blanks = Array(startDayOfWeek).fill(null).map((_, i) => (
    <div key={`blank-${i}`} className="p-2 min-h-8 md:min-h-12"></div>
  ));

  return (
    <div className="grid grid-cols-7 p-2">
      {blanks}
      {days}
    </div>
  );
};

const CalendarLegend = () => {
  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blueBrand rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-gray-300 rounded"></div>
          <span>Available</span>
        </div>
      </div>
    </div>
  );
};

const CalendarDialog: React.FC<CalendarDialogProps> = ({ 
  bookings = [], 
  unavailabilities = [], 
  triggerText = "Manage Calendar",
  triggerClassName = "",
  listingId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const router = useRouter();


  const handleClose = () => {
    setOpen(false);
  };

  const handleManageCalendar = () => {
    setOpen(false);
    if (listingId) {
      router.push(`/app/host/${listingId}`);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className={`rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] ${triggerClassName}`}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {triggerText}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-0" hideCloseButton>
          <div className="w-full bg-white rounded-lg">
            <CalendarHeader currentDate={currentDate} setCurrentDate={setCurrentDate} />
            <ColumnHeaders />
            <CalendarDays 
              currentDate={currentDate} 
              bookings={bookings}
              unavailabilities={unavailabilities}
            />
            <CalendarLegend />
            
            {/* Footer with action buttons */}
            <div className="p-4 border-t bg-white flex flex-col sm:flex-row justify-between gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={handleManageCalendar}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Manage Calendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CalendarDialog;
