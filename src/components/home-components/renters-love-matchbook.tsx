import React from "react";
import { Card, CardContent } from "../../components/ui/card";

export const RentersLoveMatchbook = (): JSX.Element => {
  const features = [
    {
      id: 1,
      title: "One Application. One Click. Unlimited Options",
      description:
        "Fill out your application once. Then apply to any property on MatchBook with a single click.",
      image: "/marketing-images/unlimited-avatar.png",
      imageAlt: "Application illustration",
    },
    {
      id: 2,
      title: "Transparent Pricing",
      description:
        "No surprise fees. What you see on the listing is what you pay.",
      image: "/marketing-images/pricing-avatar.png",
      imageAlt: "Transparent pricing illustration",
    },
    {
      id: 3,
      title: "Review Your Hosts",
      description:
        "You get rated, so do they. Read honest reviews from other renters before booking.",
      image: "/marketing-images/review-avatar.png",
      imageAlt: "Review illustration",
    },
    {
      id: 4,
      title: "Get MatchBook Verified and Stay in Control",
      description:
        "Pay $25 once for your credit, criminal, and eviction check. Share it with any MatchBook listing — no extra fees.",
      image: "/marketing-images/verified-avatar.png",
      imageAlt: "MatchBook verification icon",
    },
    {
      id: 5,
      title: "Sign and Book and Pay in One Place",
      description:
        "Found the right fit? Sign your rental agreement and pay directly through MatchBook. No emails, no PDFs, no back-and-forth.",
      image: "/marketing-images/in-one-place-avatar.png",
      imageAlt: "Sign and book illustration",
    },
  ];

  return (
    <section className="relative w-full max-w-[990px] mx-auto">
      <div className="flex flex-col items-center gap-16 py-12">
        <h1 className="font-normal text-[#1d221b] text-5xl md:text-6xl text-center tracking-[-0.48px] leading-[52px]">
          Why Renters love MatchBook
        </h1>

        {features.map((feature, index) => (
          <Card key={feature.id} className="w-full border-none shadow-none">
            <CardContent className="flex flex-col py-0">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-2 items-center gap-0 md:max-h-[250px]">
                {/* Mobile: always stack title, description, image. Desktop: alternate layout */}
                <div className="flex flex-col w-full md:hidden space-y-6">
                  <h2 className="font-normal text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px] text-left">
                    {feature.title}
                  </h2>
                  <p className="font-poppins font-normal text-[#1d221b] text-xl tracking-[0] leading-[30px] text-left">
                    {feature.description}
                  </p>
                  <div className="flex justify-center w-full">
                    <img
                      className="w-auto h-auto object-cover max-h-[200px]"
                      alt={feature.imageAlt}
                      src={feature.image}
                    />
                  </div>
                </div>
                
                {/* Desktop only: alternating layout */}
                {index % 2 === 1 ? (
                  <>
                    <div className="hidden md:flex flex-col items-start pr-2 w-full space-y-8"> {/* Adjusted spacing */}
                      <h2 className="font-normal text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                        {feature.title}
                      </h2>
                      <p className="font-poppins font-normal text-[#1d221b] text-xl tracking-[0] leading-[30px]">
                        {feature.description}
                      </p>
                    </div>
                    <div className="hidden md:flex w-1/2 justify-end items-center h-full">
                      <img
                        className="w-auto h-auto object-cover max-h-[250px] ml-auto"
                        alt={feature.imageAlt}
                        src={feature.image}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hidden md:flex w-1/2 justify-start items-center h-full">
                      <img
                        className="w-auto h-auto object-cover max-h-[250px]"
                        alt={feature.imageAlt}
                        src={feature.image}
                      />
                    </div>
                    <div className="hidden md:flex flex-col items-end pl-2 w-full space-y-8"> {/* Adjusted spacing */}
                      <h2 className="font-normal text-right text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                        {feature.title}
                      </h2>
                      <p className="font-poppins font-normal text-right text-[#1d221b] text-xl tracking-[0] leading-[30px]">
                        {feature.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
