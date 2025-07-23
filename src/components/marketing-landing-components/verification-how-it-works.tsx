import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export const VerificationHowItWorks = (): JSX.Element => {
  // Data for the steps to make the code more maintainable
  const steps = [
    {
      number: "1",
      title: "Apply for MatchBook Renter Verification",
      description: "Simply answer a few questions, pay, and submit.",
      position: "top-9 left-px",
      iconPosition: "top-[310px] left-[164px]",
      iconSrc: "/icon-2.svg",
      iconGradient:
        "before:[background:linear-gradient(81deg,rgba(255,255,255,1)_0%,rgba(13,27,42,1)_100%)]",
    },
    {
      number: "2",
      title: "We Prepare Your Report",
      description:
        "We prepare your renter verification which includes your credit range, background check, and eviction history. This process may take up to 24 hours.",
      position: "top-[291px] left-[303px]",
      iconPosition: "top-28 left-[439px]",
      iconSrc: "/icon.svg",
      iconGradient:
        "before:[background:linear-gradient(81deg,rgba(13,27,42,1)_100%)]",
    },
    {
      number: "3",
      title: "Review Your Renter Verification",
      description:
        "You get full access to your screening results before anyone else. Make sure it's accurate and ready to use.",
      position: "top-0 left-[666px]",
      iconPosition: "top-[282px] left-[806px]",
      iconSrc: "/icon-1.svg",
      iconGradient:
        "before:[background:linear-gradient(76deg,rgba(13,27,42,1)_0%,rgba(255,255,255,1)_100%)]",
    },
    {
      number: "4",
      title: "Apply to Properties with Your Verification Attached",
      description:
        "When you're ready to apply for a property, your renter verification will automatically be included.",
      position: "top-[276px] left-[909px]",
      iconPosition: "top-[141px] left-[1094px]",
      iconSrc: "/icon-3.svg",
      iconGradient:
        "before:[background:linear-gradient(81deg,rgba(13,27,42,1)_0%,rgba(255,255,255,1)_100%)]",
    },
  ];

  // Vector images for the flow path
  const vectors = [
    {
      src: "/vector-5.svg",
      position: "top-[364px] left-[111px]",
      size: "w-[157px] h-[147px]",
    },
    {
      src: "/vector-6.svg",
      position: "top-[360px] left-[427px]",
      size: "w-[118px] h-[169px]",
    },
    {
      src: "/vector-7.svg",
      position: "top-[329px] left-[786px]",
      size: "w-[123px] h-[155px]",
    },
    {
      src: "/vector-8.svg",
      position: "top-[353px] left-[1030px]",
      size: "w-[153px] h-[127px]",
    },
  ];

  return (
    <section className="flex flex-col w-[1440px] items-center justify-center gap-10 px-[60px] py-16 relative bg-white">
      {/* Section Header */}
      <header className="flex flex-col w-[730px] items-center justify-center gap-4 relative flex-[0_0_auto]">
        <h2 className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-[normal]">
          How it Works
        </h2>
      </header>

      {/* How it Works Image */}
      <div className="flex justify-center">
        <img
          src="/marketing-images/verification/how-it-works.png"
          alt="How MatchBook Renter Verification Works"
          className="max-w-full h-auto"
        />
      </div>

      {/* CTA Button */}
      <Button
        className="relative w-[290px] flex-[0_0_auto] bg-teal-700 text-white font-medium py-3 rounded-md hover:bg-teal-800"
        asChild
      >
        <a href="/app/verification">Start Screening</a>
      </Button>
    </section>
  );
};