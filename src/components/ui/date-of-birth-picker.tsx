"use client";

import React from 'react';
import { DateInput } from './date-input';

interface DateOfBirthPickerProps extends Omit<React.ComponentProps<typeof DateInput>, "minDate" | "maxDate"> {
  // Inherits all DateInput props except minDate/maxDate which are set automatically
}

export function DateOfBirthPicker(props: DateOfBirthPickerProps) {
  // Set date ranges for DOB (18 to 120 years old)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

  return (
    <DateInput
      {...props}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}