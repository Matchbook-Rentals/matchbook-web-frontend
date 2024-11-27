import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsIcon } from "../svgs/svg-components";
import { on } from "events";

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

interface Step {
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    title: "Search",
    description: "Browse rental listings that fit your preferences and save the best ones to your favorites. Discover mid-term, long-term, and furnished rental properties with verified landlords, all in one place."
  },
  {
    title: "Apply",
    description: "Fill out one universal application and unlock access to every property in our marketplace. It’s fast, simple, and saves you time."
  },
  {
    title: "Match",
    description: "Hosts review your application, and when they approve, it’s a match! Connect with landlords offering mid-term, long-term, and furnished rentals that align with your needs."
  },
  {
    title: "Book",
    description: "Your approved matches are saved in “Your Matchbook.” When you’re ready, choose your top pick and secure your rental directly from your dashboard. Easy and hassle-free!"
  }
];

export const MarketingSteps = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoMoving, setIsAutoMoving] = useState(true);
  const [count, setCount] = useState(0);

  const moveToNextStep = () => {
    setCount(prev => prev + 1);
    setActiveStep((prevStep) => {
      let nextStep = (prevStep + 1)
      if (nextStep >= steps.length) {
        nextStep = 0;
      }
      return nextStep;
    });
  };

  useEffect(() => {
    let timer: any;
    if (isAutoMoving) {
      timer = setInterval(moveToNextStep, 7000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isAutoMoving]);


  const handleStepClick = (index: number) => {
    setIsAutoMoving(false);
    setActiveStep(index);
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
          className="bg-pinkBrand absolute left-0 w-full h-[26px] "
          key={'sliding-bar'}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between  mt-16">
        {steps.map((step, index) => (
          <motion.div
            key={`title-${index}`}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => handleStepClick(index)}
            whileHover={{ scale: 1.05 }}
          >
            <StepCircle index={index} isActive={index === activeStep} />
            <motion.span
              animate={{
                color: index === activeStep ? "#c68087" : "#000000"
              }}
              className="text-lg sm:text-xl md:text-2xl font-medium"
            >
              {step.title}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Step description with animation */}
      <div className="relative">
        <AnimatePresence mode="wait" >
          {steps.map((step, index) => (
            index === activeStep && (
              < motion.li
                key={`step--${count}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-xl sm:text-2xl md:text-3xl mb-5 mt-8 md:mt-12 w-full mx-auto min-h-[150px] flex items-start"
              >
                <p>{step.description}</p>
              </motion.li>
            )
          ))}
        </AnimatePresence>
      </div>
    </div >
  );
};

export default MarketingSteps;
