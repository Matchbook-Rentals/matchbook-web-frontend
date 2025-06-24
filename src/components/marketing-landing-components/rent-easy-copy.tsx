import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import CowSpot from "./cow-spot";
import MarketingContainer from "./marketing-container";

export default function RentEasyCopy(): JSX.Element {
  // Feature card data for mapping
  const featureCards = [
    {
      id: 1,
      position: "left-top",
      icon: "/marketing-images/rent-made-easy/clock.svg",
      title: "Transparent Pricing",
      description:
        "No surprise fees. What you see on the listing is what you pay.",
    },
    {
      id: 2,
      position: "left-bottom",
      icon: "/marketing-images/rent-made-easy/heart.svg",
      title: "Review Your Hosts",
      description:
        "You get rated, so do they. Read honest reviews from other renters before booking.",
    },
    {
      id: 3,
      position: "center",
      icon: "/marketing-images/rent-made-easy/checkmark.svg",
      title: "Get MatchBook Verified and Stay in Control",
      description:
        "Found the right fit? Sign your rental agreement and pay directly through MatchBook. No emails, no PDFs, no back-and-forth.",
      isCentered: true,
    },
    {
      id: 4,
      position: "right-top",
      icon: "/marketing-images/rent-made-easy/pencil.svg",
      title: "One Application, One Click, Unlimited Options",
      description:
        "Fill out your application once. Then apply to any property on MatchBook with a single click.",
    },
    {
      id: 5,
      position: "right-bottom",
      icon: "/marketing-images/rent-made-easy/paper.svg",
      title: "Sign, Book, and Pay in One Place",
      description:
        "Found the right fit? Sign your rental agreement and pay directly through MatchBook. No emails, no PDFs, no back-and-forth.",
    },
  ];

  // Vector background positions for each card
  const vectorPositions = {
    "left-top": { top: "top-[92px]", left: "left-[162px]" },
    "left-bottom": { top: "top-7", left: "left-[147px]" },
    center: [
      { top: "top-[-389px]", left: "left-[114px]" },
      { top: "top-[71px]", left: "left-[-403px]" },
    ],
    "right-top": { top: "top-[79px]", left: "left-[173px]" },
    "right-bottom": { top: "top-[99px]", left: "left-[182px]" },
  };

  // Render a feature card with its content
  const renderFeatureCard = (card) => {
    const isCenter = card.position === "center";

    return (
      <Card
        key={card.id}
        className="flex flex-col items-start gap-2 p-3 relative w-full h-full rounded-xl overflow-hidden border border-solid border-[#c1c1c1]"
      >
        <CardContent className={`flex flex-col items-start gap-2 p-0 w-full ${isCenter ? "h-full justify-center items-center" : "md:items-start items-center"}`}>
          {isCenter ? (
            // Center card layout: icon on top of title
            <>
              <div className="relative w-11 h-11 bg-[#f3f3f3] rounded overflow-hidden flex items-center justify-center">
                <img
                  className="w-6 h-6"
                  alt="Icon"
                  src={card.icon}
                />
              </div>
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[16px] leading-[140%] tracking-[0px] text-[#384250] text-center w-full max-w-[289px] px-2">
                {card.title}
              </div>
            </>
          ) : (
            // Regular card layout: icon on top on mobile, to the left on desktop
            <>
              {/* Mobile layout: icon on top */}
              <div className="md:hidden flex flex-col items-center gap-2 relative self-stretch w-full">
                <div className="relative w-11 h-11 bg-[#f3f3f3] rounded overflow-hidden flex items-center justify-center">
                  <img
                    className="w-6 h-6"
                    alt="Icon"
                    src={card.icon}
                  />
                </div>
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[16px] leading-[140%] tracking-[0px] text-[#384250] text-center">
                  {card.title}
                </div>
              </div>
              
              {/* Desktop layout: icon to the left */}
              <div className="hidden md:flex items-center gap-2 relative self-stretch w-full">
                <div className="relative w-11 h-11 bg-[#f3f3f3] rounded overflow-hidden flex items-center justify-center">
                  <img
                    className="w-6 h-6"
                    alt="Icon"
                    src={card.icon}
                  />
                </div>
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[16px] leading-[140%] tracking-[0px] text-[#384250]">
                  {card.title}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col items-start gap-1 relative self-stretch w-full">
            <div
              className={`relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-[14px] leading-[140%] tracking-[0px] text-[#6C737F] ${card.isCentered ? "text-center" : "text-center md:text-left"}`}
            >
              {card.description}
            </div>
          </div>
        </CardContent>

        {/* Cow spots container with overflow hidden */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          {isCenter ? (
            <>
              <CowSpot className="scale-[1.2]" direction="northeast" />
              <CowSpot className="md:scale-[3]" direction="southwest" />
            </>
          ) : (
            <CowSpot className=" scale-[.5] md:scale-[1.1]" direction="southeast" />
          )}
        </div>
      </Card>
    );
  };

  return (
    <MarketingContainer>
      <section 
        className="flex flex-col items-center gap-6 md:gap-8 lg:gap-10 xl:gap-14 relative"
      >
      {/* Header */}
      <header className="inline-flex flex-col items-center gap-1 relative">
        <h1 className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-neutral900 text-[32px] sm:text-[34px] md:text-[36px] lg:text-[38px] xl:text-[40px] text-center tracking-[-2.00px] leading-[normal] whitespace-nowrap">
          Renting shouldn&apos;t be so hard.
        </h1>
        <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-medium text-[20px] sm:text-[21px] md:text-[22px] lg:text-[23px] xl:text-[24px] leading-[100%] tracking-[0px] text-center text-[#6C737F] whitespace-nowrap">
          Now, it doesn&apos;t have to be.
        </p>
      </header>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 md:grid-rows-2 gap-3 sm:gap-4 md:gap-3 lg:gap-5 xl:gap-6 w-full">
        {/* Row 1 Mobile: Left Column Top */}
        <div className="col-span-1 md:col-span-1 md:row-span-1">
          {renderFeatureCard(
            featureCards.find((card) => card.position === "left-top"),
          )}
        </div>

        {/* Row 1 Mobile: Left Column Bottom */}
        <div className="col-span-1 md:col-span-1 md:row-span-1 md:order-4">
          {renderFeatureCard(
            featureCards.find((card) => card.position === "left-bottom"),
          )}
        </div>

        {/* Row 2 Mobile: Center Column - spans 2 rows on desktop, 2 columns on mobile */}
        <div className="col-span-2 md:col-span-1 md:row-span-2 md:order-2">
          {renderFeatureCard(
            featureCards.find((card) => card.position === "center"),
          )}
        </div>

        {/* Row 3 Mobile: Right Column Top */}
        <div className="col-span-1 md:col-span-1 md:row-span-1 md:order-3">
          {renderFeatureCard(
            featureCards.find((card) => card.position === "right-top"),
          )}
        </div>

        {/* Row 3 Mobile: Right Column Bottom */}
        <div className="col-span-1 md:col-span-1 md:row-span-1 md:order-5">
          {renderFeatureCard(
            featureCards.find((card) => card.position === "right-bottom"),
          )}
        </div>
      </div>

    </section>
    </MarketingContainer>
  );
}
