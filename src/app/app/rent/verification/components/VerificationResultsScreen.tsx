"use client"

import { DownloadIcon } from "lucide-react";
import React, { useCallback } from "react";
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
import type { ISoftPullResponse } from "@/types/isoftpull";

interface BackgroundCheckStatus {
  evictions: string;
  criminalRecord: string;
  isComplete: boolean;
}

// BGSReport data structure from Accio webhook
interface BGSReportData {
  id: string;
  status: string;
  reportData?: {
    evictions?: { records?: unknown[] };
    criminal?: { records?: unknown[] };
  } | null;
}

// Helper to format credit bucket name to display range
const formatCreditRange = (intelligenceName: string | undefined): string => {
  if (!intelligenceName) return "Pending";

  // Normalize: replace underscores with spaces (e.g., "Very_Good" → "Very Good")
  const normalized = intelligenceName.replace(/_/g, " ");

  const ranges: Record<string, string> = {
    "Exceptional": "Exceptional (800–850)",
    "Very Good": "Very Good (740–799)",
    "Good": "Good (670–739)",
    "Fair": "Fair (580–669)",
    "Poor": "Poor (300–579)",
  };
  return ranges[normalized] || normalized;
};

// Helper to format date as MM/DD/YY
const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

interface VerificationResultsScreenProps {
  onViewDetails?: () => void;
  creditData?: ISoftPullResponse | null;
  bgsReport?: BGSReportData | null;
}

