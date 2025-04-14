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
  // Calculate progress bar width based on current step (adding 1 to currentStep to start with progress)
  const progressWidth = `${((currentStep + 1) / steps.length) * 100}%`;
  
  // Find the current step info
  const currentStepInfo = steps.find(step => step.position === currentStep) || steps[0];

  return (
    <div className="mx-auto w-full max-w-[885px] mb-12">
      <div className="relative w-full h-[95px]">
        {/* Progress bar track */}
        <div className="absolute w-[883px] h-5 top-[46px] left-0">
          <div className="w-full h-[9px] top-1.5 rounded-[10px] absolute left-0 border border-solid border-[#0000004c]" />
          
          {/* Step indicators removed, showing only text */}
        </div>

        {/* Progress fill with transition */}
        <div 
          className="absolute h-[7px] top-[53px] left-px bg-[#5c9ac5] transition-all duration-500 ease-in-out"
          style={{ width: progressWidth }}
        />
        
        {/* Current position bubble indicator */}
        <div 
          className="w-[21px] h-5 bg-[#5c9ac5] rounded-[10.5px/10px] shadow-[0px_4px_4px_#00000040] absolute top-[46px] transition-all duration-500 ease-in-out"
          style={{ left: `${((currentStep + 1) / steps.length) * 883 - 10}px` }}
        />

        {/* Step name label with transition */}
        <div 
          className="w-[102px] h-[18px] top-[77px] font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-sm text-center absolute tracking-[0] leading-[normal] transition-all duration-500 ease-in-out"
          style={{ left: `${((currentStep + 1) / steps.length) * 883 - 45}px` }}
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
