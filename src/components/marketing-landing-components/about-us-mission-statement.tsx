import React from "react";
import { Card, CardContent } from "../ui/card";
import { Shield, Home, Heart, ThumbsUp as CheckCircle } from "lucide-react";
import { HandshakeIcon } from "../icons/handshake";

export const Frame = (): JSX.Element => {
  const missionValues = [
    {
      Icon: Shield,
      title: "Honesty & Integrity",
      description:
        "We value transparent communication and ethical practices. No hidden fees or misleading listings.",
    },
    {
      Icon: Home,
      title: "Simplifying Rentals",
      description:
        "Our platform makes finding or listing flexible housing smooth and straightforward.",
    },
    {
      Icon: HandshakeIcon,
      title: "Relationships Over Transactions",
      description:
        "We prioritize long-term partnerships over quick gains for both customers and team members.",
    },
  ];

  const additionalValues = [
    {
      Icon: Heart,
      title: "Real Value, Upfront",
      description:
        "We deliver services that matter without the fluff, starting with trust and clarity.",
    },
    {
      Icon: CheckCircle,
      title: "A Better Experience for All",
      description:
        "We aim to make renting not just fair, but genuinely enjoyable for hosts and renters alike.",
    },
  ];

  return (
    <section className="flex flex-col items-start gap-[54px] px-[5%] md:px-[10%] lg:px-[150px] py-16 relative bg-[#e7f0f04c]">
      <header className="flex flex-col items-center gap-1 relative self-stretch w-full">
        <h3 className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
          Tenant Screening and Rental Tools
        </h3>

        <div className="flex flex-col items-center gap-4 relative self-stretch w-full">
          <p className="relative w-full max-w-[720px] mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-neutral900 text-[length:var(--text-label-medium-regular-font-size)] text-center tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
At MatchBook, we’re reshaping the rental experience by putting people first. Whether you’re offering or seeking flexible housing, our mission is to make the process transparent, stress-free, and fair for everyone involved.
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-6 relative self-stretch w-full max-w-[1200px] mx-auto">
        {[...missionValues, ...additionalValues].map((value, index) => (
          <Card
            key={index}
            className="flex flex-col items-start gap-2 px-4 py-6 relative bg-white rounded-xl border border-solid border-[#e5e7ea] w-full md:w-[364px] md:h-[252px]"
          >
            <CardContent className="flex flex-col items-center gap-4 relative self-stretch w-full p-0 md:h-full">
              <div className="relative w-11 h-11 bg-white rounded  flex items-center justify-center">
                <value.Icon className="w-6 h-6 text-gray-600" />
              </div>

              <div className="flex flex-col items-center gap-2 relative self-stretch w-full md:flex-grow">
                <h2 className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-[#101828] text-[20px] md:text-2xl text-center tracking-[0] leading-8">
                  {value.title}
                </h2>

                <p className="relative self-stretch font-['Poppins',Helvetica] font-normal text-[#484a54] text-base text-center tracking-[0] leading-6">
                  {value.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
