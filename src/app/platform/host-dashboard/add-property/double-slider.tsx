'use client';

import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';

interface DualThumbSliderProps {
  setShortestLeaseTerms: (length: number, price: number) => void;
  setLongestLeaseTerms: (length: number, price: number) => void;
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
}

interface PropertyDetails {
  shortestLeaseLength: number | null;
  shortestLeasePrice: number | null;
  longestLeaseLength: number | null;
  longestLeasePrice: number | null;
}

const DualThumbSlider = ({ setShortestLeaseTerms, setLongestLeaseTerms, propertyDetails }: DualThumbSliderProps) => {
  const [values, setValues] = useState([1, 12]); // Initial values for the thumbs
  const [minValue, setMinValue] = useState(3000); // Initial minimum value
  const [maxValue, setMaxValue] = useState(2500); // Initial maximum value
  const [minValueRaw, setMinValueRaw] = useState('3000'); // Raw input for min value
  const [maxValueRaw, setMaxValueRaw] = useState('2500'); // Raw input for max value
  const [minValueIsFocus, setMinValueIsFocus] = useState(false); // Focus state for min value
  const [maxValueIsFocus, setMaxValueIsFocus] = useState(false); // Focus state for max value

  useEffect(() => {
    if (propertyDetails) {
      setValues([propertyDetails.shortestLeaseLength || 1, propertyDetails.longestLeaseLength || 12]);
      setMinValue(propertyDetails.shortestLeasePrice || 3000);
      setMaxValue(propertyDetails.longestLeasePrice || 2500);
      setMinValueRaw((propertyDetails.shortestLeasePrice || 3000).toString());
      setMaxValueRaw((propertyDetails.longestLeasePrice || 2500).toString());
    }
  }, [propertyDetails]);

  const handleSliderChange = (newValues: number[]) => {
    let oldValues = [...values];
    setValues(newValues);
    if (oldValues[0] !== newValues[0]) {
      setShortestLeaseTerms(newValues[0], minValue);
    }
    if (oldValues[1] !== newValues[1]) {
      setLongestLeaseTerms(newValues[1], maxValue);
    }
  };

  const handleMinValueChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9.-]+/g, "");
    setMinValueRaw(newValue);
    setMinValue(parseFloat(newValue) || 0);
  };

  const handleMinValueBlur = () => {
    const roundedValue = Math.round(minValue / 5) * 5;
    setMinValue(roundedValue);
    setMinValueRaw(roundedValue.toString());
    setShortestLeaseTerms(values[0], roundedValue);
    setMinValueIsFocus(false);
  };

  const handleMaxValueChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9.-]+/g, "");
    setMaxValueRaw(newValue);
    setMaxValue(parseFloat(newValue) || 0);
  };

  const handleMaxValueBlur = () => {
    const roundedValue = Math.round(maxValue / 5) * 5;
    setMaxValue(roundedValue);
    setMaxValueRaw(roundedValue.toString());
    setLongestLeaseTerms(values[1], roundedValue);
    setMaxValueIsFocus(false);
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const steps = Array.from({ length: 12 }, (_, i) => i + 1); // Create an array of step values from 1 to 12

  return (
    <div className="w-4/5 mx-auto mt-6">
      <Slider.Root
        value={values}
        onValueChange={handleSliderChange}
        min={1}
        max={12}
        step={1}
        aria-label="Dual Thumb Slider"
        className="relative flex items-center w-full h-8"
      >
        <Slider.Track className="relative bg-gray-300 rounded-full flex-grow h-1">
          <Slider.Range className="absolute bg-primaryBrand rounded-full h-full" />
          {steps.map((step) => (
            <div
              key={step}
              className="absolute w-px bg-gray-600"
              style={{
                left: `${((step - 1) / 11) * 100}%`, // Position notches evenly
                top: '-8px', // Adjust this value as needed
                height: '8px',
              }}
            />
          ))}
        </Slider.Track>
        <Slider.Thumb className="block w-5 h-5 bg-gray-300 rounded-full outline-none border-2 border-white shadow-md" />
        <Slider.Thumb className="block w-5 h-5 bg-gray-300 rounded-full outline-none border-2 border-white shadow-md" />
      </Slider.Root>
      <div className="mt-6 text-center">
        <div className="flex justify-center items-center">
          <span>Shortest: {values[0]}</span>
          <input
            type="text"
            value={minValueIsFocus ? minValueRaw : formatCurrency(minValue)}
            onChange={handleMinValueChange}
            onBlur={handleMinValueBlur}
            onFocus={() => setMinValueIsFocus(true)}
            step="5"
            className="ml-2 w-24 border-6 border-gray-300 rounded-md text-center"
          />
          <span className="mx-4">|</span>
          <span>Longest: {values[1]}</span>
          <input
            type="text"
            value={maxValueIsFocus ? maxValueRaw : formatCurrency(maxValue)}
            onChange={handleMaxValueChange}
            onBlur={handleMaxValueBlur}
            onFocus={() => setMaxValueIsFocus(true)}
            step="5"
            className="ml-2 w-24 border border-gray-300 rounded-md text-center"
          />
        </div>
      </div>
    </div>
  );
};

export default DualThumbSlider;
