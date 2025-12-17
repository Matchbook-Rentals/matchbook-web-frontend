"use client"

import { DownloadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback"
import { BrandButton } from "@/components/ui/brandButton"
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
  subjectFirstName: string | null
  subjectLastName: string | null
  user: {
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

interface VerificationListClientProps {
  verifications: VerificationData[]
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

const formatDate = (date: Date | null): string => {
  if (!date) return "N/A"
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const year = String(d.getFullYear()).slice(-2)
  return `${month}/${day}/${year}`
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

function VerificationCard({ verification }: { verification: VerificationData }) {
  const router = useRouter()
  const user = verification.user

  // Use subject name from verification form (no fallback to user profile)
  const firstName = verification.subjectFirstName || ""
  const lastName = verification.subjectLastName || ""
  // const firstName = verification.subjectFirstName || user.firstName || ""
  // const lastName = verification.subjectLastName || user.lastName || ""
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown"
  const location = "Salt Lake City, UT" // TODO: Get from user profile

  const creditBucket = verification.creditBucket || verification.creditReport?.creditBucket
  const evictionStatus = formatEvictionStatus(verification.evictionStatus)
  const criminalStatus = formatCriminalStatus(verification.criminalStatus)
  const isProcessing = verification.status === "PROCESSING_BGS"

  const handleViewDetails = () => {
    router.push(`/app/rent/verification/${verification.id}`)
  }

  const infoItems = [
    { label: "Credit Range:", value: formatCreditBucket(creditBucket) },
    { label: "Evictions:", value: evictionStatus },
    { label: "Criminal Record:", value: criminalStatus },
  ]

  return (
    <Card className="w-full shadow-[0px_2px_12px_#0000001a]">
          {/* Mobile Layout */}
          <CardContent className="flex md:hidden flex-col gap-4 p-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <AvatarWithFallback
                  src={user.imageUrl || undefined}
                  firstName={firstName || undefined}
                  lastName={lastName || undefined}
                  email={user.email || undefined}
                  alt={fullName}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  size={64}
                />

                <h2 className="flex-1 text-[#484a54] text-lg font-medium">
                  {fullName}
                </h2>

                {isProcessing ? (
                  <Badge className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 h-auto bg-[#fff8e6] rounded-full border border-solid border-[#f5a623] text-[#f5a623] hover:bg-[#fff8e6]">
                    <span className="font-medium text-sm">Processing</span>
                  </Badge>
                ) : (
                  <Badge className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 h-auto bg-[#e9f7ee] rounded-full border border-solid border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee]">
                    <img className="w-4 h-4" alt="Tick" src="/tick.svg" />
                    <span className="font-medium text-sm">Verified</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 flex-shrink-0" />
                <p className="flex-1 text-[#777b8b] text-xs">{location}</p>
                <DownloadIcon className="w-5 h-5 text-[#484a54] cursor-pointer hover:text-[#0b6969]" />
              </div>
            </div>

            <div className="w-full inline-flex items-center gap-3 p-3 rounded-lg border border-solid border-[#e6e6e6]">
              <span className="text-[#5d606d] text-xs">Credit Range:</span>
              <span className="text-[#484a54] text-xs font-semibold">
                {formatCreditBucket(creditBucket)}
              </span>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 inline-flex items-center gap-2 p-3 rounded-lg border border-solid border-[#e6e6e6]">
                <span className="text-[#5d606d] text-xs">Criminal:</span>
                <span className="text-[#484a54] text-xs font-semibold">{criminalStatus}</span>
              </div>

              <div className="flex-1 inline-flex items-center gap-2 p-3 rounded-lg border border-solid border-[#e6e6e6]">
                <span className="text-[#5d606d] text-xs">Evictions:</span>
                <span className="text-[#484a54] text-xs font-semibold">{evictionStatus}</span>
              </div>
            </div>

            <div className="w-full flex justify-between items-center p-3 rounded-md border border-solid border-[#e6e6e6]">
              <div className="flex flex-col items-start">
                <span className="text-[#777b8b] text-sm">Screening Date</span>
                <span className="text-[#777b8b] text-sm">{formatDate(verification.screeningDate)}</span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[#0b6969] text-sm font-medium">Valid Until</span>
                <span className="text-[#777b8b] text-sm">{formatDate(verification.validUntil)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <BrandButton size="sm" onClick={handleViewDetails} className="w-1/2">
                View
              </BrandButton>
            </div>
          </CardContent>

          {/* Desktop Layout */}
          <CardContent className="hidden md:flex flex-col items-start justify-end gap-2 p-6">
            <div className="flex items-start justify-between self-stretch w-full">
              <div className="inline-flex items-center gap-[9px]">
                <AvatarWithFallback
                  src={user.imageUrl || undefined}
                  firstName={firstName || undefined}
                  lastName={lastName || undefined}
                  email={user.email || undefined}
                  alt={fullName}
                  className="w-[81px] h-[85px] rounded-xl object-cover"
                  size={85}
                />

                <div className="flex flex-col w-[154px] items-start gap-2">
                  <div className="flex flex-col items-start self-stretch w-full">
                    <h2 className="text-[#484a54] text-lg font-medium">{fullName}</h2>
                    <p className="text-[#777b8b] text-xs">{location}</p>
                  </div>

                  {isProcessing ? (
                    <Badge className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 h-auto bg-[#fff8e6] rounded-full border border-solid border-[#f5a623] text-[#f5a623] hover:bg-[#fff8e6]">
                      <span className="font-medium text-sm">Processing</span>
                    </Badge>
                  ) : (
                    <Badge className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 h-auto bg-[#e9f7ee] rounded-full border border-solid border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee]">
                      <img className="w-4 h-4" alt="Tick" src="/tick.svg" />
                      <span className="font-medium text-sm">Verified</span>
                    </Badge>
                  )}
                </div>
              </div>

              <div className="inline-flex items-center gap-3 p-1.5">
                <DownloadIcon className="w-6 h-6 text-[#484a54] cursor-pointer hover:text-[#0b6969]" />
                <BrandButton size="sm" onClick={handleViewDetails}>
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
                    <span className="text-[#5d606d] text-xs">{item.label}</span>
                    <span className="text-[#484a54] text-xs font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-end justify-center gap-[50px] p-2 rounded-md border border-solid border-[#e6e6e6] relative">
                <div className="inline-flex flex-col items-center justify-center">
                  <span className="text-[#777b8b] text-sm">Screening Date</span>
                  <span className="text-[#777b8b] text-sm">{formatDate(verification.screeningDate)}</span>
                </div>

                <img
                  className="absolute top-[calc(50.00%_-_1px)] left-[calc(50.00%_-_4px)] w-[38px] h-1.5 object-cover"
                  alt="Line"
                  src="/line-9.svg"
                />

                <div className="inline-flex flex-col items-center justify-center">
                  <span className="text-[#0b6969] text-sm font-medium">Valid Until</span>
                  <span className="text-[#777b8b] text-sm">{formatDate(verification.validUntil)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
  )
}

export function VerificationListClient({ verifications }: VerificationListClientProps) {
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
            <span className="text-gray-500 text-sm">/</span>
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray-900 text-sm">
              MatchBook Renter Verification
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col items-start gap-6 w-full">
        <header className="flex flex-col w-full items-start gap-1">
          <h1 className="text-[#373940] text-2xl font-medium">
            MatchBook Renter Verification Summary
          </h1>
          <p className="text-[#5d606d] text-sm">
            Track, manage, and reuse your verifications
          </p>
        </header>

        <div className="flex flex-col gap-4 w-full">
          {verifications.map((verification) => (
            <VerificationCard key={verification.id} verification={verification} />
          ))}
        </div>
      </div>
    </div>
  )
}
