"use client"

import { DownloadIcon } from "lucide-react";
import React from "react";
import { useUser } from "@clerk/nextjs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";
import { BrandButton } from "@/components/ui/brandButton";

interface VerificationResultsScreenProps {
  onViewDetails?: () => void;
}

export const VerificationResultsScreen = ({ onViewDetails }: VerificationResultsScreenProps): JSX.Element => {
  const { user } = useUser();

  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "Loading...";
  const location = "Salt Lake City, UT"; // TODO: Add location from user metadata when available

  const verificationData = {
    verified: true,
    creditRange: "Good (670–739)",
    evictions: "No",
    criminalRecord: "No",
    screeningDate: "06/25/25",
    validUntil: "09/25/25",
  };

  const infoItems = [
    { label: "Credit Range:", value: verificationData.creditRange },
    { label: "Evictions:", value: verificationData.evictions },
    { label: "Criminal Record:", value: verificationData.criminalRecord },
  ];

  return (
    <div className="flex flex-col w-full items-start justify-center gap-4 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <span className="font-text-md-regular font-[number:var(--text-md-regular-font-weight)] text-gray-500 text-[length:var(--text-md-regular-font-size)] tracking-[var(--text-md-regular-letter-spacing)] leading-[var(--text-md-regular-line-height)] [font-style:var(--text-md-regular-font-style)]">
              /
            </span>
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-900 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
              MatchBook Renter Verification
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col items-start gap-6 w-full">
        <header className="flex flex-col w-full items-start gap-1">
          <h1 className="self-stretch mt-[-1.00px] font-text-heading-medium-medium font-[number:var(--text-heading-medium-medium-font-weight)] text-[#373940] text-[length:var(--text-heading-medium-medium-font-size)] tracking-[var(--text-heading-medium-medium-letter-spacing)] leading-[var(--text-heading-medium-medium-line-height)] [font-style:var(--text-heading-medium-medium-font-style)]">
            MatchBook Renter Verification Summary
          </h1>

          <p className="self-stretch [font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[-0.28px] leading-[normal]">
            Track, manage, and reuse your verification
          </p>
        </header>

        <Card className="w-full shadow-[0px_2px_12px_#0000001a]">
          <CardContent className="flex flex-col items-start justify-end gap-2 p-6">
            <div className="flex items-start justify-between self-stretch w-full">
              <div className="inline-flex items-center gap-[9px]">
                <AvatarWithFallback
                  src={user?.imageUrl}
                  firstName={user?.firstName || undefined}
                  lastName={user?.lastName || undefined}
                  email={user?.emailAddresses?.[0]?.emailAddress}
                  alt={fullName}
                  className="w-[81px] h-[85px] rounded-xl object-cover"
                  size={85}
                />

                <div className="flex flex-col w-[154px] items-start gap-2">
                  <div className="flex flex-col items-start self-stretch w-full">
                    <h2 className="self-stretch mt-[-1.00px] font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                      {fullName}
                    </h2>

                    <p className="self-stretch font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-xsmall-regular-font-size)] tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                      {location}
                    </p>
                  </div>

                  <Badge className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 h-auto bg-[#e9f7ee] rounded-full border border-solid border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee]">
                    <img
                      className="w-4 h-4"
                      alt="Tick"
                      src="/tick.svg"
                    />
                    <span className="w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                      Verified
                    </span>
                  </Badge>
                </div>
              </div>

              <div className="inline-flex items-center gap-3 p-1.5">
                <DownloadIcon className="w-6 h-6 text-[#484a54] cursor-pointer hover:text-[#0b6969]" />
                <BrandButton size="sm" onClick={onViewDetails}>
                  View
                </BrandButton>
              </div>
            </div>

            <div className="flex items-end justify-between self-stretch w-full">
              <div className="inline-flex items-end gap-6">
                {infoItems.map((item, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-3 p-3 rounded-lg border border-solid border-[#e6e6e6]"
                  >
                    <span className="w-fit mt-[-1.00px] font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#5d606d] text-[length:var(--text-label-xsmall-regular-font-size)] tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                      {item.label}
                    </span>

                    <span className="w-fit mt-[-1.00px] font-text-label-xsmall-semi-bold font-[number:var(--text-label-xsmall-semi-bold-font-weight)] text-[#484a54] text-[length:var(--text-label-xsmall-semi-bold-font-size)] tracking-[var(--text-label-xsmall-semi-bold-letter-spacing)] leading-[var(--text-label-xsmall-semi-bold-line-height)] [font-style:var(--text-label-xsmall-semi-bold-font-style)]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-end justify-center gap-[50px] p-2 rounded-md border border-solid border-[#e6e6e6] relative">
                <div className="inline-flex flex-col items-center justify-center">
                  <span className="w-fit mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] text-center tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                    Screening Date
                  </span>

                  <span className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] text-center tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                    {verificationData.screeningDate}
                  </span>
                </div>

                <img
                  className="absolute top-[calc(50.00%_-_1px)] left-[calc(50.00%_-_4px)] w-[38px] h-1.5 object-cover"
                  alt="Line"
                  src="/line-9.svg"
                />

                <div className="inline-flex flex-col items-center justify-center">
                  <span className="w-fit mt-[-1.00px] font-text-label-medium-medium font-[number:var(--text-label-medium-medium-font-weight)] text-[#0b6969] text-[length:var(--text-label-medium-medium-font-size)] text-center tracking-[var(--text-label-medium-medium-letter-spacing)] leading-[var(--text-label-medium-medium-line-height)] [font-style:var(--text-label-medium-medium-font-style)]">
                    Valid Until
                  </span>

                  <span className="w-fit font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] text-center tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                    {verificationData.validUntil}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
