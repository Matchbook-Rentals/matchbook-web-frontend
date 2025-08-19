import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export const VerificationHowItWorks = (): JSX.Element => {

  return (
    <section className="flex flex-col w-full max-w-[1440px] items-center justify-center gap-10 md:px-[60px] py-16 relative">
      {/* Section Header */}
      <header className="flex flex-col w-[730px] items-center justify-center gap-4 relative flex-[0_0_auto]">
        <h2 className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-[normal]">
          How it Works
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

      {/* CTA Button */}
      <Button
        className="relative w-[290px] flex-[0_0_auto] bg-teal-700 text-white font-medium py-3 rounded-md hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled
      >
        Start Screening
      </Button>
    </section>
  );
};
