import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export const VerificationStandOut = (): JSX.Element => {
  // Data for verification features
  const verificationFeatures = [
    {
      icon: "/marketing-images/verification/stand-out/1.svg",
      title: "Criminal History Check",
      description:
        "We run a comprehensive national check for criminal history.",
    },
    {
      icon: "/marketing-images/verification/stand-out/2.svg",
      title: "Credit Report (Score Range Only)",
      description:
        "MatchBook Renter Verification only shares your credit range so you can show you are reliable while maintaining privacy.",
    },
    {
      icon: "/marketing-images/verification/stand-out/3.svg",
      title: "Eviction History",
      description:
        "We access tens of millions of records nationwide to check for past court actions, evictions, monetary judgments, and property damage claims.",
    },
    {
      icon: "/marketing-images/verification/stand-out/4.svg",
      title: "Reusable Report for 3 Months",
      description:
        "Once complete, your verification is good for up to three months.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-[150px] py-16 relative bg-white">
      <Card className="flex flex-col w-[946px] items-center gap-10 px-[100px] py-8 relative bg-[#e7f0f0] rounded-xl overflow-hidden border-none">
        <CardContent className="flex flex-col w-full items-center gap-10 p-0">
          <div className="flex flex-col w-[568px] items-center gap-4 relative">
            <h1 className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
              Stand Out Without Breaking The Bank
            </h1>

            <h2 className="relative self-stretch font-text-heading-small-medium font-[number:var(--text-heading-small-medium-font-weight)] text-gray-neutral500 text-[length:var(--text-heading-small-medium-font-size)] text-center tracking-[var(--text-heading-small-medium-letter-spacing)] leading-[var(--text-heading-small-medium-line-height)] [font-style:var(--text-heading-small-medium-font-style)]">
              MatchBook Renter Verification Includes:
            </h2>
          </div>

          <div className="flex flex-col items-center gap-6 relative self-stretch w-full">
            <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
              {verificationFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 relative self-stretch w-full"
                >
                  <div className="absolute w-[42px] h-[43px] top-3.5 left-2 bg-[#b3d1d1] rounded-[21px/21.5px]" />

                  <img
                    className="relative w-[42px] h-[42px]"
                    alt="Feature icon"
                    src={feature.icon}
                  />

                  <div className="flex flex-col items-start gap-3 relative flex-1 grow">
                    <h3 className="relative self-stretch mt-[-1.00px] font-text-heading-xsmall-medium font-[number:var(--text-heading-xsmall-medium-font-weight)] text-[#373940] text-[length:var(--text-heading-xsmall-medium-font-size)] tracking-[var(--text-heading-xsmall-medium-letter-spacing)] leading-[var(--text-heading-xsmall-medium-line-height)] [font-style:var(--text-heading-xsmall-medium-font-style)]">
                      {feature.title}
                    </h3>

                    <p className="relative self-stretch font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#5d606d] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="relative w-[278px] h-[50px] bg-[#0a6b6c] text-white font-medium rounded-md hover:bg-[#085556] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Start Screening
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};