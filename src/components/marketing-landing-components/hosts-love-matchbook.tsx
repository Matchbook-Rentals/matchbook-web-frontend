import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export const HostsLoveMatchbook = (): JSX.Element => {
  // Feature data for mapping
  const features = [
    {
      id: 1,
      title: "We Don't Charge You a Dime",
      description: "MatchBook is completely free for Host.",
      imageUrl: "/marketing-images/hosts-love-us/1.png",
    },
    {
      id: 2,
      title: "Application Management Simplified",
      description:
        "Receive, review, and approve applications effortlessly on our platform.",
      imageUrl: "/marketing-images/hosts-love-us/2.png",
    },
    {
      id: 3,
      title: "Collect Rent Automatically",
      description:
        "Rent is automatically collected and securely transferred to you every month.",
      imageUrl: "/marketing-images/hosts-love-us/3.png",
      overlay: true,
    },
    {
      id: 4,
      title: "Connect with MatchBook Verified Renters",
      description:
        "Choose to accept only MatchBook Verified Renters for a worry-free experience.",
      imageUrl: "/marketing-images/hosts-love-us/4.png",
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