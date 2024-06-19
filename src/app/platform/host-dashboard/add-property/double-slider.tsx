'use client';

import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import CurrencyInput from '@/components/ui/currency-input';

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

  useEffect(() => {
    if (propertyDetails) {
      setValues([propertyDetails.shortestLeaseLength || 1, propertyDetails.longestLeaseLength || 12]);
      setMinValue(propertyDetails.shortestLeasePrice || 3000);
      setMaxValue(propertyDetails.longestLeasePrice || 2500);
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
      <div className="mt-6 text-center justify-evenly  flex w-full  items-center">
        <div className="flex justify-center items-center">
          <CurrencyInput
            value={minValue}
            id="min-value"
            label={`Shortest: ${values[0]} months`}
            onChange={setMinValue}
            className="rounded-full w-40 mt-1"
            styleWithLabel="text-lg"
            onBlur={() => setShortestLeaseTerms(values[0], minValue)}
          />
          <span className="mx-4 text-2xl text-gray-600">|</span>
          <CurrencyInput
            value={maxValue}
            id="max-value"
            label={`Longest: ${values[1]} months`}
            onChange={setMaxValue}
            className="rounded-full w-40 mt-1"
            styleWithLabel="text-lg"
            onBlur={() => setLongestLeaseTerms(values[1], maxValue)}
          />
        </div>
      </div>
    </div>
  );
};

export default DualThumbSlider;
