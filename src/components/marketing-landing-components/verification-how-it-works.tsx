import React from "react";
import { BrandButton } from "../ui/brandButton";

export const VerificationHowItWorks = (): JSX.Element => {

  return (
    <section className="flex flex-col w-full max-w-[1440px] items-center justify-center gap-10 md:px-[60px] py-16 relative">
      {/* Section Header */}
      <header className="flex flex-col w-[730px] items-center justify-center gap-4 relative flex-[0_0_auto]">
        <h2 className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-[normal]">
          How Verification Works
        </h2>
      </header>

      {/* How it Works Image */}
      <div className="flex justify-center ">
        <img
          src="/marketing-images/verification/how-it-works.png"
          alt="How MatchBook Renter Verification Works"
          className="max-w-full h-auto"
        />
      </div>

      {/* CTA Button - Temporarily disabled */}
      <BrandButton
        size="lg"
        disabled
      >
        Coming Soon
      </BrandButton>
    </section>
  );
};
