import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  onBlur?: () => void;
  className?: string;
  id: string;
  label?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, step = 5, onBlur, className, id, label }) => {
  const [rawValue, setRawValue] = useState(value.toString());
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9.-]+/g, "");
    setRawValue(newValue);
    onChange(parseFloat(newValue) || 0);
  };

  const handleBlur = () => {
    const roundedValue = Math.round(parseFloat(rawValue) / step) * step;
    onChange(roundedValue);
    setRawValue(roundedValue.toString());
    setIsFocus(false);
    if (onBlur) onBlur();
  };

  const handleFocus = () => {
    setIsFocus(true);
    if (inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col justify-center">
      {label && <Label className='text-center' htmlFor={id}>{label}</Label>}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={isFocus ? rawValue : formatCurrency(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        step={step}
        className={cn("ml-2 w-24 border border-gray-300 text-center", className)}
      />
    </div>
  );
};

export default CurrencyInput;