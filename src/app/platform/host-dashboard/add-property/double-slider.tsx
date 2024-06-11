'use client';

import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';


interface DualThumbSliderProps {
  setMinimumLeaseTerms: (length: number, price: number) => void;
  setMaximumLeaseTerms: (length: number, price: number) => void;
  propertyDetails: PropertyDetails;
  setPropertyDetails: (propertyDetails: PropertyDetails) => void;
}

interface PropertyDetails {
  minimumLeaseLength: number | null;
  minimumLeasePrice: number | null;
  maximumLeaseLength: number | null;
  maximumLeasePrice: number | null;
}

const DualThumbSlider = ({ setMinimumLeaseTerms, setMaximumLeaseTerms, propertyDetails }: DualThumbSliderProps) => {
  const [values, setValues] = useState([1, 12]); // Initial values for the thumbs
  const [minValue, setMinValue] = useState(2000); // Initial minimum value
  const [maxValue, setMaxValue] = useState(3000); // Initial maximum value

  useEffect(() => {
    if (propertyDetails) {
      setValues([propertyDetails.minimumLeaseLength || 1, propertyDetails.maximumLeaseLength || 12]);
      setMinValue(propertyDetails.minimumLeasePrice || 2000);
      setMaxValue(propertyDetails.maximumLeasePrice || 3000);
    }
  }, [propertyDetails]);

  const handleSliderChange = (newValues: number[]) => {
    let oldValues = [...values];
    setValues(newValues);
    if (oldValues[0] !== newValues[0]) {
      setMinimumLeaseTerms(newValues[0], minValue);
    }
    if (oldValues[1] !== newValues[1]) {
      setMaximumLeaseTerms(newValues[1], maxValue);
    }
  };

  const handleMinValueChange = (e) => {
    const newValue = e.target.value;
    setMinValue(newValue);
  };

  const handleMinValueBlur = () => {
    const roundedValue = Math.round(minValue / 5) * 5;
    setMinValue(roundedValue);
    setMinimumLeaseTerms(values[0], roundedValue);
  };

  const handleMaxValueChange = (e) => {
    const newValue = e.target.value;
    setMaxValue(newValue);
  };

  const handleMaxValueBlur = () => {
    const roundedValue = Math.round(maxValue / 5) * 5;
    setMaxValue(roundedValue);
    setMaximumLeaseTerms(values[1], roundedValue);
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
          <span>Minimum: {values[0]}</span>
          <input
            type="number"
            value={minValue}
            onChange={handleMinValueChange}
            onBlur={handleMinValueBlur}
            step="5"
            className="ml-2 w-24 border-6 border-gray-300 rounded-md text-center"
          />
          <span className="mx-4">|</span>
          <span>Maximum: {values[1]}</span>
          <input
            type="number"
            value={maxValue}
            onChange={handleMaxValueChange}
            onBlur={handleMaxValueBlur}
            step="5"
            className="ml-2 w-24 border border-gray-300 rounded-md text-center"
          />
        </div>
      </div>
    </div>
  );
};

export default DualThumbSlider;

