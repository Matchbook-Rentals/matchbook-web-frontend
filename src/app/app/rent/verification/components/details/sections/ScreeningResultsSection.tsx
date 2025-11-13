"use client"

import React from "react";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";

const screeningResults = [
  {
    icon: "/icon_png/verification/credit-score-icon.png",
    title: "Credit Score Range:",
    status: "Very Good (740–799)",
    description: "Based on soft credit pull.",
  },
  {
    icon: "/icon_png/verification/eviction-hisotry-icon.png",
    title: "Eviction History",
    status: "No Records Found",
    description: "No public eviction records or property damage claims found.",
  },
  {
    icon: "/icon_png/verification/criminal-history-icon.png",
    title: "Criminal Record",
    status: "No Records Found",
    description: "No felony or misdemeanor records found.",
  },
];

export const ScreeningResultsSection = (): JSX.Element => {
  const { user } = useUser();

  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "Loading...";
  const location = "Salt Lake City"; // TODO: Add location from user metadata

  return (
    <section className="flex flex-col items-end gap-8 w-full">
      <div className="flex flex-col items-start gap-5 w-full">
        <div className="flex items-start gap-5 w-full">
          <Card className="w-[368px] bg-[#f8ffff] rounded-xl border-[#e6e6e6]">
            <CardContent className="flex flex-col items-center gap-6 p-6">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="flex flex-col w-[139px] items-center relative">
                  <div className="relative w-[139px] h-[139px] rounded-full overflow-hidden">
                    <AvatarWithFallback
                      src={user?.imageUrl}
                      firstName={user?.firstName || undefined}
                      lastName={user?.lastName || undefined}
                      email={user?.emailAddresses?.[0]?.emailAddress}
                      alt={fullName}
                      className="w-full h-full object-cover rounded-full"
                      size={139}
                    />
                  </div>

                  <Badge className="inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 mt-4 bg-[#e9f7ee] rounded-full border border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee] h-auto relative z-10">
                    <img className="w-4 h-4" alt="Verified" src="/tick.svg" />
                    <span className="text-sm font-medium">
                      Verified
                    </span>
                  </Badge>
                </div>

                <div className="flex flex-col w-[154px] items-center">
                  <div className="self-stretch text-[#484a54] text-lg font-medium text-center">
                    {fullName}
                  </div>

                  <div className="self-stretch text-[#777b8b] text-xs text-center">
                    {location}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col w-[110px] items-start gap-3">
                  <div className="self-stretch text-[#484a54] text-xs">
                    Screening Date:
                  </div>

                  <div className="self-stretch text-[#484a54] text-xs">
                    Valid Until:
                  </div>
                </div>

                <div className="flex flex-col w-[110px] items-start gap-3">
                  <div className="self-stretch text-[#777b8b] text-sm text-right">
                    June 25, 2025
                  </div>

                  <div className="self-stretch text-[#777b8b] text-sm text-right">
                    Sept 25, 2025
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-white rounded-xl border-[#e6e6e6]">
            <CardContent className="flex flex-col items-start gap-6 p-6">
              <div className="flex items-center gap-6 w-full">
                <h2 className="font-medium text-black text-lg">
                  Screening Results
                </h2>
              </div>

              <div className="flex items-start gap-6 w-full">
                <div className="flex flex-col items-start gap-3 flex-1">
                  {screeningResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-start gap-2 pt-0 pb-2 px-0 w-full ${
                        index < screeningResults.length - 1
                          ? "border-b border-[#e6e6e6]"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-start gap-[3px] w-full">
                        <div className="flex items-center gap-2 p-1.5 w-full">
                          <img
                            className="w-4 h-4"
                            alt={result.title}
                            src={result.icon}
                          />

                          <div className="text-[#484a54] text-sm font-medium">
                            {result.title}
                          </div>
                        </div>

                        <div className="self-stretch text-[#0b6969] text-xs font-medium">
                          {result.status}
                        </div>
                      </div>

                      <div className="self-stretch text-[#484a54] text-xs">
                        {result.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-[164px] bg-white rounded-xl border-[#e6e6e6] w-full">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="flex items-center gap-6 w-full">
              <h2 className="font-medium text-black text-base">
                Status &amp; Recommendations
              </h2>
            </div>

            <div className="flex flex-col items-start gap-2 w-full">
              <div className="flex flex-col items-start gap-[3px] w-full">
                <div className="flex items-center gap-2 p-1.5 w-full">
                  <img className="w-4 h-4" alt="Status" src="/icon_png/verification/criminal-history-icon.png" />

                  <div className="text-[#484a54] text-sm font-medium">
                    Status
                  </div>
                </div>

                <div className="self-stretch text-[#0b6969] text-xs font-medium">
                  Verified
                </div>
              </div>

              <div className="self-stretch text-[#484a54] text-xs">
                You&apos;re all set to apply to listings. Hosts can trust your
                record and history.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="inline-flex items-center gap-6">
        <Button
          variant="outline"
          className="items-center justify-center gap-1.5 px-[18px] py-3 rounded-lg border-[#3c8787] bg-transparent hover:bg-transparent h-auto"
        >
          <span className="font-semibold text-[#3c8787] text-base">
            Print PDF
          </span>
          <img className="w-5 h-5" alt="Print icon" src="/icon.svg" />
        </Button>
      </div>
    </section>
  );
};
