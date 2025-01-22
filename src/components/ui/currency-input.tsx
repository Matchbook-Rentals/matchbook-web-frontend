import React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "$0",
  className,
  labelClassName
}) => {
  // Format initial value if it exists
  React.useEffect(() => {
    if (value && value !== '$') {
      // If there's a decimal, only take what's before it
      const beforeDecimal = value.split('.')[0];
      const numericValue = beforeDecimal.replace(/[^\d]/g, '');
      if (numericValue) {
        const formattedValue = parseInt(numericValue).toLocaleString('en-US');
        onChange(`$${formattedValue}`);
      }
    }
  }, []); // Run only once on mount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // If decimal is entered, ignore it and everything after
    if (inputValue.includes('.')) {
      return;
    }

    // If the input starts with '$', remove it for processing
    const valueToProcess = inputValue.startsWith('$') ? inputValue.slice(1) : inputValue;

    // Remove any non-digits
    const numericValue = valueToProcess.replace(/[^\d]/g, '');

    // Allow empty string or numbers only
    if (numericValue === '' || /^\d*$/.test(numericValue)) {
      // Format directly from the numeric string
      const formattedValue = numericValue
        ? parseInt(numericValue).toLocaleString('en-US')
        : '';

      // Always add '$' prefix
      onChange(`$${formattedValue}`);
    }
  };

  // Display value will be empty if it's just "$", showing placeholder instead
  const displayValue = value === '$' ? '' : value;

  return (
    <div className="relative flex flex-col">
      <label
        htmlFor={id}
        className={cn(
          "text-sm text-[#40404080] font-montserrat-light pl-[2px] mb-1",
          labelClassName
        )}
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
