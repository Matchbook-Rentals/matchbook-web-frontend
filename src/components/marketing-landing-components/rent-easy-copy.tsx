import React, { useRef, useEffect, useState } from "react";
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
      "Pay $25 once for your credit, criminal, and eviction check. Share it with any Matchbook listing",
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
  const sectionRef = useRef<HTMLElement>(null);
  const [componentHeight, setComponentHeight] = useState<number>(0);

  useEffect(() => {
    const measureHeight = () => {
      if (sectionRef.current) {
        const height = sectionRef.current.offsetHeight;
        // mb-40 = 160px (40 * 4), mt-8 = 32px (8 * 4) in Tailwind
        const totalHeight = height + 160 + 32;
        setComponentHeight(totalHeight);
        console.log(`RentEasyCopy component height: ${height}px + margins: ${totalHeight}px`);
      }
    };

    measureHeight();
    window.addEventListener('resize', measureHeight);
    
    return () => window.removeEventListener('resize', measureHeight);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="flex flex-col  items-center gap-14 px-[150px] mt-8 mb-40 relative max-w-[1600px] mx-auto"
    >
      {/* Header */}
      <header className="inline-flex flex-col items-center gap-1 relative">
        <h1 className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
          Renting shouldn&apos;t be so hard.
        </h1>
        <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-medium text-[24px] leading-[100%] tracking-[0px] text-center text-[#6C737F]">
          Now, it doesn&apos;t have to be. ({componentHeight}px)
        </p>
      </header>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-3 grid-rows-2 gap-6 w-full">
        {/* Left Column */}
        <div className="col-span-1 row-span-1">
          <FeatureCard
            title={featureCards[0].title}
            description={featureCards[0].description}
            speechBubble={featureCards[0].speechBubble}
            cowSpots={['southeast']}
          />
        </div>

        {/* Center Column - spans 2 rows */}
        <div className="col-span-1 row-span-2">
          <FeatureCard
            title={featureCards[2].title}
            description={featureCards[2].description}
            speechBubble={featureCards[2].speechBubble}
            isCenter={true}
            cowSpots={['northeast', 'southwest']}
          />
        </div>

        {/* Right Column Top */}
        <div className="col-span-1 row-span-1">
          <FeatureCard
            title={featureCards[3].title}
            description={featureCards[3].description}
            speechBubble={featureCards[3].speechBubble}
            cowSpots={['southeast']}
          />
        </div>

        {/* Left Column Bottom */}
        <div className="col-span-1 row-span-1">
          <FeatureCard
            title={featureCards[1].title}
            description={featureCards[1].description}
            speechBubble={featureCards[1].speechBubble}
            cowSpots={['southeast']}
          />
        </div>

        {/* Right Column Bottom */}
        <div className="col-span-1 row-span-1">
          <FeatureCard
            title={featureCards[4].title}
            description={featureCards[4].description}
            speechBubble={featureCards[4].speechBubble}
            cowSpots={['southeast']}
          />
        </div>
      </div>

    </section>
  );
}
