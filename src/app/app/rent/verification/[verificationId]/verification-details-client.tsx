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
import { BrandButton } from "@/components/ui/brandButton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  criminalRecords: Array<{
    id: string
    caseNumber: string
    charge: string | null
    crimeType: string | null
    disposition: string | null
    filingDate: Date | null
    dispositionDate: Date | null
    pendingDate: Date | null
    sentenceComments: string | null
    jurisdiction: string | null
    jurisdictionState: string | null
    courtSource: string | null
    identifiedByName: boolean
    identifiedByDob: boolean
    identifiedBySsn: boolean
  }>
  evictionRecords: Array<{
    id: string
    caseNumber: string
    filingDate: Date | null
    dispositionDate: Date | null
    plaintiff: string | null
    defendantAddress: string | null
    judgmentAmount: unknown
    disposition: string | null
    court: string | null
    notes: string | null
  }>
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
  return `${recordCount} eviction record${recordCount !== 1 ? "s" : ""} found. Click for more details.`
}

const getCriminalDescription = (status: string | null, count: number | null): string => {
  if (!status || status === "Pending") return "Criminal background check pending."
  if (status === "Clear" || status === "No Records Found") {
    return "No felony or misdemeanor records found."
  }
  const recordCount = count || 0
  return `${recordCount} criminal record${recordCount !== 1 ? "s" : ""} found. Click for more details.`
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

// Criminal Record Details Component
const CriminalRecordDetails = ({ record }: { record: VerificationData['criminalRecords'][0] }) => (
  <div className="space-y-3 text-sm">
    {record.charge && (
      <div>
        <span className="text-[#5d606d]">Charge:</span>
        <p className="font-medium text-[#373940]">{record.charge}</p>
      </div>
    )}

    <div className="grid grid-cols-2 gap-4">
      {record.filingDate && (
        <div>
          <span className="text-[#5d606d]">Filing Date:</span>
          <p className="text-[#373940]">{formatShortDate(record.filingDate)}</p>
        </div>
      )}
      {record.dispositionDate && (
        <div>
          <span className="text-[#5d606d]">Disposition Date:</span>
          <p className="text-[#373940]">{formatShortDate(record.dispositionDate)}</p>
        </div>
      )}
    </div>

    {record.disposition && (
      <div>
        <span className="text-[#5d606d]">Disposition:</span>
        <p className="text-[#373940]">{record.disposition}</p>
      </div>
    )}

    {record.sentenceComments && (
      <div>
        <span className="text-[#5d606d]">Sentence:</span>
        <p className="text-[#373940]">{record.sentenceComments}</p>
      </div>
    )}

    {(record.jurisdiction || record.jurisdictionState) && (
      <div>
        <span className="text-[#5d606d]">Jurisdiction:</span>
        <p className="text-[#373940]">
          {[record.jurisdiction, record.jurisdictionState].filter(Boolean).join(', ')}
        </p>
      </div>
    )}

    {record.courtSource && (
      <div>
        <span className="text-[#5d606d]">Court:</span>
        <p className="text-[#373940]">{record.courtSource}</p>
      </div>
    )}
  </div>
)

// Eviction Record Details Component
const EvictionRecordDetails = ({ record }: { record: VerificationData['evictionRecords'][0] }) => (
  <div className="space-y-3 text-sm">
    {record.plaintiff && (
      <div>
        <span className="text-[#5d606d]">Plaintiff:</span>
        <p className="font-medium text-[#373940]">{record.plaintiff}</p>
      </div>
    )}

    <div className="grid grid-cols-2 gap-4">
      {record.filingDate && (
        <div>
          <span className="text-[#5d606d]">Filing Date:</span>
          <p className="text-[#373940]">{formatShortDate(record.filingDate)}</p>
        </div>
      )}
      {record.dispositionDate && (
        <div>
          <span className="text-[#5d606d]">Disposition Date:</span>
          <p className="text-[#373940]">{formatShortDate(record.dispositionDate)}</p>
        </div>
      )}
    </div>

    {record.judgmentAmount && (
      <div>
        <span className="text-[#5d606d]">Judgment Amount:</span>
        <p className="text-red-600 font-medium">${Number(record.judgmentAmount).toLocaleString()}</p>
      </div>
    )}

    {record.disposition && (
      <div>
        <span className="text-[#5d606d]">Disposition:</span>
        <p className="text-[#373940]">{record.disposition}</p>
      </div>
    )}

    {record.court && (
      <div>
        <span className="text-[#5d606d]">Court:</span>
        <p className="text-[#373940]">{record.court}</p>
      </div>
    )}

    {record.defendantAddress && (
      <div>
        <span className="text-[#5d606d]">Address at Time of Filing:</span>
        <p className="text-[#373940]">{record.defendantAddress}</p>
      </div>
    )}
  </div>
)

export function VerificationDetailsClient({ verification }: VerificationDetailsClientProps) {
  const user = verification.user

  // Try to get name from report data first, fallback to user profile
  const reportData = verification.bgsReport?.reportData as { firstName?: string; lastName?: string } | null
  const firstName = reportData?.firstName || user.firstName || ""
  const lastName = reportData?.lastName || user.lastName || ""
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown"

  const creditBucket = verification.creditBucket || verification.creditReport?.creditBucket

  const getStatusDisplay = () => {
    if (verification.status === "COMPLETED") return "Verified"
    if (verification.status === "PROCESSING_BGS") return "Pending Background Check"
    return verification.status
  }

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

        {/* Single Combined Card */}
        <Card className="w-full bg-white rounded-xl border-[#e6e6e6] print-no-break">
          <CardContent className="flex flex-col gap-4 p-4 md:p-6">
            {/* Header Info */}
            <div className="flex flex-col gap-1">
              <h2 className="text-[#373940] text-lg font-medium">{fullName}</h2>
              <p className="text-[#5d606d] text-sm">Status: {getStatusDisplay()}</p>
              <p className="text-[#5d606d] text-sm">Screening Date: {formatLongDate(verification.screeningDate)}</p>
              <p className="text-[#5d606d] text-sm">Valid Until: {formatShortDate(verification.validUntil)}</p>
            </div>

            {/* Screening Results */}
            <div className="flex flex-col pt-2">
              {/* Credit Score - Static */}
              <div className="flex flex-col gap-1 pb-4 border-b border-[#e6e6e6]">
                <div className="flex items-center gap-2">
                  <img className="w-4 h-4" alt="Credit Score" src="/icon_png/verification/credit-score-icon.png" />
                  <span className="text-[#484a54] text-sm font-medium">Credit Score Range:</span>
                </div>
                <p className="text-[#0b6969] text-sm font-medium">{formatCreditBucket(creditBucket)}</p>
                <p className="text-[#5d606d] text-xs">{getCreditDescription(creditBucket)}</p>
              </div>

              {/* Eviction History - Expandable if records found */}
              <div className="border-b border-[#e6e6e6]">
                {(verification.evictionCount ?? 0) > 0 ? (
                  <Accordion type="single" collapsible defaultValue={verification.evictionRecords.length > 0 ? "eviction" : undefined}>
                    <AccordionItem value="eviction" className="border-0">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex flex-col gap-1 items-start text-left">
                          <div className="flex items-center gap-2">
                            <img className="w-4 h-4" alt="Eviction History" src="/icon_png/verification/eviction-hisotry-icon.png" />
                            <span className="text-[#484a54] text-sm font-medium">Eviction History</span>
                          </div>
                          <p className="text-[#0b6969] text-sm font-medium">{formatEvictionStatus(verification.evictionStatus)}</p>
                          <p className="text-[#5d606d] text-xs">{getEvictionDescription(verification.evictionStatus, verification.evictionCount)}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {verification.evictionRecords.length > 0 ? (
                          <Accordion type="multiple" defaultValue={verification.evictionRecords.map(r => r.id)} className="space-y-2">
                            {verification.evictionRecords.map((record) => (
                              <AccordionItem key={record.id} value={record.id} className="border rounded-lg">
                                <AccordionTrigger className="px-4 hover:no-underline">
                                  <div className="flex items-center gap-2 text-sm">
                                    {record.filingDate && (
                                      <span className="text-[#373940]">{formatLongDate(record.filingDate)}</span>
                                    )}
                                    {record.court && (
                                      <span className="text-[#5d606d]">{record.court}</span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4">
                                  <EvictionRecordDetails record={record} />
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <p className="text-[#5d606d] text-sm py-2">Detailed records pending review.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="flex flex-col gap-1 py-4">
                    <div className="flex items-center gap-2">
                      <img className="w-4 h-4" alt="Eviction History" src="/icon_png/verification/eviction-hisotry-icon.png" />
                      <span className="text-[#484a54] text-sm font-medium">Eviction History</span>
                    </div>
                    <p className="text-[#0b6969] text-sm font-medium">{formatEvictionStatus(verification.evictionStatus)}</p>
                    <p className="text-[#5d606d] text-xs">{getEvictionDescription(verification.evictionStatus, verification.evictionCount)}</p>
                  </div>
                )}
              </div>

              {/* Criminal Record - Expandable if records found */}
              <div>
                {(verification.criminalRecordCount ?? 0) > 0 ? (
                  <Accordion type="single" collapsible defaultValue={verification.criminalRecords.length > 0 ? "criminal" : undefined}>
                    <AccordionItem value="criminal" className="border-0">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex flex-col gap-1 items-start text-left">
                          <div className="flex items-center gap-2">
                            <img className="w-4 h-4" alt="Criminal Record" src="/icon_png/verification/criminal-history-icon.png" />
                            <span className="text-[#484a54] text-sm font-medium">Criminal Record</span>
                          </div>
                          <p className="text-[#0b6969] text-sm font-medium">{formatCriminalStatus(verification.criminalStatus)}</p>
                          <p className="text-[#5d606d] text-xs">{getCriminalDescription(verification.criminalStatus, verification.criminalRecordCount)}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {verification.criminalRecords.length > 0 ? (
                          <Accordion type="multiple" defaultValue={verification.criminalRecords.map(r => r.id)} className="space-y-2">
                            {verification.criminalRecords.map((record) => (
                              <AccordionItem key={record.id} value={record.id} className="border rounded-lg">
                                <AccordionTrigger className="px-4 hover:no-underline">
                                  <div className="flex items-center gap-2 text-sm">
                                    {record.crimeType && (
                                      <span className="text-[#373940]">{record.crimeType}</span>
                                    )}
                                    {record.filingDate && (
                                      <span className="text-[#5d606d]">{formatLongDate(record.filingDate)}</span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4">
                                  <CriminalRecordDetails record={record} />
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <p className="text-[#5d606d] text-sm py-2">Detailed records pending review.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="flex flex-col gap-1 py-4">
                    <div className="flex items-center gap-2">
                      <img className="w-4 h-4" alt="Criminal Record" src="/icon_png/verification/criminal-history-icon.png" />
                      <span className="text-[#484a54] text-sm font-medium">Criminal Record</span>
                    </div>
                    <p className="text-[#0b6969] text-sm font-medium">{formatCriminalStatus(verification.criminalStatus)}</p>
                    <p className="text-[#5d606d] text-xs">{getCriminalDescription(verification.criminalStatus, verification.criminalRecordCount)}</p>
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="w-full md:w-auto flex justify-end gap-3 print:hidden">
          <Link href="/app/rent/verification/list">
            <BrandButton variant="outline">
              Back to List
            </BrandButton>
          </Link>
          <BrandButton
            variant="outline"
            onClick={() => window.print()}
          >
            Print PDF
            <FileText className="w-5 h-5 ml-1.5" />
          </BrandButton>
        </div>
      </section>
    </main>
  )
}
