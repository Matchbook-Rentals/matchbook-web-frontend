import React from "react";
import { Card, CardContent } from "../../components/ui/card";

export const HowItWorksOld = (): JSX.Element => {
  // Data for the steps to make the code more maintainable
  const steps = [
    { 
      number: "1", 
      title: "Find the Perfect Place",
      imgUrl: "/marketing-images/step-1.png"
    },
    { 
      number: "2", 
      title: "Apply with 1-Click",
      imgUrl: "/marketing-images/step-2.png"
    },
    { 
      number: "3", 
      title: "Match & Book",
      imgUrl: "/marketing-images/step-3.png"
    },
  ];

  return (
    <section className="flex flex-col w-full max-w-[1382px] mx-auto items-center gap-16 py-0">
      <h1 className="font-lora text-4xl font-semibold text-center text-[#271c1a] tracking-[-0.72px] leading-[52px]">
        How MatchBook Works
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {steps.map((step, index) => (
          <Card key={index} className="border-none shadow-none">
            <CardContent className="p-4 flex flex-col items-center gap-4">
              <img
                src={step.imgUrl}
                alt={`Step ${step.number} illustration`}
                width={250}
                height={250}
                className="rounded-lg"
              />
              <h2 className="font-lora text-4xl font-semibold text-[#271c1a] text-center tracking-[-0.72px] leading-[52px]">
                {step.number}. {step.title}
              </h2>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export const HowItWorks = (): JSX.Element => {
  return (
    <section className="w-full bg-[#FBFBFB] flex justify-center items-center py-2">
      <div 
        className="flex flex-col items-center relative"
        style={{
          width: '1441px',
          paddingTop: '64px',
          paddingRight: '150px',
          paddingBottom: '64px',
          paddingLeft: '150px',
          gap: '56px'
        }}
      >
        <header className="text-center">
          <h1 className="font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-normal">
            How MatchBook Works
          </h1>
        </header>
        
        <div className="w-full flex items-center justify-center">
          <img
            src="/marketing-images/Pasted image.png"
            alt="How MatchBook Works"
            className="max-w-full h-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
};
