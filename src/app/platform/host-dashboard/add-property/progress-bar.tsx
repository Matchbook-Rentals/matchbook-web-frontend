import React from 'react';

interface ProgressBarProps {
  currentStep: string;
  onSaveExit?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep,
  onSaveExit 
}) => {
  return (
    <div className="mx-auto w-full max-w-[885px] mb-12">
      <div className="relative w-full h-[95px]">
        <div className="absolute w-[883px] h-5 top-[46px] left-0">
          <div className="w-full h-[9px] top-1.5 rounded-[10px] absolute left-0 border border-solid border-[#0000004c]" />
          <div className="w-[21px] h-5 left-[115px] bg-[#5c9ac5] rounded-[10.5px/10px] shadow-[0px_4px_4px_#00000040] absolute top-0" />
        </div>

        <div className="absolute w-[120px] h-[7px] top-[53px] left-px bg-[#5c9ac5]" />

        <div className="w-[102px] h-[18px] top-[77px] left-[75px] font-['Poppins',Helvetica] font-normal text-[#3f3f3f] text-sm text-center absolute tracking-[0] leading-[normal]">
          {currentStep}
        </div>

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
