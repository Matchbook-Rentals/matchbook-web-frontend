import React from "react";
import { Card, CardContent } from "../../components/ui/card";

export const HowItWorks = (): JSX.Element => {
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
