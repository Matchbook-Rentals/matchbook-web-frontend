'use client';
// Assuming Checkbox.tsx is unchanged and accepts props as per its original implementation.

import React, { Dispatch, SetStateAction } from 'react';
import { Checkbox } from "@/components/ui/checkbox";

// Define the interface for the CheckboxDemo props
interface CheckboxDemoProps {
  key: string
  label: string;
  isChecked: boolean;
  hasBorder?: boolean;
  checkOnLeft?: boolean
  handleChange: Dispatch<SetStateAction<any>>; // Replace 'any' with the specific type for amenities state
  details: object;
  justifyDirection: string;
}

export function CheckboxDemo({ key, label, isChecked, handleChange, hasBorder, checkOnLeft, details, justifyDirection }: CheckboxDemoProps) {

  return (
    <div className={`flex items-center justify-${justifyDirection} cursor-pointer  space-x-2 pl-5 py-2 ${hasBorder ? 'border-b-2' : ''}`} onClick={() => handleChange(details.id)}>
      {!checkOnLeft && <label
        htmlFor={key}
        className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>}
      <Checkbox id="terms" checked={isChecked} className='shadow-sm shadow-slate-600' />
      {checkOnLeft && <label
        htmlFor={key}
        className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>}
    </div>
  );
}
