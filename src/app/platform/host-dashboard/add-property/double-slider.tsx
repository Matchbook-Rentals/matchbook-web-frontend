'use client';
import React, { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';

const DualThumbSlider = () => {
  const [values, setValues] = useState([1, 12]); // Initial values for the thumbs

  const handleChange = (newValues) => {
    setValues(newValues);
  };

  const steps = Array.from({ length: 12 }, (_, i) => i + 1); // Create an array of step values from 1 to 12

  return (
    <div className="w-4/5 mx-auto mt-12">
      <Slider.Root
        value={values}
        onValueChange={handleChange}
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
        <Slider.Thumb className="block w-5 h-5 bg-primaryBrand rounded-full outline-none border-2 border-white shadow-md" />
        <Slider.Thumb className="block w-5 h-5 bg-primaryBrand rounded-full outline-none border-2 border-white shadow-md" />
      </Slider.Root>
      <div className="mt-6 text-center">
        <span>Minimum: {values[0]}</span>
        <span className="mx-4">|</span>
        <span>Maximum: {values[1]}</span>
      </div>
    </div>
  );
};

export default DualThumbSlider;
