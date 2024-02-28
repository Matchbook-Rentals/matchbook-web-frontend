import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const DatePopover = ({ label, selectedDate, onSelect }) => (
  <Popover>
    <PopoverTrigger className="hidden text-left sm:block text-lg py-2 pl-6 sm:border-l-[1px] md:border-x-[1px] border-gray-500 flex-1">
      {selectedDate ? selectedDate.toUTCString().slice(0, 16) : label}
    </PopoverTrigger>
    <PopoverContent className='mt-5'>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        initialFocus
      />
    </PopoverContent>
  </Popover>
);

export default DatePopover;
