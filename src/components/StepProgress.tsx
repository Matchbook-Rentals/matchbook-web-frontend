"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  textPosition?: 'left' | 'right';
  mobileTextBelow?: boolean;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  labels = [],
  textPosition = 'right',
  mobileTextBelow = false,
  className
}) => {
  const steps = Array.from({ length: totalSteps }, (_, index) => {
    if (index < currentStep - 1) return { status: "completed" };
    if (index === currentStep - 1) return { status: "active" };
    return { status: "inactive" };
  });

  // Animation variants for circles
  const circleVariants = {
    inactive: { scale: 1, backgroundColor: "rgb(249 250 251)" }, // bg-gray-50
    active: { scale: 1.1, backgroundColor: "rgb(60, 135, 135)", transition: { type: "spring", stiffness: 300 } }, // bg-[#3c8787]
    completed: { scale: 1, backgroundColor: "rgb(11, 105, 105)" } // bg-[#0b6969]
  };

  // Variants for inner dot or check
  const innerVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  // Text color based on status
  const getTextColor = (status: string) => {
    return status === "inactive" ? "text-gray-400" : "text-[#0b6969]";
  };

  return (
    <div className="flex w-full items-center justify-center">
      <div className={cn("flex w-full max-w-3xl items-center justify-between", className)}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step group (circle + optional text) */}
            <div className={`flex ${mobileTextBelow ? 'flex-col items-center sm:flex-row sm:items-center' : 'items-center'} ${textPosition === 'left' && !mobileTextBelow ? 'flex-row-reverse' : ''}`}>
              <div className="inline-flex items-start relative">
                <motion.div
                  className={`relative w-6 h-6 rounded-full overflow-hidden`}
                  variants={circleVariants}
                  initial="inactive"
                  animate={step.status}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className={`h-6 rounded-xl border-[1.5px] border-solid flex items-center justify-center ${
                      step.status === "active"
                        ? "bg-[#3c8787]"
                        : step.status === "completed"
                        ? "bg-[#0b6969] border-[#0b6969]"
                        : "border-[#eaecf0]"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {step.status === "completed" ? (
                        <motion.div
                          key="check"
                          variants={innerVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <CheckIcon className="w-5 h-5 text-white stroke-[3]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="dot"
                          className={`w-2 h-2 rounded ${
                            step.status === "active" ? "bg-white" : "bg-[#d0d5dd]"
                          }`}
                          variants={innerVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              </div>
              {labels[index] && (
                <span className={`text-xs font-medium ${getTextColor(step.status)} ${
                  mobileTextBelow
                    ? 'mt-1 text-center sm:mt-0 sm:ml-2'
                    : textPosition === 'left' ? 'mr-2' : 'ml-2'
                }`}>
                  {labels[index]}
                </span>
              )}
            </div>

            {/* Connector line (except after the last step) */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-400 mx-2 relative">
                <motion.div
                  className="absolute left-0 top-0 h-0.5 bg-[#0b6969]"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: steps[index + 1].status !== "inactive" ? "100%" : 0 
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};