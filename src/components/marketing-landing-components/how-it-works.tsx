import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsIcon } from "../svgs/svg-components";

interface StepCircleProps {
  index: number;
  isActive: boolean;
}

const StepCircle: React.FC<StepCircleProps> = ({ index, isActive }) => (
  <motion.div
    layout
    initial={false}
    animate={{
      scale: isActive ? 1.1 : 1,
      backgroundColor: isActive ? "#c68087" : "#FFFFFF",
      color: isActive ? "#FFFFFF" : "#000000",
    }}
    transition={{
      type: "spring",
      stiffness: 300,
      damping: 30
    }}
    // Making the circle responsive with smaller sizes for mobile and original sizes for md+
    className="w-[35px] h-[35px] text-lg md:w-[40px] md:h-[40px] md:text-2xl rounded-full border border-current flex items-center justify-center font-bold mb-2"
  >
    {index + 1}
  </motion.div>
);

const steps = [
  {
    title: "Search",
    description: "Browse listings that match your preferences and select the best of them to add to your favorites."
  },
  {
    title: "Apply",
    description: "Fill out one universal application and access every property in our marketplace - No application fee!"
  },
  {
    title: "Match",
    description: "Hosts review your application. If they approve, then you have a match!"
  },
  {
    title: "Book",
    description: "All your matches are stored in \"Your Matchbook\". When you're ready, you can lock in your top pick right then and there!"
  }
];

export const MarketingSteps = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoMoving, setIsAutoMoving] = useState(true);

  const moveToNextStep = useCallback(() => {
    setActiveStep((prevStep) => (prevStep + 1) % steps.length);
  }, []);

  useEffect(() => {
    let timer: any;
    if (isAutoMoving) {
      timer = setInterval(moveToNextStep, 7000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isAutoMoving, moveToNextStep]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsAutoMoving(false);
    // Reset auto-moving after a delay
    setTimeout(() => setIsAutoMoving(true), 30000);
  };

  return (
    <div className="max-w-[800px] min-h-[480px] xs:min-h-[0px] mx-auto px-8 mt-24">
      {/* Header section with title and decorative elements */}
      <div className="relative">
        <div className="flex justify-start  p-0 w-full mb-1">
          <SettingsIcon className="w-[60px] h-[51px] sm:w-[75px] sm:h-[64px] md:w-[91px] md:h-[77px] mb-4 flex-shrink-0 self-start" />
          <h1 className="text-[6.1vw]  xs:text-[6.6vw] md:text-[59px] leading-none font-medium text-left whitespace-nowrap text-ellipsis self-end flex-shrink-1">
            How Matchbook Works
          </h1>
        </div>
        {/* Animated underline */}
        <motion.div
          className="bg-pinkBrand absolute left-0 w-full h-[30px] "
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between  mt-16">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => handleStepClick(index)}
            whileHover={{ scale: 1.05 }}
          >
            <StepCircle index={index} isActive={index === activeStep} />
            <motion.span
              animate={{
                color: index === activeStep ? "#c68087" : "#000000"
              }}
              className="text-lg sm:text-xl md:text-2xl font-semibold"
            >
              {step.title}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Step description with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className=" text-xl sm:text-2xl md:text-3xl mb-5 mt-8 md:mt-12 w-full mx-auto min-h-[150px] flex items-start"
        >
          <p>{steps[activeStep].description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MarketingSteps;
