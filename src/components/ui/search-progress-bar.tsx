import React from 'react';
import { cn } from '@/lib/utils';

interface SearchProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const SearchProgressBar: React.FC<SearchProgressBarProps> = ({
  currentStep,
  totalSteps,
  className
}) => {
  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    status: index < currentStep ? "active" : "inactive"
  }));

  return (
    <div className={cn("flex items-center justify-center py-4", className)}>
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center",
                  step.status === "active"
                    ? "bg-[#3c8787] border-[#3c8787]"
                    : "bg-gray-50 border-[#eaecf0]"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    step.status === "active" ? "bg-white" : "bg-[#d0d5dd]"
                  )}
                />
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="w-20 h-0.5 bg-[#0b6969] mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};