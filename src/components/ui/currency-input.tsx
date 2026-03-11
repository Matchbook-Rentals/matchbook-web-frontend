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
  // Track focus to defer comma formatting until blur
  // (reformatting mid-keystroke causes cursor jumps on older Safari)
  const [isFocused, setIsFocused] = React.useState(false);

  // Format initial value if it exists
  React.useEffect(() => {
    if (value && value !== '$') {
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

    // Remove any non-digits (including commas — raw digits only while typing)
    const numericValue = valueToProcess.replace(/[^\d]/g, '');

    // Store raw digits with $ prefix (no commas during typing)
    onChange(`$${numericValue}`);
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = () => {
    setIsFocused(false);
    // Format with commas on blur
    if (value && value !== '$') {
      const numericValue = value.replace(/[^\d]/g, '');
      if (numericValue) {
        const formattedValue = parseInt(numericValue).toLocaleString('en-US');
        onChange(`$${formattedValue}`);
      }
    }
  };

  // Show raw digits when focused, formatted when blurred
  const getDisplayValue = () => {
    if (!value || value === '$') return '';
    if (isFocused) {
      const raw = value.replace(/[^\d]/g, '');
      return raw ? `$${raw}` : '';
    }
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue) {
      return `$${parseInt(numericValue).toLocaleString('en-US')}`;
    }
    return '';
  };

  const displayValue = getDisplayValue();

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
        onFocus={handleFocus}
        onBlur={handleBlur}
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
