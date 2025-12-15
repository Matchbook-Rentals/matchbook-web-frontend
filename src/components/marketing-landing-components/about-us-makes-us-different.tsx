import React from "react";
import { Card, CardContent } from "../ui/card";
import { Calendar, Search, File } from "lucide-react";

export const Frame = (): JSX.Element => {
  // Feature card data for mapping
  const featureCards = [
    {
      icon: Calendar,
      title: "Calendar Management",
      width: "w-28",
    },
    {
      icon: Search,
      title: "Tenant Screening",
      width: "w-[104px]",
    },
    {
      icon: File,
      title: "Application Management",
      width: "w-full",
    },
  ];

  return (
    <section className="flex flex-col items-center gap-14 py-16">
      <div className="flex flex-col lg:flex-row items-start gap-[54px] justify-center w-full px-4">
        <Card className="relative w-full lg:w-[558px] h-[372px] rounded-xl overflow-hidden border-none">
        <CardContent className="p-0">
          <img
            className="w-full h-full object-cover"
            alt="Close up people working from home"
            src="/about-us/makes-us-different/1.png"
          />
        </CardContent>
        </Card>

        <div className="flex flex-col w-full lg:w-[562px] items-center lg:items-start gap-8 relative">
        <div className="flex flex-col items-center lg:items-start gap-4 relative self-stretch w-full">
          <h2 className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-[normal] text-center lg:text-left">
            What Makes Us Different
          </h2>

          <p className="relative w-full font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-neutral900 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] text-center lg:text-left">
We stand out by offering a complete solution to common rental challenges, unlike others who leave you to figure out the complexities on your own & charge you an arm and a leg for their help. 
          </p>
        </div>

        <div className="flex flex-col items-center lg:items-end gap-4 relative self-stretch w-full">
          <p className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-gray-neutral800 text-base tracking-[0] leading-[normal] text-center lg:text-left">
MatchBook integrates essential features into one platform accessible for all budgets.
          </p>

          <div className="flex items-start gap-6 relative justify-between max-w-[600px] lg:max-w-[1000px] mx-auto self-stretch w-full">
            {featureCards.map((feature, index) => (
              <Card
                key={`feature-${index}`}
                className={`flex flex-col items-center max-w-[150px] ${"flex-1 self-stretch grow"} bg-[#f8fbfb] rounded-lg overflow-hidden border border-solid border-[#e5e7ea]`}
              >
                <CardContent className="flex flex-col items-center gap-4 p-3 w-full">
                  <div className="flex flex-col items-center gap-3 relative self-stretch w-full">
                    <div className="relative w-8 h-8 bg-[#3c87871a] rounded overflow-hidden flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-[#3c8787]" />
                    </div>

                    <h3
                      className={`relative ${feature.width} font-['Poppins',Helvetica] font-normal text-gray-neutral900 text-xs text-center tracking-[0] leading-6`}
                    >
                      {feature.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};
