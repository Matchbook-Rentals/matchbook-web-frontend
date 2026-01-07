import React from "react";
import { Link2, Share, Banknote } from "lucide-react";

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StepCard = ({ icon, title, description }: StepCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 flex flex-col items-center text-center">
    <div className="mb-4 text-gray-800">
      {icon}
    </div>
    <h3 className="font-semibold text-lg md:text-xl text-primary-900 mb-2">
      {title}
    </h3>
    <p className="text-sm md:text-base text-gray-600">
      {description}
    </p>
  </div>
);

const steps = [
  {
    icon: <Link2 className="w-6 h-6" strokeWidth={1.5} />,
    title: "Generate your link",
    description: "Generate a custom link for your account",
  },
  {
    icon: <Share className="w-6 h-6" strokeWidth={1.5} />,
    title: "Share with Hosts",
    description: "Potential hosts sign up using your link",
  },
  {
    icon: <Banknote className="w-6 h-6" strokeWidth={1.5} />,
    title: "Get Rewarded",
    description: "Receive $50 for each host you refer when they get their first booking",
  },
];

export const ReferHostHowItWorks = () => {
  return (
    <section className="w-full py-16 md:py-24 bg-[#F5F7F9]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="font-poppins font-medium text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] tracking-[-2px] text-primary-900 text-center mb-12">
          How it Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
