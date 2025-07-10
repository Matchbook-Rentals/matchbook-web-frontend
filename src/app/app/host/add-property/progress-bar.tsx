import React from 'react';

export interface StepInfo {
  name: string;
  position: number;
}

interface ProgressBarProps {
  currentStep: number;
  steps: StepInfo[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep,
  steps
}) => {
  // Calculate progress bar width based on current step (adding 1 to currentStep to start with progress)
  const progressWidth = `${((currentStep + 1) / steps.length) * 100}%`;

  return (
    <div className="w-full bg-black/15">
      <div className="relative w-full h-2">
        {/* Progress bar track */}
        <div className="w-full h-full bg-black/15" />
        
        {/* Progress fill with transition */}
        <div 
          className="absolute h-full top-0 left-0 bg-black rounded-tr-full rounded-br-full transition-all duration-500 ease-in-out"
          style={{ width: progressWidth }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
