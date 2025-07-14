"use client";

import React, { useState } from 'react';
import { getDaysInMonth, startOfMonth, format, isWithinInterval, isSameDay, parseISO, isAfter, isBefore } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

import { CalendarMonth } from '@/components/ui/custom-calendar/date-range-selector/desktop-schedule-viewer';

interface Booking {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  status?: string;
  guestName?: string;
}

interface UnavailablePeriod {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string;
}

interface CalendarDialogProps {
  bookings?: Booking[];
  unavailablePeriods?: UnavailablePeriod[];
  triggerText?: string;
  triggerClassName?: string;
  listingId?: string;
  showIcon?: boolean;
}

const CalendarDialog: React.FC<CalendarDialogProps> = ({ 
  bookings = [], 
  unavailablePeriods = [], 
  triggerText = "Manage Calendar",
  triggerClassName = "",
  listingId,
  showIcon = true
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleManageCalendar = () => {
    setIsLoading(true);
    // Don't close dialog - let navigation happen directly
  };

  const parsedBookings = bookings.map(b => ({
    ...b,
    startDate: typeof b.startDate === 'string' ? parseISO(b.startDate) : b.startDate,
    endDate: typeof b.endDate === 'string' ? parseISO(b.endDate) : b.endDate,
    platform: b.status === 'off-platform' ? 'other' as const : 'matchbook' as const,
    guestName: b.guestName || 'Guest'
  }));
  
  const parsedUnavailablePeriods = unavailablePeriods.map(u => ({
    ...u,
    startDate: typeof u.startDate === 'string' ? parseISO(u.startDate) : u.startDate,
    endDate: typeof u.endDate === 'string' ? parseISO(u.endDate) : u.endDate,
    reason: u.reason || 'Unavailable'
  }));

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className={`rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] ${triggerClassName}`}
          >
            {showIcon && <CalendarIcon className="h-4 w-4 mr-2" />}
            {triggerText}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-0" hideCloseButton>
          <div className="w-full bg-white rounded-lg">
            {/* Legend (adapted from schedule viewer) */}
            <div className="w-full mx-auto mb-4 p-4 border-b">
              <div className="flex flex-wrap gap-4 text-sm justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondaryBrand rounded-full"></div>
                  <span>MatchBook Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#00A6E8] rounded-full"></div>
                  <span>Off Platform Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#b2aaaa] rounded-full"></div>
                  <span>Unavailable</span>
                </div>
              </div>
            </div>
            
            <CalendarMonth
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
              onPrevMonth={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              onNextMonth={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
              isPrevDisabled={false} // Allow navigation to past months, unlike viewer
              bookings={parsedBookings}
              unavailablePeriods={parsedUnavailablePeriods}
              onMonthChange={(newMonth) => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newMonth);
                setCurrentDate(newDate);
              }}
              onYearChange={(newYear) => {
                const newDate = new Date(currentDate);
                newDate.setFullYear(newYear);
                setCurrentDate(newDate);
              }}
              className="p-6"
              gridClassName="gap-y-2"
              daySpanClassName="text-sm"
              useSelectPortal={false}
            />
            
            {/* Footer with action buttons */}
            <div className="p-4 border-t bg-white flex justify-end gap-3">
              <BrandButton 
                variant="outline" 
                onClick={handleClose}
                className="w-auto px-2"
              >
                Close
              </BrandButton>
              <BrandButton 
                variant="default"
                onClick={handleManageCalendar}
                disabled={isLoading}
                className="w-auto"
                href={listingId ? `/app/host/${listingId}/calendar` : undefined}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Manage Calendar'
                )}
              </BrandButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CalendarDialog;
