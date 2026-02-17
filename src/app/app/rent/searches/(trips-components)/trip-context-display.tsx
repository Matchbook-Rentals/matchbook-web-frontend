import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parse } from 'date-fns';
import { ApplicationItemHeaderStyles } from '@/constants/styles';

interface TripContextDisplayProps {
  startDate: Date;
  endDate: Date;
  numAdults: number;
  numChildren: number;
  numPets: number;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onNumAdultsChange: (num: number) => void;
  onNumChildrenChange: (num: number) => void;
  onNumPetsChange: (num: number) => void;
}

export const TripContextDisplay: React.FC<TripContextDisplayProps> = ({
  startDate,
  endDate,
  numAdults,
  numChildren,
  numPets,
  onStartDateChange,
  onEndDateChange,
  onNumAdultsChange,
  onNumChildrenChange,
  onNumPetsChange,
}) => {
  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), 'MM/dd/yyyy');
    } catch (error) {
      return '';
    }
  };

  const handleDateChange = (value: string, onChange: (date: Date) => void) => {
    try {
      const parsed = parse(value, 'MM/dd/yyyy', new Date());
      if (!isNaN(parsed.getTime())) {
        onChange(parsed);
      }
    } catch (error) {
      // Invalid date, ignore
    }
  };

  const handleCountChange = (current: number, delta: number, onChange: (num: number) => void, min: number = 0) => {
    const newValue = current + delta;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-6">
      {/* Move-In / Move-Out Dates */}
      <div className="flex gap-5 w-full">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5">
            Move-In <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={formatDate(startDate)}
            onChange={(e) => handleDateChange(e.target.value, onStartDateChange)}
            placeholder="MM/DD/YYYY"
            className="flex h-12 items-center gap-2 px-3 py-2 bg-input-background rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5">
            Move-Out <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={formatDate(endDate)}
            onChange={(e) => handleDateChange(e.target.value, onEndDateChange)}
            placeholder="MM/DD/YYYY"
            className="flex h-12 items-center gap-2 px-3 py-2 bg-input-background rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs text-gray-900"
          />
        </div>
      </div>

      {/* Renters */}
      <div>
        <h3 className="[font-family:'Poppins',Helvetica] font-medium text-gray-900 text-base mb-4">
          Renters
        </h3>

        <div className="space-y-3">
          {/* Adults */}
          <div className="flex items-center justify-between">
            <Label className="[font-family:'Poppins',Helvetica] font-normal text-gray-700 text-sm">
              Adults
            </Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCountChange(numAdults, -1, onNumAdultsChange, 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-gray-700">−</span>
              </button>
              <span className="[font-family:'Poppins',Helvetica] font-medium text-gray-900 text-sm w-6 text-center">
                {numAdults}
              </span>
              <button
                type="button"
                onClick={() => handleCountChange(numAdults, 1, onNumAdultsChange, 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-gray-700">+</span>
              </button>
            </div>
          </div>

          {/* Kids */}
          <div className="flex items-center justify-between">
            <Label className="[font-family:'Poppins',Helvetica] font-normal text-gray-700 text-sm">
              Kids
            </Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCountChange(numChildren, -1, onNumChildrenChange, 0)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-gray-700">−</span>
              </button>
              <span className="[font-family:'Poppins',Helvetica] font-medium text-gray-900 text-sm w-6 text-center">
                {numChildren}
              </span>
              <button
                type="button"
                onClick={() => handleCountChange(numChildren, 1, onNumChildrenChange, 0)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-gray-700">+</span>
              </button>
            </div>
          </div>

          {/* Pets */}
          <div className="flex items-center justify-between">
            <Label className="[font-family:'Poppins',Helvetica] font-normal text-gray-700 text-sm">
              Pets
            </Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCountChange(numPets, -1, onNumPetsChange, 0)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-gray-700">−</span>
              </button>
              <span className="[font-family:'Poppins',Helvetica] font-medium text-gray-900 text-sm w-6 text-center">
                {numPets}
              </span>
              <button
                type="button"
                onClick={() => handleCountChange(numPets, 1, onNumPetsChange, 0)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="text-gray-700">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
