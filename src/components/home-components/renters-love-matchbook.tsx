import React from "react";
import { Card, CardContent } from "../../components/ui/card";

export const RentersLoveMatchbook = (): JSX.Element => {
  const features = [
    {
      id: 1,
      title: "One Application. One Click. Unlimited options",
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
        "Pay $25 once for your credit, criminal, and eviction check. Share it with any Matchbook listing — no extra fees. Can't find the right place? We'll send your screening to any landlord.",
      image: "/marketing-images/verified-avatar.png",
      imageAlt: "MatchBook verification icon",
    },
    {
      id: 5,
      title: "Sign and Book in One Place",
      description:
        "Found the right fit? Sign your rental agreement and send your deposit right on Matchbook. No emails, no PDFs, no back-and-forth.",
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
            <CardContent className="flex flex-col py-0 ">
              <div className="flex flex-col md:flex-row space-y-2  max-h-[250px] items-center gap-0">
                {index % 2 === 1 ? (
                  <>
                    <div className="flex flex-col items-center md:items-start pr-2 w-full space-y-12">
                      <h2 className="font-normal text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                        {feature.title}
                      </h2>
                      <p className="font-poppins font-normal text-[#1d221b] text-xl tracking-[0] leading-[30px]">
                        {feature.description}
                      </p>
                    </div>
                    <div className="w-full md:w-1/2 justify-center  md:justify-end items-center h-full">
                      <img
                        className="w-auto h-auto object-cover max-h-[250px] md:ml-auto "
                        alt={feature.imageAlt}
                        src={feature.image}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full md:w-1/2 flex justify-center md:justify-start items-center h-full">
                      <img
                        className="w-auto h-auto object-cover max-h-[250px]"
                        alt={feature.imageAlt}
                        src={feature.image}
                      />
                    </div>
                    <div className="flex flex-col items-center md:items-end pl-2 w-full space-y-12">
                      <h2 className="font-normal text-center md:text-right text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                        {feature.title}
                      </h2>
                      <p className="font-poppins font-normal text-center md:text-right text-[#1d221b] text-xl tracking-[0] leading-[30px]">
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
