'use client';
import React, { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';

const DualThumbSlider = ({ setMinimumLeaseTerms, setMaximumLeaseTerms }) => {
  const [values, setValues] = useState([1, 12]); // Initial values for the thumbs
  const [minValue, setMinValue] = useState(2000); // Initial minimum value
  const [maxValue, setMaxValue] = useState(3000); // Initial maximum value

  const handleSliderChange = (newValues) => {
    let oldValues = [...values];
    setValues(newValues);
    if (oldValues[0] !== newValues[0]) {
      setMinimumLeaseTerms((prev) => ({ ...prev, length: newValues[0] }));
    }
    if (oldValues[1] !== newValues[1]) {
      setMaximumLeaseTerms((prev) => ({ ...prev, length: newValues[1] }));
    }
  };

  const handleMinValueChange = (e) => {
    const newValue = Math.round(e.target.value / 5) * 5; // Round to nearest 5
    setMinValue(newValue);
    setMinimumLeaseTerms((prev) => ({ ...prev, price: newValue }));
  };

  const handleMaxValueChange = (e) => {
    const newValue = Math.round(e.target.value / 5) * 5; // Round to nearest 5
    setMaxValue(newValue);
    setMaximumLeaseTerms((prev) => ({ ...prev, price: newValue }));
  };

  const steps = Array.from({ length: 12 }, (_, i) => i + 1); // Create an array of step values from 1 to 12

  return (
    <div className="w-4/5 mx-auto mt-12">
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
            step="5"
            className="ml-2 w-24 border-6 border-gray-300 rounded-md text-center"

          />
          <span className="mx-4">|</span>
          <span>Maximum: {values[1]}</span>
          <input
            type="number"
            value={maxValue}
            onChange={handleMaxValueChange}
            step="5"
            className="ml-2 w-24 border border-gray-300 rounded-md text-center"
          />
        </div>
      </div>
    </div>
  );
};

export default DualThumbSlider;
