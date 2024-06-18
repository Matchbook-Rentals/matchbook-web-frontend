import React, { useState } from 'react';
import { Input } from './input';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  onBlur?: () => void;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, step = 5, onBlur }) => {
  const [rawValue, setRawValue] = useState(value.toString());
  const [isFocus, setIsFocus] = useState(false);

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

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <Input
      type="text"
      value={isFocus ? rawValue : formatCurrency(value)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={() => setIsFocus(true)}
      step={step}
      className="ml-2 w-24 border border-gray-300 rounded-md text-center"
    />
  );
};

export default CurrencyInput;