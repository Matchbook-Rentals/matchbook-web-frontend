import React from "react";

interface ProgressBarProps {
  steps: number;
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  const stepWidth = 100 / steps;
  const progress = (currentStep - 1) * stepWidth + stepWidth / 2;

  return (
    <div className="w-full h-4 bg-gray-200 rounded-full">
      <div
        className="h-full rounded-full bg-green-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
      {Array.from({ length: steps }).map((_, index) => (
        <div
          key={index}
          className={`absolute w-4 h-4 rounded-full border-2 border-white transform -translate-x-1/2 transition-colors duration-300 ${
            index + 1 === currentStep
              ? "bg-green-500 border-green-500"
              : "bg-gray-200 border-gray-200"
          }`}
          style={{ left: `${index * stepWidth}%` }}
        />
      ))}
    </div>
  );
};

export default ProgressBar;
