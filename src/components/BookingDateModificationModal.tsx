'use client';

import React, { useState } from 'react';
import { CalendarIcon, XIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { BrandButton } from '@/components/ui/brandButton';
import BrandModal from '@/components/BrandModal';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { createBookingModification } from '@/app/actions/booking-modifications';
import { toast } from 'sonner';

interface BookingData {
  id: string
  startDate: Date
  endDate: Date
  listing?: {
    title: string
  }
}

interface BookingDateModificationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingData
  recipientId: string
}


export default function BookingDateModificationModal({
  isOpen,
  onOpenChange,
  booking,
  recipientId
}: BookingDateModificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    startDate: booking.startDate || null,
    endDate: booking.endDate || null
  })

  // Calendar state for start date
  const [startCalendarMonth, setStartCalendarMonth] = useState(booking.startDate?.getMonth() || new Date().getMonth())
  const [startCalendarYear, setStartCalendarYear] = useState(booking.startDate?.getFullYear() || new Date().getFullYear())
  const [startCalendarOpen, setStartCalendarOpen] = useState(false)
  
  // Calendar state for end date
  const [endCalendarMonth, setEndCalendarMonth] = useState(booking.endDate?.getMonth() || new Date().getMonth())
  const [endCalendarYear, setEndCalendarYear] = useState(booking.endDate?.getFullYear() || new Date().getFullYear())
  const [endCalendarOpen, setEndCalendarOpen] = useState(false)
  
  // Generate month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const resetForm = () => {
    setFormData({
      startDate: booking.startDate || null,
      endDate: booking.endDate || null
    })
  }

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, startDate: date }))
      setStartCalendarOpen(false)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, endDate: date }))
      setEndCalendarOpen(false)
    }
  }

  const goToPreviousMonthStart = () => {
    if (startCalendarMonth === 0) {
      setStartCalendarMonth(11)
      setStartCalendarYear(startCalendarYear - 1)
    } else {
      setStartCalendarMonth(startCalendarMonth - 1)
    }
  }

  const goToNextMonthStart = () => {
    if (startCalendarMonth === 11) {
      setStartCalendarMonth(0)
      setStartCalendarYear(startCalendarYear + 1)
    } else {
      setStartCalendarMonth(startCalendarMonth + 1)
    }
  }

  const goToPreviousMonthEnd = () => {
    if (endCalendarMonth === 0) {
      setEndCalendarMonth(11)
      setEndCalendarYear(endCalendarYear - 1)
    } else {
      setEndCalendarMonth(endCalendarMonth - 1)
    }
  }

  const goToNextMonthEnd = () => {
    if (endCalendarMonth === 11) {
      setEndCalendarMonth(0)
      setEndCalendarYear(endCalendarYear + 1)
    } else {
      setEndCalendarMonth(endCalendarMonth + 1)
    }
  }

  const formatStartDate = () => {
    return formData.startDate ? format(formData.startDate, 'MMM d, yyyy') : 'Select start date'
  }

  const formatEndDate = () => {
    return formData.endDate ? format(formData.endDate, 'MMM d, yyyy') : 'Select end date'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.startDate) {
      toast.error('Start date is required')
      return
    }

    if (!formData.endDate) {
      toast.error('End date is required')
      return
    }

    const newStartDate = new Date(formData.startDate.getFullYear(), formData.startDate.getMonth(), formData.startDate.getDate(), 12, 0, 0)
    const newEndDate = new Date(formData.endDate.getFullYear(), formData.endDate.getMonth(), formData.endDate.getDate(), 12, 0, 0)

    if (newStartDate >= newEndDate) {
      toast.error('End date must be after start date')
      return
    }

    setIsSubmitting(true)

    try {
      await createBookingModification({
        bookingId: booking.id,
        newStartDate,
        newEndDate,
        recipientId
      })

      toast.success('Booking date modification request sent successfully')
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error creating booking modification:', error)
      toast.error('Failed to create booking modification request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  const hasChanges = 
    formData.startDate?.getTime() !== booking.startDate?.getTime() ||
    formData.endDate?.getTime() !== booking.endDate?.getTime()


  const modalContent = (
    <div className="flex flex-col items-center gap-6 p-6 relative bg-white rounded-xl overflow-visible">
      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-900 text-xl text-center tracking-[0] leading-[normal]">
          Request change to booking dates
        </div>

        <BrandButton
          variant="ghost"
          size="icon"
          className="relative w-6 h-6 p-0 hover:bg-transparent"
          onClick={handleClose}
        >
          <XIcon className="w-6 h-6" />
        </BrandButton>
      </div>

      <div className="flex flex-col items-start justify-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
          All changes must be approved by the renter/host before they take effect.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {/* Start Date Field */}
            <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
              <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                New Start Date
              </Label>
              
              <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <div className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] flex relative shadow-shadows-shadow-xs cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-2 relative flex-1 grow">
                      <Input
                        value={formatStartDate()}
                        className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#667085] text-base tracking-[0] leading-[normal] border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer"
                        readOnly
                      />
                      <div className="relative w-6 h-6">
                        <CalendarIcon className="absolute w-5 h-5 top-px left-0" />
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-[350px] p-3 z-[1100]" align="start" sideOffset={5}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <BrandButton
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousMonthStart}
                        className="h-8 min-w-[50px] max-w-[50px] p-0 border-[#0b6969] text-[#0b6969] hover:bg-[#0b6969] hover:text-white"
                        type="button"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </BrandButton>
                      
                      <div className="font-medium text-gray-900 text-center">
                        {months[startCalendarMonth]} {startCalendarYear}
                      </div>
                      
                      <BrandButton
                        variant="outline"
                        size="sm"
                        onClick={goToNextMonthStart}
                        className="h-8 min-w-[50px] max-w-[50px] p-0 border-[#0b6969] text-[#0b6969] hover:bg-[#0b6969] hover:text-white"
                        type="button"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </BrandButton>
                    </div>
                    
                    <Calendar
                      mode="single"
                      month={new Date(startCalendarYear, startCalendarMonth)}
                      onMonthChange={(date) => {
                        setStartCalendarMonth(date.getMonth());
                        setStartCalendarYear(date.getFullYear());
                      }}
                      selected={formData.startDate || undefined}
                      onSelect={handleStartDateSelect}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                      classNames={{
                        day_selected: "bg-[#0b6969] text-primary-foreground hover:bg-[#0b6969] hover:text-primary-foreground focus:bg-[#0b6969] focus:text-primary-foreground",
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                        month: "space-y-4 w-full",
                        caption: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full justify-around",
                        head_cell: "text-muted-foreground rounded-md w-9 text-center font-normal text-[0.8rem]",
                        row: "flex w-full mt-2 justify-around",
                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Field */}
            <div className="flex-col items-start gap-1.5 flex-1 grow flex relative">
              <Label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
                New End Date
              </Label>
              
              <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <div className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] flex relative shadow-shadows-shadow-xs cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-2 relative flex-1 grow">
                      <Input
                        value={formatEndDate()}
                        className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#667085] text-base tracking-[0] leading-[normal] border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer"
                        readOnly
                      />
                      <div className="relative w-6 h-6">
                        <CalendarIcon className="absolute w-5 h-5 top-px left-0" />
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-[350px] p-3 z-[1100]" align="start" sideOffset={5}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <BrandButton
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousMonthEnd}
                        className="h-8 min-w-[50px] max-w-[50px] p-0 border-[#0b6969] text-[#0b6969] hover:bg-[#0b6969] hover:text-white"
                        type="button"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </BrandButton>
                      
                      <div className="font-medium text-gray-900 text-center">
                        {months[endCalendarMonth]} {endCalendarYear}
                      </div>
                      
                      <BrandButton
                        variant="outline"
                        size="sm"
                        onClick={goToNextMonthEnd}
                        className="h-8 min-w-[50px] max-w-[50px] p-0 border-[#0b6969] text-[#0b6969] hover:bg-[#0b6969] hover:text-white"
                        type="button"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </BrandButton>
                    </div>
                    
                    <Calendar
                      mode="single"
                      month={new Date(endCalendarYear, endCalendarMonth)}
                      onMonthChange={(date) => {
                        setEndCalendarMonth(date.getMonth());
                        setEndCalendarYear(date.getFullYear());
                      }}
                      selected={formData.endDate || undefined}
                      onSelect={handleEndDateSelect}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                      classNames={{
                        day_selected: "bg-[#0b6969] text-primary-foreground hover:bg-[#0b6969] hover:text-primary-foreground focus:bg-[#0b6969] focus:text-primary-foreground",
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                        month: "space-y-4 w-full",
                        caption: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full justify-around",
                        head_cell: "text-muted-foreground rounded-md w-9 text-center font-normal text-[0.8rem]",
                        row: "flex w-full mt-2 justify-around",
                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <BrandButton
            type="submit"
            disabled={isSubmitting || !hasChanges}
            isLoading={isSubmitting}
            className="relative flex-[0_0_auto] h-auto px-6 py-3"
          >
            {isSubmitting ? 'Sending...' : 'Submit Request'}
          </BrandButton>
        </div>
      </form>
    </div>
  );

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full max-w-[320px] sm:max-w-[606px]"
      heightStyle="!top-[20vh]"
    >
      {modalContent}
    </BrandModal>
  );
}
