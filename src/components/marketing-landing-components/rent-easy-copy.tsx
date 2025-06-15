import React from "react";
import FeatureCard from "./feature-card";

// Feature card data for mapping
const featureCards = [
  {
    title: "Transparent Pricing",
    description:
      "No surprise fees. What you see on the listing is what you pay.",
    position: "col-span-1 row-span-1",
    speechBubble: {
      imageSrc: "/image-5.png",
      position: "-top-[90px] -left-[75px]", // Northwest corner
      angle: 90,
      horizontalReflection: false,
    },
  },
  {
    title: "Review Your Hosts",
    description:
      "You get rated, so do they. Read honest reviews from other renters before booking.",
    position: "col-span-1 row-span-1",
    speechBubble: {
      imageSrc: "/image-8.png",
      position: "-bottom-[90px] -left-[75px]", // Southwest corner
      angle: 0,
      horizontalReflection: false,
      bubblePosition: 'top',
    },
  },
  {
    title: "Get MatchBook Verified and Stay in Control",
    description:
      "Found the right fit? Sign your rental agreement and pay directly through MatchBook. No emails, no PDFs, no back-and-forth.",
    position: "col-span-2 row-span-1",
    speechBubble: {
      imageSrc: "/image-6.png",
      position: "-top-[90px] left-1/2 -translate-x-1/2 -ml-[5px]", // True north from center
      angle: 135,
      horizontalReflection: false,
    },
  },
  {
    title: "One Application, One Click, Unlimited Options",
    description:
      "Fill out your application once. Then apply to any property on MatchBook with a single click.",
    position: "col-span-1 row-span-1",
    speechBubble: {
      imageSrc: "/1-4568.png",
      position: "-top-[90px] -right-[65px]", // Northeast corner
      angle: 180,
      horizontalReflection: false,
    },
  },
  {
    title: "Sign, Book, and Pay in One Place",
    description:
      "Found the right fit? Sign your rental agreement and pay directly through MatchBook. No emails, no PDFs, no back-and-forth.",
    position: "col-span-1 row-span-1",
    speechBubble: {
      imageSrc: "/image-7.png",
      position: "-bottom-[90px] -right-[65px]", // Southeast corner
      angle: 270,
      horizontalReflection: false,
      bubblePosition: 'top',
    },
  },
];


export default function RentEasyCopy(): JSX.Element {
  return (
    <section className="flex flex-col  items-center gap-14 px-[150px] mt-8 mb-40 relative">
      {/* Header */}
      <header className="inline-flex flex-col items-center gap-1 relative">
        <h1 className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
          Renting shouldn&apos;t be so hard.
        </h1>
        <p className="relative self-stretch font-text-heading-small-medium font-[number:var(--text-heading-small-medium-font-weight)] text-gray-neutral500 text-[length:var(--text-heading-small-medium-font-size)] text-center tracking-[var(--text-heading-small-medium-letter-spacing)] leading-[var(--text-heading-small-medium-line-height)] [font-style:var(--text-heading-small-medium-font-style)]">
          Now, it doesn&apos;t have to be.
        </p>
      </header>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-4 gap-6 w-full">
        {/* Left Column */}
        <div className="col-span-1 flex flex-col gap-6">
          <FeatureCard
            title={featureCards[0].title}
            description={featureCards[0].description}
            speechBubble={featureCards[0].speechBubble}
          />
          <FeatureCard
            title={featureCards[1].title}
            description={featureCards[1].description}
            speechBubble={featureCards[1].speechBubble}
          />
        </div>

        {/* Center Column */}
        <div className="col-span-2 h-full">
          <FeatureCard
            title={featureCards[2].title}
            description={featureCards[2].description}
            speechBubble={featureCards[2].speechBubble}
            isCenter={true}
          />
        </div>

        {/* Right Column */}
        <div className="col-span-1 flex flex-col gap-6">
          <FeatureCard
            title={featureCards[3].title}
            description={featureCards[3].description}
            speechBubble={featureCards[3].speechBubble}
          />
          <FeatureCard
            title={featureCards[4].title}
            description={featureCards[4].description}
            speechBubble={featureCards[4].speechBubble}
          />
        </div>
      </div>

    </section>
  );
}
