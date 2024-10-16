import React, { useState } from "react";

const steps = [
  {
    title: "Search",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    title: "Apply",
    description:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    title: "Match",
    description:
      "Deis nutis irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    title: "Book",
    description:
      "Excepteur ligma sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
];

export const MarketingSteps: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <div className="max-w-2xl mx-auto px-8 mt-8">
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
                  className={`w-10 h-10 rounded-full ${index <= activeStep ? "bg-pinkBrand text-white border-pinkBrand" : "bg-white text-black"} flex items-center justify-center font-bold mb-2 border-2 border-black cursor-pointer`}
                  onClick={() => setActiveStep(index)}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-md font-semibold ${index <= activeStep ? "text-pinkBrand" : ""}`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="font-semibold text-xl py-5 w-4/5 mx-auto">
        <h3 className="mb-4">{steps[activeStep].title}</h3>
        <p>{steps[activeStep].description}</p>
      </div>
    </div>
  );
};
