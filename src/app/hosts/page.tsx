

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
      image: "/marketing-images/App-management.png",
      imageAlt: "Application management illustration",
      align: "left",
    },
    {
      title: "Collect Rent Automatically",
      description:
        "Rent is automatically collected and securely transferred to you every month.",
      align: "right",
      image: "/marketing-images/auto-collect.png",
      imageAlt: "Application management illustration",
    },
    {
      title: "Connect with Matchbook Verified Renters",
      description:
        "Pre-screened and ready to book. Renters pay upfront for their background, credit, and eviction check, giving you instant access to verified details. Choose to accept only MatchBook Verified Renters for a worry-free experience.",
      image: "/marketing-images/verified-renters.png",
      imageAlt: "Application management illustration",
      align: "left",
    },
    {
      title: "Real Reviews, Reliable Renters, Worry-Free Renting",
      description:
        "Choose renters you can trust. Our review system gives you insight into their past rentals, making worry-free renting a reality.",
      image: "/marketing-images/worry-free.png",
      imageAlt: "Application management illustration",
      align: "right",
    },
    {
      title: "Ditch the paperwork",
      description:
        "Bookings generate automatic rental agreements, streamlining the leasing process—no paperwork, no waiting. Your business, modernized.",
      image: "/marketing-images/ditch-paperwork.png",
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
      <section className="relative w-full max-w-[990px] mx-auto px-4 md:px-0">
        <div className="flex flex-col items-center gap-16 py-12">
          {features.map((feature, index) => (
            <Card key={index} className="w-full border-none shadow-none">
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
                    {feature.image && (
                      <div className="flex justify-center w-full">
                        <img
                          className="w-[200px] h-[200px] object-contain" // Use contain to prevent cropping
                          alt={feature.imageAlt}
                          src={feature.image}
                        />
                      </div>
                    )}
                  </div>

                  {/* Desktop only: alternating layout */}
                  {index % 2 === 1 ? ( // Odd index, text left, image right
                    <>
                      <div className="hidden md:flex flex-col items-start pr-2 w-full space-y-12">
                        <h2 className="font-normal text-[#1d221b] text-4xl tracking-[-0.36px] leading-[45px]">
                          {feature.title}
                        </h2>
                        <p className="font-poppins font-normal text-[#1d221b] text-xl tracking-[0] leading-[30px]">
                          {feature.description}
                        </p>
                      </div>
                      {feature.image && (
                        <div className="hidden md:flex w-1/2 justify-end items-center h-full">
                          <img
                            className="w-[250px] h-[250px] object-contain ml-auto" // Use contain to prevent cropping
                            alt={feature.imageAlt}
                            src={feature.image}
                          />
                        </div>
                      )}
                    </>
                  ) : ( // Even index, image left, text right
                    <>
                      {feature.image && (
                        <div className="hidden md:flex w-1/2 justify-start items-center h-full">
                          <img
                            className="w-[250px] h-[250px] object-contain" // Use contain to prevent cropping
                            alt={feature.imageAlt}
                            src={feature.image}
                          />
                        </div>
                      )}
                      <div className="hidden md:flex flex-col items-end pl-2 w-full space-y-12">
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

      {/* CTA Section */}
      <section className="w-full max-w-[1344px] px-8 lg:px-16 py-16 lg:py-20 xl:py-28 flex flex-col items-center gap-8 lg:gap-12">
        <h2 className="font-['Poppins',Helvetica] font-normal text-5xl md:text-6xl text-[#1d221b] text-center tracking-[-0.48px] leading-[52px]">
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
