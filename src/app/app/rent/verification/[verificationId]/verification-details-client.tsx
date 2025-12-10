"use client"

import React from "react"
import Link from "next/link"
import { FileText } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback"
import type { CreditBucket } from "@prisma/client"

interface VerificationData {
  id: string
  status: string
  screeningDate: Date | null
  validUntil: Date | null
  creditBucket: CreditBucket | null
  evictionStatus: string | null
  evictionCount: number | null
  criminalStatus: string | null
  criminalRecordCount: number | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
    email: string | null
  }
  creditReport: {
    id: string
    creditBucket: CreditBucket | null
  } | null
  bgsReport: {
    id: string
    status: string
    reportData: unknown
  } | null
}

interface VerificationDetailsClientProps {
  verification: VerificationData
}

const formatCreditBucket = (bucket: CreditBucket | null | undefined): string => {
  if (!bucket) return "Pending"

  const ranges: Record<CreditBucket, string> = {
    Exceptional: "Exceptional (800–850)",
    Very_Good: "Very Good (740–799)",
    VeryGood: "Very Good (740–799)",
    Good: "Good (670–739)",
    Fair: "Fair (580–669)",
    Low: "Poor (300–579)",
  }
  return ranges[bucket] || bucket
}

const formatLongDate = (date: Date | null): string => {
  if (!date) return "N/A"
  const d = new Date(date)
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const formatShortDate = (date: Date | null): string => {
  if (!date) return "N/A"
  const d = new Date(date)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const getCreditDescription = (bucket: CreditBucket | null | undefined): string => {
  if (!bucket) return "Credit check pending."
  return "Based on soft credit pull."
}

const getEvictionDescription = (status: string | null, count: number | null): string => {
  if (!status || status === "Pending") return "Eviction check pending."
  if (status === "Clear" || status === "No Records Found") {
    return "No public eviction records or property damage claims found."
  }
  const recordCount = count || 0
  return `${recordCount} eviction record${recordCount !== 1 ? "s" : ""} found. See full report for details.`
}

const getCriminalDescription = (status: string | null, count: number | null): string => {
  if (!status || status === "Pending") return "Criminal background check pending."
  if (status === "Clear" || status === "No Records Found") {
    return "No felony or misdemeanor records found."
  }
  const recordCount = count || 0
  return `${recordCount} criminal record${recordCount !== 1 ? "s" : ""} found. See full report for details.`
}

const formatEvictionStatus = (status: string | null): string => {
  if (!status) return "Pending"
  if (status === "Clear") return "No Records Found"
  return status
}

const formatCriminalStatus = (status: string | null): string => {
  if (!status) return "Pending"
  if (status === "Clear") return "No Records Found"
  return status
}

export function VerificationDetailsClient({ verification }: VerificationDetailsClientProps) {
  const user = verification.user
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown"
  const location = "Salt Lake City" // TODO: Get from user profile

  const creditBucket = verification.creditBucket || verification.creditReport?.creditBucket

  const screeningResults = [
    {
      icon: "/icon_png/verification/credit-score-icon.png",
      title: "Credit Score Range:",
      status: formatCreditBucket(creditBucket),
      description: getCreditDescription(creditBucket),
    },
    {
      icon: "/icon_png/verification/eviction-hisotry-icon.png",
      title: "Eviction History",
      status: formatEvictionStatus(verification.evictionStatus),
      description: getEvictionDescription(verification.evictionStatus, verification.evictionCount),
    },
    {
      icon: "/icon_png/verification/criminal-history-icon.png",
      title: "Criminal Record",
      status: formatCriminalStatus(verification.criminalStatus),
      description: getCriminalDescription(verification.criminalStatus, verification.criminalRecordCount),
    },
  ]

  return (
    <main className="flex flex-col w-full items-start relative gap-4 md:gap-6 p-2 md:p-4">
      {/* Breadcrumb and Header */}
      <section className="flex flex-col w-full items-start gap-3 md:gap-4">
        <Breadcrumb>
          <BreadcrumbList className="flex items-center gap-2 md:gap-4 flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-gray-500 text-sm">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/app/rent/verification/list" className="text-gray-900 text-xs md:text-sm">
                <span className="hidden md:inline">MatchBook Renter Verification</span>
                <span className="md:hidden">Verification</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-gray-500 text-sm">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gray-900 text-xs md:text-sm">Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col items-start gap-1 w-full">
          <h1 className="w-full text-[#373940] text-xl md:text-2xl font-medium">
            Renter Verification Report
          </h1>
          <p className="w-full font-normal text-[#5d606d] text-xs md:text-sm">
            Detailed verification results for rental screening purposes.
          </p>
        </header>
      </section>

      {/* Main Content */}
      <section className="flex flex-col items-end gap-6 md:gap-8 w-full">
        {/* Print-only header */}
        <div className="hidden print:flex items-center gap-3 w-full mb-2">
          <img src="/logo-small.svg" alt="MatchBook" className="w-8 h-8" />
          <h1 className="text-2xl font-semibold text-[#373940]">MatchBook Renter Verification</h1>
        </div>

        <div className="flex flex-col items-start gap-4 md:gap-5 w-full">
          {/* Profile Card + Results Card: stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-5 w-full">
            {/* Profile Card */}
            <Card className="w-full md:w-[368px] bg-[#f8ffff] rounded-xl border-[#e6e6e6] print-no-break">
              <CardContent className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-6">
                <div className="inline-flex flex-col items-center gap-3 md:gap-4">
                  <div className="flex flex-col items-center relative">
                    <div className="relative w-[100px] h-[100px] md:w-[139px] md:h-[139px] rounded-full overflow-hidden">
                      <AvatarWithFallback
                        src={user.imageUrl || undefined}
                        firstName={user.firstName || undefined}
                        lastName={user.lastName || undefined}
                        email={user.email || undefined}
                        alt={fullName}
                        className="w-full h-full object-cover rounded-full"
                        size={139}
                      />
                    </div>

                    <Badge className="inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 mt-3 md:mt-4 bg-[#e9f7ee] rounded-full border border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee] h-auto relative z-10">
                      <img className="w-4 h-4" alt="Verified" src="/tick.svg" />
                      <span className="text-sm font-medium">Verified</span>
                    </Badge>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-[#484a54] text-base md:text-lg font-medium text-center">
                      {fullName}
                    </div>
                    <div className="text-[#777b8b] text-xs text-center">{location}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-start gap-2 md:gap-3">
                    <div className="text-[#484a54] text-xs">Screening Date:</div>
                    <div className="text-[#484a54] text-xs">Valid Until:</div>
                  </div>

                  <div className="flex flex-col items-end gap-2 md:gap-3">
                    <div className="text-[#777b8b] text-sm">{formatShortDate(verification.screeningDate)}</div>
                    <div className="text-[#777b8b] text-sm">{formatShortDate(verification.validUntil)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Screening Results Card */}
            <Card className="w-full md:flex-1 bg-white rounded-xl border-[#e6e6e6] print-no-break">
              <CardContent className="flex flex-col items-start gap-4 md:gap-6 p-4 md:p-6">
                <div className="flex items-center gap-6 w-full">
                  <h2 className="font-medium text-black text-base md:text-lg">Screening Results</h2>
                </div>

                <div className="flex items-start gap-6 w-full">
                  <div className="flex flex-col items-start gap-3 flex-1">
                    {screeningResults.map((result, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-start gap-2 pt-0 pb-2 px-0 w-full ${
                          index < screeningResults.length - 1 ? "border-b border-[#e6e6e6]" : ""
                        }`}
                      >
                        <div className="flex flex-col items-start gap-[3px] w-full">
                          <div className="flex items-center gap-2 p-1 md:p-1.5 w-full">
                            <img className="w-4 h-4" alt={result.title} src={result.icon} />
                            <div className="text-[#484a54] text-sm font-medium">{result.title}</div>
                          </div>
                          <div className="self-stretch text-[#0b6969] text-xs font-medium">{result.status}</div>
                        </div>
                        <div className="self-stretch text-[#484a54] text-xs">{result.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status & Recommendations Card */}
          <Card className="md:h-[164px] bg-white rounded-xl border-[#e6e6e6] w-full print-no-break">
            <CardContent className="flex flex-col items-start gap-3 md:gap-4 p-4 md:p-6">
              <div className="flex items-center gap-6 w-full">
                <h2 className="font-medium text-black text-base">Status &amp; Recommendations</h2>
              </div>

              <div className="flex flex-col items-start gap-2 w-full">
                <div className="flex flex-col items-start gap-[3px] w-full">
                  <div className="flex items-center gap-2 p-1 md:p-1.5 w-full">
                    <img className="w-4 h-4" alt="Status" src="/icon_png/verification/criminal-history-icon.png" />
                    <div className="text-[#484a54] text-sm font-medium">Status</div>
                  </div>
                  <div className="self-stretch text-[#0b6969] text-xs font-medium">
                    {verification.status === "COMPLETED" ? "Verified" :
                     verification.status === "PROCESSING_BGS" ? "Processing Background Check" :
                     verification.status}
                  </div>
                </div>

                <div className="self-stretch text-[#484a54] text-xs">
                  {verification.status === "PROCESSING_BGS"
                    ? "Processing time for background checks differs from state to state. We'll email you when it's complete."
                    : "You're all set to apply to listings. Hosts can trust your record and history."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="w-full md:w-auto flex md:inline-flex items-center gap-4">
          <Link href="/app/rent/verification/list">
            <Button variant="outline" className="px-[18px] py-3 rounded-lg h-auto">
              <span className="font-semibold text-base">Back to List</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="items-center justify-center gap-1.5 px-[18px] py-3 rounded-lg border-[#3c8787] bg-transparent hover:bg-transparent h-auto print:hidden"
            onClick={() => window.print()}
          >
            <span className="font-semibold text-[#3c8787] text-base">Print PDF</span>
            <FileText className="w-5 h-5 text-[#3c8787]" />
          </Button>
        </div>
      </section>
    </main>
  )
}
