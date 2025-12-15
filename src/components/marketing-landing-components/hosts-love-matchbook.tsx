import React from "react";
import { BrandButton } from "../ui/brandButton";
import { Card, CardContent } from "../ui/card";

export const HostsLoveMatchbook = (): JSX.Element => {
  // Feature data for mapping
  const features = [
    {
      id: 1,
      title: "We Don't Charge You a Dime",
      description: "MatchBook is completely free for hosts. From listing your property to managing your bookings, using our platform is completely free.",
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
        "Matchbook Verified  Renters come pre-screened. View their credit range, criminal background, and eviction check. Get qualified renters without the awkward conversations.",
      imageUrl: "/marketing-images/hosts-love-us/4.png",
    },
  ];

  return (
    <section className="flex flex-col items-center gap-14 px-4 md:px-[100px] lg:px-[150px] py-16 max-w-[1600px] mx-auto">
      <header className="inline-flex flex-col items-center gap-1">
        <h2 className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
          Why Hosts Love MatchBook
        </h2>
      </header>

      <div className="flex flex-col items-start gap-6 w-full">
        {/* Desktop view - First row of cards */}
        <div className="hidden md:flex items-center gap-6 w-full">
          {features.slice(0, 2).map((feature) => (
            <Card
              key={feature.id}
              className="flex flex-col min-w-80 items-start gap-5 flex-1 self-stretch border-none shadow-none"
            >
              <div
                className={`w-full h-60 rounded-xl bg-cover bg-top`}
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              <CardContent className="flex flex-col items-start gap-6 p-0 w-full">
                <div className="flex-col gap-4 flex items-start w-full">
                  <div className="flex-col gap-2 flex items-start w-full">
                    <div className="gap-4 flex items-start w-full">
                      <h3 className="flex-1 mt-[-1.00px] font-['Poppins',Helvetica] text-2xl tracking-[0] leading-8">
                        <span className="font-semibold text-[#101828]">
                          {feature.id}.{" "}
                        </span>
                        <span className="text-[#101828]">{feature.title}</span>
                      </h3>
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

        {/* Desktop view - Second row of cards */}
        <div className="hidden md:flex items-center gap-6 w-full">
          {features.slice(2, 4).map((feature) => (
            <Card
              key={feature.id}
              className="flex flex-col min-w-80 items-start gap-5 flex-1 self-stretch border-none shadow-none"
            >
              <div
                className={`w-full h-60 rounded-xl bg-cover ${feature.id === 4 ? 'bg-center' : 'bg-top'} ${feature.overlay ? "bg-[linear-gradient(0deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.03)_100%)]" : ""}`}
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              <CardContent className="flex flex-col items-start gap-6 p-0 w-full">
                <div className="flex-col gap-4 flex items-start w-full">
                  <div className="flex-col gap-2 flex items-start w-full">
                    <div className="gap-4 flex items-start w-full">
                      <h3 className="flex-1 mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#101828] text-2xl tracking-[0] leading-8">
                        <span className="font-semibold">{feature.id}. </span>
                        <span>{feature.title}</span>
                      </h3>
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

        {/* Mobile view - Stacked cards */}
        <div className="flex md:hidden flex-col gap-6 w-full">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="flex flex-col w-full items-start gap-5 border-none"
            >
              <div
                className={`w-full h-60 rounded-xl bg-cover ${feature.id === 4 ? 'bg-center' : 'bg-top'} ${feature.overlay ? "bg-[linear-gradient(0deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.03)_100%)]" : ""}`}
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              <CardContent className="flex flex-col items-start gap-6 p-0 w-full">
                <div className="flex-col gap-4 flex items-start w-full">
                  <div className="flex-col gap-2 flex items-start w-full">
                    <div className="gap-4 flex items-start w-full">
                      <h3 className="flex-1 mt-[-1.00px] font-['Poppins',Helvetica] text-2xl tracking-[0] leading-8">
                        <span className="font-semibold text-[#101828]">
                          {feature.id}.{" "}
                        </span>
                        <span className="text-[#101828]">{feature.title}</span>
                      </h3>
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

      <BrandButton size="lg" href="/app/host/add-property">
        List Your Property
      </BrandButton>
    </section>
  );
};
