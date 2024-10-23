import React, { useState } from "react";

const steps = [
  {
    title: "Search",
    description:
      "Browse listings that match your preferences and select the best of them to add to your favorites.",
  },
  {
    title: "Apply",
    description:
      "Fill out one universal application and access every property in our marketplace - No application fee!",
  },
  {
    title: "Match",
    description:
      "Hosts review your application. If they approve, then you have a match!",
  },
  {
    title: "Book",
    description:
      "All your matches are stored in \"Your Matchbook\". When you're ready, you can lock in your top pick right then and there!",
  },
];

export const MarketingSteps: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <div className="max-w-2xl mx-auto px-8 mt-24">
      <div className="flex items-center justify-start space-x-4 ">
        <div className="mx-auto w-full ">
          <h1
            className="text-4xl md:text-5xl z-10 w-full font-semibold text-right pr-5 "
            style={{ position: "relative", top: "-50%", left: "" }}
          >
            How Matchbook Works
          </h1>
          <div
            className={`bg-pinkBrand transform -translate-y-[40%] -translate-x-[0%] w-full h-[30px]`}
          ></div>
          <div className="flex justify-evenly mt-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`
                  w-10 h-10 rounded-full 
                  ${index === activeStep
                      ? "bg-pinkBrand text-white border-pinkBrand"
                      : "bg-white text-black"
                    }
    flex items-center justify-center font-bold mb-2 border-2 
    ${index === activeStep ? "border-pinkBrand" : "border-black"}
    cursor-pointer
  `}
                  onClick={() => setActiveStep(index)}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-md font-semibold ${index === activeStep ? "text-pinkBrand" : ""}`}
                >
                  {step.title}

                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="font-semibold text-xl mb-5 py-5 w-4/5 mx-auto min-h-[150px] flex items-start">
        <p>{steps[activeStep].description}</p>
      </div>
    </div>
  );
};
