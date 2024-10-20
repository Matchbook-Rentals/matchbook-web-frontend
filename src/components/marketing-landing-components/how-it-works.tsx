import React, { useState } from "react";

const steps = [
  {
    title: "Swipe",
    description:
      "Browse listings that match your preferences and swipe on them! Swipe right if you love it, choose \"maybe\" to think them over, and swipe left to send them right to the friendzone.",
  },
  {
    title: "Apply",
    description:
      "Now that you've got your favorites, it's time to show your roster you're serious. Simply click apply and we'll send them your application to review. Apply to up to 5 properties at a time; and if you change your mind on one, withdraw your application so you can give another favorite a chance!",
  },
  {
    title: "Match",
    description:
      "Once your options look over your applications, they can approve you as their match! We'll let you know when you get denied (it's ok, they weren't right for you anyway) and when you find a match! Once you've got a match, you can move to the last step: booking.",
  },
  {
    title: "Book",
    description:
      "Look over your matches and get ready to commit for real. When you're ready, click \"book\" on your top pick to officially lock in your stay. Congrats, you've found the one (for the next 1-12 months)!",
  },
];

export const MarketingSteps: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <div className="max-w-2xl mx-auto px-8 mt-16">
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
                  className={`w-10 h-10 rounded-full ${index === activeStep ? "bg-pinkBrand text-white border-pinkBrand" : "bg-white text-black"} flex items-center justify-center font-bold mb-2 border-2 ${index === activeStep ? "border-pinkBrand" : "border-black"} cursor-pointer`}
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
      <div className="font-semibold text-xl py-5 w-4/5 mx-auto">
        <p>{steps[activeStep].description}</p>
      </div>
    </div>
  );
};
