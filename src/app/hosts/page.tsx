

import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Footer from "@/components/marketing-landing-components/footer";

export default function AboutHostingPage(): React.ReactNode {
  // Feature data for mapping
  const features = [
    {
      title: "Application Management, Simplified",
      description:
        "Receive, review, and approve applications effortlessly on our platform.",
      image: "/marketing-images/laptop-application.png",
      imageAlt: "Application management illustration",
      align: "left",
    },
    {
      title: "Collect Rent Automatically",
      description:
        "Rent is automatically collected and securely transferred to you every month.",
      align: "right",
    },
    {
      title: "Connect with Matchbook Verified Renters",
      description:
        "Pre-screened and ready to book. Renters pay upfront for their background, credit, and eviction check, giving you instant access to verified details. Choose to accept only MatchBook Verified Renters for a worry-free experience.",
      image: "/marketing-images/id-application.png",
      imageAlt: "Application management illustration",
      align: "left",
    },
    {
      title: "Real Reviews, Reliable Renters, Worry-Free Renting",
      description:
        "Choose renters you can trust. Our review system gives you insight into their past rentals, making worry-free renting a reality.",
      align: "right",
    },
    {
      title: "Ditch the paperwork",
      description:
        "Bookings generate automatic rental agreements, streamlining the leasing process—no paperwork, no waiting. Your business, modernized.",
      image: "/marketing-images/SHREDZ.png",
      imageAlt: "Reviews illustration",
      align: "left",
    },
  ];

  return (
    <>
    <MatchbookHeader />
    <div className="flex flex-col items-center bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="w-full max-w-[1344px] px-8 lg:px-16 py-16 lg:py-20 xl:py-24 flex flex-col items-center">
        <h1 className="font-['Cutive',Helvetica] text-[120px] text-[#1d221b] text-center tracking-[-2.40px] leading-[120px]">
          Earn More, Keep More
        </h1>

        <h2 className="mt-16 lg:mt-20 font-['Cutive',Helvetica] text-5xl text-[#1d221b] text-center tracking-[-0.48px] leading-[52px]">
          Why Hosts Love MatchBook
        </h2>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-[1344px] px-8 lg:px-16 mb-8 lg:mb-12">
        <div className="flex flex-col gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-none">
              <CardContent
                className={`flex ${feature.align === "right" ? "flex-row-reverse" : "flex-row"} items-center gap-8 lg:gap-16 p-0`}
              >
                <div
                  className={`flex-1 ${feature.align === "right" ? "text-right" : "text-left"}`}
                >
                  <h3 className="font-['Cutive',Helvetica] font-normal text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 font-['Poppins',Helvetica] font-medium text-[#1d221b] text-2xl tracking-[0] leading-[30px]">
                    {feature.description}
                  </p>
                </div>

                {feature.image && (
                  <div className="flex-1 flex justify-center">
                    <img
                      src={feature.image}
                      alt={feature.imageAlt}
                      className="w-[434px] h-[434px] object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-[1344px] px-8 lg:px-16 py-16 mt-16 lg:py-20 xl:py-28 flex flex-col items-center gap-8 lg:gap-12">
        <h2 className="font-['Poppins',Helvetica] font-normal text-6xl text-[#1d221b] text-center leading-6 tracking-[0]">
          Best part? It&apos;s completely free.
        </h2>

        <Button className="my-8 lg:my-16 px-8 py-3.5 bg-[#c68087ad] rounded-2xl hover:bg-[#c68087]">
          <span className="font-['Public_Sans',Helvetica] font-medium text-white text-xl tracking-[0] leading-6 whitespace-nowrap">
            List your Property
          </span>
        </Button>
      </section>
        <div className="mt-12" />
        <Footer />
    </div>
    </>
  );
};
