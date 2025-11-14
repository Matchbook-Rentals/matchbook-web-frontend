import React from "react";
import { BrandButton } from "../ui/brandButton";
import { Card, CardContent } from "../ui/card";

export const VerificationWhyItMatters = (): JSX.Element => {
  // Feature card data for mapping
  const featureCards = [
    {
      icon: "/marketing-images/verification/card.svg",
      title: "Save Money",
      description:
        "With one report, valid for three months, you avoid paying for multiple screenings. It's a smarter, budget-friendly way to verify yourself.",
    },
    {
      icon: "/marketing-images/verification/health.svg",
      title: "Stay in Control",
      description:
        "Review your report to ensure everything is accurate. Catch discrepancies before sharing.",
    },
    {
      icon: "/marketing-images/verification/shield.svg",
      title: "Stand Out to Hosts",
      description:
        "Hosts are more likely to approve renters who are verified. Show you're serious, responsible, and trustworthy from the start.",
    },
  ];

  return (
    <section className="flex flex-col items-center justify-end gap-6 px-4 sm:px-6 md:px-12 lg:px-24 xl:px-32 py-16 relative bg-[#fbfbfb]">
      {/* Header section with image and text */}
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 relative self-stretch w-full flex-[0_0_auto]">
        <div className="relative w-full lg:w-1/2 h-64 sm:h-72 lg:h-80 rounded-xl overflow-hidden">
          <img
            src="/marketing-images/verification/why-it-works.png"
            alt="Why Renter Verification Matters"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col items-start lg:items-end justify-start lg:justify-end gap-4 relative flex-1 grow">
          <h1 className="relative self-stretch mt-[-1.00px] font-text-heading-small-medium font-medium text-gray-neutral900 text-2xl sm:text-3xl md:text-4xl lg:text-[40px] tracking-[-2.00px] leading-[normal]">
            Why Renter Verification Matters
          </h1>

          <p className="relative self-stretch font-text-heading-small-medium font-[number:var(--text-heading-small-medium-font-weight)] text-gray-neutral500 text-[length:var(--text-heading-small-medium-font-size)] tracking-[var(--text-heading-small-medium-letter-spacing)] leading-[var(--text-heading-small-medium-line-height)] [font-style:var(--text-heading-small-medium-font-style)]">
            Save money, stay in control, and stand out to hosts.
          </p>
        </div>
      </div>

      {/* Feature cards section */}
      <div className="flex flex-wrap items-stretch gap-6 relative w-full">
        {featureCards.map((card, index) => (
          <Card
            key={index}
            className="flex-1 min-w-full sm:min-w-[280px] md:min-w-[200px] border border-solid border-[#e5e7ea] rounded-xl"
          >
            <CardContent className="flex flex-col items-start gap-4 p-0">
              <div className="flex flex-col items-start gap-2 px-4 py-6 w-full">
                <div className="relative w-11 h-11 bg-[#e7f0f0] mb-2 rounded-lg overflow-hidden">
                  <img
                    className="absolute w-6 h-6 top-2.5 left-2.5"
                    alt="Icon"
                    src={card.icon}
                  />
                </div>

                <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
                  <h3 className="relative self-stretch mt-[-1.00px] font-['Poppins'] text-base font-semibold text-[#373940] leading-normal">
                    {card.title}
                  </h3>

                  <p className="relative self-stretch font-['Poppins'] text-base font-semibold text-[#5d606ddd] leading-normal">
                    {card.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Button */}
      <BrandButton
        size="lg"
        disabled
      >
        Start Screening
      </BrandButton>
    </section>
  );
};
