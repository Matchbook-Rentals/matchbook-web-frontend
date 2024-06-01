'use client';

import React, { Dispatch, SetStateAction } from 'react';
import { Checkbox } from "@/components/ui/checkbox";

// Define the interface for the CheckboxDemo props
interface CheckboxDemoProps {
  id?: string;
  label: string;
  isChecked: boolean;
  hasBorder?: boolean;
  checkOnLeft?: boolean;
  handleChange: Dispatch<SetStateAction<any>>; // Replace 'any' with the specific type for amenities state
  details: { id: string }; // Specify the structure of details
  justifyDirection: string;
  disabled?: boolean; // Add disabled prop
}

export function CheckboxDemo({
  id,
  label,
  isChecked,
  handleChange,
  hasBorder,
  checkOnLeft,
  details,
  justifyDirection,
  disabled = false // Default disabled to false
}: CheckboxDemoProps) {

  const handleCheckboxChange = () => {
    if (!disabled) {
      handleChange(details.id);
    }
  };

  return (
    <div
      className={`flex items-center justify-${justifyDirection} cursor-pointer space-x-2 pl-5 py-2 ${hasBorder ? 'border-b-2' : ''} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      onClick={handleCheckboxChange}
    >
      {!checkOnLeft && (
        <label
          htmlFor={id}
          className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <Checkbox id="terms" checked={isChecked} disabled={disabled} className='shadow-sm shadow-slate-600' />
      {checkOnLeft && (
        <label
          htmlFor={id}
          className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
    </div>
  );
}