export const VerificationResultsScreen = ({ onViewDetails, creditData, bgsReport }: VerificationResultsScreenProps): JSX.Element => {
  const { user } = useUser();

  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "Loading...";
  const location = "Salt Lake City, UT"; // TODO: Add location from user metadata when available

  // Calculate screening date (now) and valid until (90 days from now)
  const screeningDate = new Date();
  const validUntilDate = new Date(screeningDate);
  validUntilDate.setDate(validUntilDate.getDate() + 90);

  // Determine background check status from BGSReport
  const getBackgroundCheckStatus = useCallback((): BackgroundCheckStatus => {
    if (!bgsReport || bgsReport.status === 'pending') {
      return { evictions: 'Pending', criminalRecord: 'Pending', isComplete: false };
    }

    const reportData = bgsReport.reportData;
    const evictionRecords = reportData?.evictions?.records || [];
    const criminalRecords = reportData?.criminal?.records || [];

    return {
      evictions: evictionRecords.length > 0 ? 'Records Found' : 'Clear',
      criminalRecord: criminalRecords.length > 0 ? 'Records Found' : 'Clear',
      isComplete: true,
    };
  }, [bgsReport]);

  const bgStatus = getBackgroundCheckStatus();

  const verificationData = {
    verified: true,
    creditRange: formatCreditRange(creditData?.intelligence?.name),
    evictions: bgStatus.evictions,
    criminalRecord: bgStatus.criminalRecord,
    screeningDate: formatDate(screeningDate),
    validUntil: formatDate(validUntilDate),
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
          {/* Mobile Layout - Completely reorganized */}
          <CardContent className="flex md:hidden flex-col gap-4 p-3">
            {/* Top Section - Multi-line layout */}
            <div className="flex flex-col">
              {/* Line 1: Avatar, Name, Verified Badge */}
              <div className="flex items-center gap-3">
                <AvatarWithFallback
                  src={user?.imageUrl}
                  firstName={user?.firstName || undefined}
                  lastName={user?.lastName || undefined}
                  email={user?.emailAddresses?.[0]?.emailAddress}
                  alt={fullName}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  size={64}
                />

                <h2 className="flex-1 font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                  {fullName}
                </h2>

                <Badge className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 h-auto bg-[#e9f7ee] rounded-full border border-solid border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee]">
                  <img
                    className="w-4 h-4"
                    alt="Tick"
                    src="/tick.svg"
                  />
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-sm tracking-[0] leading-5 whitespace-nowrap">
                    Verified
                  </span>
                </Badge>
              </div>

              {/* Line 2: Location with avatar placeholder space and download button */}
              <div className="flex items-center gap-3">
                <div className="w-16 flex-shrink-0" /> {/* Avatar placeholder */}
                <p className="flex-1 font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-xsmall-regular-font-size)] tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                  {location}
                </p>
                <DownloadIcon className="w-5 h-5 text-[#484a54] cursor-pointer hover:text-[#0b6969]" />
              </div>

            </div>

            {/* Row 2: Credit Range - Full Width */}
            <div className="w-full inline-flex items-center gap-3 p-3 rounded-lg border border-solid border-[#e6e6e6]">
              <span className="font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#5d606d] text-[length:var(--text-label-xsmall-regular-font-size)] tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                Credit Range:
              </span>
              <span className="font-text-label-xsmall-semi-bold font-[number:var(--text-label-xsmall-semi-bold-font-weight)] text-[#484a54] text-[length:var(--text-label-xsmall-semi-bold-font-size)] tracking-[var(--text-label-xsmall-semi-bold-letter-spacing)] leading-[var(--text-label-xsmall-semi-bold-line-height)] [font-style:var(--text-label-xsmall-semi-bold-font-style)]">
                {verificationData.creditRange}
              </span>
            </div>

            {/* Row 3: Criminal Record & Evictions - Side by Side */}
            <div className="flex gap-2">
              <div className="flex-1 inline-flex items-center gap-2 p-3 rounded-lg border border-solid border-[#e6e6e6]">
                <span className="font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#5d606d] text-[length:var(--text-label-xsmall-regular-font-size)] tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                  Criminal:
                </span>
                <span className="font-text-label-xsmall-semi-bold font-[number:var(--text-label-xsmall-semi-bold-font-weight)] text-[#484a54] text-[length:var(--text-label-xsmall-semi-bold-font-size)] tracking-[var(--text-label-xsmall-semi-bold-letter-spacing)] leading-[var(--text-label-xsmall-semi-bold-line-height)] [font-style:var(--text-label-xsmall-semi-bold-font-style)]">
                  {verificationData.criminalRecord}
                </span>
              </div>

              <div className="flex-1 inline-flex items-center gap-2 p-3 rounded-lg border border-solid border-[#e6e6e6]">
                <span className="font-text-label-xsmall-regular font-[number:var(--text-label-xsmall-regular-font-weight)] text-[#5d606d] text-[length:var(--text-label-xsmall-regular-font-size)] tracking-[var(--text-label-xsmall-regular-letter-spacing)] leading-[var(--text-label-xsmall-regular-line-height)] [font-style:var(--text-label-xsmall-regular-font-style)]">
                  Evictions:
                </span>
                <span className="font-text-label-xsmall-semi-bold font-[number:var(--text-label-xsmall-semi-bold-font-weight)] text-[#484a54] text-[length:var(--text-label-xsmall-semi-bold-font-size)] tracking-[var(--text-label-xsmall-semi-bold-letter-spacing)] leading-[var(--text-label-xsmall-semi-bold-line-height)] [font-style:var(--text-label-xsmall-semi-bold-font-style)]">
                  {verificationData.evictions}
                </span>
              </div>
            </div>

            {/* Row 4: Screening Dates */}
            <div className="w-full flex justify-between items-center p-3 rounded-md border border-solid border-[#e6e6e6]">
              <div className="flex flex-col items-start">
                <span className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                  Screening Date
                </span>
                <span className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                  {verificationData.screeningDate}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="font-text-label-medium-medium font-[number:var(--text-label-medium-medium-font-weight)] text-[#0b6969] text-[length:var(--text-label-medium-medium-font-size)] tracking-[var(--text-label-medium-medium-letter-spacing)] leading-[var(--text-label-medium-medium-line-height)] [font-style:var(--text-label-medium-medium-font-style)]">
                  Valid Until
                </span>
                <span className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
                  {verificationData.validUntil}
                </span>
              </div>
            </div>

            {/* View button - Half width right-aligned at bottom */}
            <div className="flex justify-end">
              <BrandButton size="sm" onClick={onViewDetails} className="w-1/2">
                View
              </BrandButton>
            </div>
          </CardContent>

          {/* Desktop Layout - Original unchanged */}
          <CardContent className="hidden md:flex flex-col items-start justify-end gap-2 p-6">
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
