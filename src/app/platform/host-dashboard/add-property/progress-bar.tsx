import React from 'react';

// Extend the interface to include the optional size prop
interface ProgressBarProps {
  currStep: number;
  steps: string[];
  size?: number; // Optional size prop, ensure values align with Tailwind's scale
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currStep, steps, size = 10 }) => {
  // Function to generate dynamic Tailwind class for width and height based on size prop
  const getSizeClass = (size: number): string => {
    // Here, you might need to map size to your Tailwind configuration,
    // For simplicity, assuming direct mapping exists:
    // e.g., size 10 might correspond to w-10 and h-10 in Tailwind
    return `w-${size} h-${size}`;
  };

  return (
    <div className="md:w-3/5 w-[90%] mx-auto px-4 py-1 border border-gray-500 rounded-2xl">
      <div className="flex items-center justify-between text-xs flex-row ">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center justify-center ">
            {/* Apply dynamic class for sizing */}
            <div
              className={`${getSizeClass(size)} rounded-full ${index < currStep ? 'bg-primaryBrand' : 'border-2 border-gray-300'}`}
            ></div>
            <span className="text-xs text-gray-500">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
