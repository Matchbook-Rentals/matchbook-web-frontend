'use client';
// Assuming Checkbox.tsx is unchanged and accepts props as per its original implementation.

import React, { Dispatch, SetStateAction } from 'react';
import { Checkbox } from "@/components/ui/checkbox";

// Define the interface for the CheckboxDemo props
interface CheckboxDemoProps {
  label: string;
  isChecked: boolean;
  hasBorder?: boolean;
  handleChange: Dispatch<SetStateAction<any>>; // Replace 'any' with the specific type for amenities state
}

export function CheckboxDemo({ label, isChecked, handleChange, hasBorder }: CheckboxDemoProps) {

  return (
    <div className={`flex items-center justify-between space-x-2 p-2 ${hasBorder ? 'border-b-2' : ''}`} onClick={() => handleChange(label)}>
      <label
        htmlFor="terms"
        className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
      <Checkbox id="terms" checked={isChecked}  />
    </div>
  );
}