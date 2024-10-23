import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const StepCircle = ({ index, isActive }) => (
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
    className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center font-bold mb-2"
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
    let timer;
    if (isAutoMoving) {
      timer = setInterval(moveToNextStep, 7000);
    }
    return () => clearInterval(timer);
  }, [isAutoMoving, moveToNextStep]);

  const handleStepClick = (index) => {
    setActiveStep(index);
    setIsAutoMoving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-8 mt-24">
      <div className="flex items-center justify-start space-x-4">
        <div className="mx-auto w-full">
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-semibold text-right pr-5 mb-2">
              How Matchbook Works
            </h1>
            <motion.div
              className="bg-pinkBrand absolute -bottom-2 left-0 w-full h-[30px] -z-10"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex justify-evenly mt-8">
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
                  className="text-md font-semibold"
                >
                  {step.title}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="font-semibold text-xl mb-5 py-5 w-4/5 mx-auto min-h-[150px] flex items-start"
        >
          <p>{steps[activeStep].description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MarketingSteps;
