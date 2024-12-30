import React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "$0",
  className
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // If the input starts with '$', remove it for processing
    const valueToProcess = inputValue.startsWith('$') ? inputValue.slice(1) : inputValue;

    // Remove any non-digits
    const numericValue = valueToProcess.replace(/[^\d]/g, '');

    // Allow empty string or numbers only
    if (numericValue === '' || /^\d*$/.test(numericValue)) {
      // Always add '$' prefix, even for empty string
      onChange(`$${numericValue}`);
    }
  };

  // Display value will be empty if it's just "$", showing placeholder instead
  const displayValue = value === '$' ? '' : value;

  return (
    <div className="relative flex flex-col">
      <label
        htmlFor={id}
        className="text-sm text-gray-600 pl-[2px] mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "w-[200px] bg-background p-3 font-montserrat-light rounded-lg border border-gray-300",
          className
        )}
        placeholder={placeholder}
      />
    </div>
  );
};

export default CurrencyInput;
