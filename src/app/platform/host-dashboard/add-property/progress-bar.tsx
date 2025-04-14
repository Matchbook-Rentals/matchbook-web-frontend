import React from 'react';

export interface StepInfo {
  name: string;
  position: number;
}

interface ProgressBarProps {
  currentStep: number;
  steps: StepInfo[];
  onSaveExit?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep,
  steps,
  onSaveExit 
}) => {
  // Calculate progress bar width based on current step
  const progressWidth = `${(currentStep / (steps.length - 1)) * 100}%`;
  
  // Find the current step info
  const currentStepInfo = steps.find(step => step.position === currentStep) || steps[0];

  return (
    <div className="mx-auto w-full max-w-[885px] mb-12">
      <div className="relative w-full h-[95px]">
        {/* Progress bar track */}
        <div className="absolute w-[883px] h-5 top-[46px] left-0">
          <div className="w-full h-[9px] top-1.5 rounded-[10px] absolute left-0 border border-solid border-[#0000004c]" />
          
          {/* Step indicators */}
          {steps.map((step) => (
            <div 
              key={step.position}
              className={`w-[21px] h-5 left-[${step.position * 200}px] ${currentStep >= step.position ? 'bg-[#5c9ac5]' : 'bg-white border border-[#0000004c]'} rounded-[10.5px/10px] shadow-[0px_4px_4px_#00000040] absolute top-0`}
              style={{ left: `${(step.position / (steps.length - 1)) * 883 - 10}px` }}
            />
          ))}
        </div>

        {/* Progress fill */}
        <div 
          className="absolute h-[7px] top-[53px] left-px bg-[#5c9ac5]"
          style={{ width: progressWidth }}
        />

        {/* Step name label */}
        <div 
          className="w-[102px] h-[18px] top-[77px] font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-sm text-center absolute tracking-[0] leading-[normal]"
          style={{ left: `${(currentStep / (steps.length - 1)) * 883 - 45}px` }}
        >
          {currentStepInfo.name}
        </div>

        {/* Save & Exit button */}
        <div className="absolute w-[106px] h-[29px] top-0 left-[777px]">
          <div 
            className="h-[29px] bg-white rounded-[15px] border-[0.5px] border-solid border-[#0000004c] cursor-pointer"
            onClick={onSaveExit}
          >
            <div className="relative w-[89px] h-5 top-1 left-2">
              <div className="w-[89px] h-5 top-0 left-0 font-['Montserrat',Helvetica] font-medium text-[#3f3f3f] text-xs text-center absolute tracking-[0] leading-[normal]">
                Save &amp; Exit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
