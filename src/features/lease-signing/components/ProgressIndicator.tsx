"use client";

import React from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed';
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function ProgressIndicator({ 
  steps, 
  currentStep = 0,
  orientation = 'horizontal',
  className 
}: ProgressIndicatorProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn(
      "flex",
      isHorizontal ? "items-center justify-between" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed' || index < currentStep;
        const isCurrent = step.status === 'current' || index === currentStep;
        const isPending = step.status === 'pending' || index > currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              isHorizontal ? "flex-1" : "w-full"
            )}
          >
            <div className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                isCompleted && "bg-[#3c8787] border-[#3c8787]",
                isCurrent && "border-[#3c8787] bg-white",
                isPending && "border-gray-300 bg-white"
              )}>
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Circle className={cn(
                    "w-5 h-5",
                    isCurrent ? "text-[#3c8787]" : "text-gray-400"
                  )} />
                )}
              </div>
              
              <div className="ml-3">
                <p className={cn(
                  "text-sm font-medium",
                  isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {isHorizontal && index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-4",
                isCompleted ? "bg-[#3c8787]" : "bg-gray-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}