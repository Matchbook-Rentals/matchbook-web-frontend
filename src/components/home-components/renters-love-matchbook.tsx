
import React from "react";
import { Card, CardContent } from "../../components/ui/card";

export const RentersLoveMatchbook = (): JSX.Element => {
  // Define the feature sections data for easier mapping
  const features = [
    {
      id: 1,
      title: "Transparent Pricing",
      description:
        "No surprise fees. What you see on the listing is what you pay.",
      image: "/marketing-images/renters-1.png",
      imageAlt: "Transparent pricing illustration",
      alignment: "left",
    },
    {
      id: 2,
      title: "One Application. One Click. Unlimited options",
      description:
        "Fill out your application once. Then apply to any property on MatchBook with a single click.",
      image: "/marketing-images/renters-2.png",
      imageAlt: "Application illustration",
      alignment: "right",
    },
    {
      id: 3,
      title: "Get MatchBook Verified and Stay in Control",
      description:
        "Pay $25 once for your credit, criminal, and eviction check. Share it with any Matchbook listing — no extra fees. Can't find the right place? We'll send your screening to any landlord.",
      image: "/marketing-images/renters-3.png",
      imageAlt: "MatchBook verification icon",
      alignment: "left",
    },
    {
      id: 4,
      title: "Review Your Hosts",
      description:
        "You get rated, so do they. Read honest reviews from other renters before booking.",
      image: "/marketing-images/renters-4.png",
      imageAlt: "Review illustration",
      alignment: "right",
    },
    {
      id: 5,
      title: "Sign and Book in One Place",
      description:
        "Found the right fit? Sign your rental agreement and send your deposit right on Matchbook. No emails, no PDFs, no back-and-forth.",
      image: "/marketing-images/renters-5.png",
      imageAlt: "Sign and book illustration",
      alignment: "left",
    },
  ];

  return (
    <section className="relative w-full max-w-[1344px] mx-auto">
      <div className="flex flex-col items-center gap-16 py-12">
        <h1 className="font-['Cutive',serif] font-normal text-[#1d221b] text-5xl text-center tracking-[-0.48px] leading-[52px]">
          Why Renters love MatchBook
        </h1>

        {features.map((feature) => (
          <Card key={feature.id} className="w-full border-none shadow-none">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {feature.alignment === "left" ? (
                  <>
                    <div className="flex flex-col w-full md:w-1/2 space-y-4">
                      <h2 className="font-['Cutive',serif] font-normal text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                        {feature.title}
                      </h2>
                      <p className="font-poppins font-medium text-[#1d221b] text-2xl tracking-[0] leading-[30px]">
                        {feature.description}
                      </p>
                    </div>
                    <div className="w-full md:w-1/2 flex justify-end relative">
                        <img
                          className="w-auto h-auto max-h-[280px] object-cover"
                          alt={feature.imageAlt}
                          src={feature.image}
                        />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full md:w-1/2 flex justify-start order-2 md:order-1">
                      <img
                        className="w-auto h-auto max-h-[280px] object-cover"
                        alt={feature.imageAlt}
                        src={feature.image}
                      />
                    </div>
                    <div className="flex flex-col w-full md:w-1/2 space-y-4 text-left md:text-right order-1 md:order-2">
                      <h2 className="font-['Cutive',serif] font-normal text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                        {feature.title}
                      </h2>
                      <p className="font-poppins font-medium text-[#1d221b] text-2xl tracking-[0] leading-[30px]">
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
