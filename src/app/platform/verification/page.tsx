import { PAGE_MARGIN } from "@/constants/styles"
import Image from "next/image"
import VerificationClient from "./verification-client"
import { Suspense } from "react"

// Handle server component with payment status
export default function VerificationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const paymentStatus = searchParams.payment as string

  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN} `}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <VerificationClient paymentStatus={paymentStatus} />
        </Suspense>
      </main>
    </div>
  )
}
