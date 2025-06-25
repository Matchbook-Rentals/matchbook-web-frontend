import { HomeIcon } from "lucide-react";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export const HeroFrame = (): JSX.Element => {
  return (
    <Card className="w-[1143px] px-[100px] py-10 flex flex-col items-center justify-center gap-3 rounded-xl border border-[#d1d5da]">
      <CardContent className="p-0 flex flex-col items-center w-full">
        <div className="flex flex-col items-center">
          <p className="w-fit [font-family:'Lora',Helvetica] font-semibold text-[#0b6969] text-base text-center">
            Earn More, Keep More
          </p>
          <h1 className="w-fit [font-family:'Lora',Helvetica] font-medium text-gray-neutral900 text-[56px] text-center tracking-[-2.00px]">
            Become a Host
          </h1>
        </div>

        <Breadcrumb className="mt-3">
          <BreadcrumbList className="flex items-center gap-[15px]">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <HomeIcon className="w-6 h-6" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="font-text-md-regular text-gray-3500">
              /
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink className="[font-family:'Poppins',Helvetica] font-normal text-gray-3900 text-base leading-6">
                Become a host
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CardContent>
    </Card>
  );
};

export const FeaturesSection = (): JSX.Element => {
  // Feature data for mapping
  const features = [
    {
      id: 1,
      title: "We Don't Charge You a Dime",
      description: "MatchBook is completely free for Host.",
      imageUrl: "/image.png",
    },
    {
      id: 2,
      title: "Application Management Simplified",
      description:
        "Receive, review, and approve applications effortlessly on our platform.",
      imageUrl: "/image-1.png",
    },
    {
      id: 3,
      title: "Collect Rent Automatically",
      description:
        "Rent is automatically collected and securely transferred to you every month.",
      imageUrl: "/image-2.png",
      overlay: true,
    },
    {
      id: 4,
      title: "Connect with MatchBook Verified Renters",
      description:
        "Choose to accept only MatchBook Verified Renters for a worry-free experience.",
      imageUrl: "/image-3.png",
    },
  ];

  return (
    <section className="flex flex-col items-center gap-14 px-[150px] py-16">
      <header className="inline-flex flex-col items-center gap-1">
        <h1 className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
          Why Hosts Love MatchBook
        </h1>
      </header>

      <div className="flex flex-col items-start gap-6 w-full">
        {/* First row of cards */}
        <div className="flex items-center gap-6 w-full">
          {features.slice(0, 2).map((feature) => (
            <Card
              key={feature.id}
              className="flex flex-col min-w-80 items-start gap-5 flex-1 self-stretch border-none"
            >
              <div
                className={`w-full h-60 rounded-xl bg-cover bg-center`}
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              <CardContent className="flex flex-col items-start gap-6 p-0 w-full">
                <div className="flex-col gap-4 flex items-start w-full">
                  <div className="flex-col gap-2 flex items-start w-full">
                    <div className="gap-4 flex items-start w-full">
                      <h2 className="flex-1 mt-[-1.00px] font-['Poppins',Helvetica] text-2xl tracking-[0] leading-8">
                        <span className="font-semibold text-[#101828]">
                          {feature.id}.{" "}
                        </span>
                        <span className="text-[#101828]">{feature.title}</span>
                      </h2>
                    </div>
                    <p className="font-['Poppins',Helvetica] font-normal text-[#484a54] text-base tracking-[0] leading-6">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second row of cards */}
        <div className="flex items-center gap-6 w-full">
          {features.slice(2, 4).map((feature) => (
            <Card
              key={feature.id}
              className="flex flex-col min-w-80 items-start gap-5 flex-1 self-stretch border-none"
            >
              <div
                className={`w-full h-60 rounded-xl bg-cover bg-center ${feature.overlay ? "bg-[linear-gradient(0deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.03)_100%)]" : ""}`}
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              <CardContent className="flex flex-col items-start gap-6 p-0 w-full">
                <div className="flex-col gap-4 flex items-start w-full">
                  <div className="flex-col gap-2 flex items-start w-full">
                    <div className="gap-4 flex items-start w-full">
                      <h2 className="flex-1 mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#101828] text-2xl tracking-[0] leading-8">
                        <span className="font-semibold">{feature.id}. </span>
                        <span>{feature.title}</span>
                      </h2>
                    </div>
                    <p className="font-['Poppins',Helvetica] font-normal text-[#484a54] text-base tracking-[0] leading-6">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button
        className="w-[221px] bg-teal-600 hover:bg-teal-700 text-white"
        asChild
      >
        <a href="#">List Your Property</a>
      </Button>
    </section>
  );
};

export default function HostsPage(): React.ReactNode {
  return (
    <div className="bg-background">
      <div className="flex justify-center p-8">
        <HeroFrame />
      </div>
      <FeaturesSection />
    </div>
  );
}
