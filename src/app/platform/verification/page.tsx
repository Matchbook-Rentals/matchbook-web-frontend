import { PAGE_MARGIN } from "@/constants/styles"
import Image from "next/image"
import VerificationClient from "./verification-client"
import { Suspense } from "react"
import { auth, currentUser } from "@clerk/nextjs/server"
import prismadb from "@/lib/prismadb"

// Handle server component with payment status and purchase check
export default async function VerificationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const paymentStatus = searchParams.payment as string
  const { userId } = auth()
  let hasPurchase = false
  
  // Check for unredeemed purchases if user is logged in
  if (userId) {
    const purchases = await prismadb.purchase.findMany({
      where: {
        userId,
        type: 'backgroundVerification',
        isRedeemed: false
      }
    })
    
    // Set hasPurchase flag if there are any unredeemed verification purchases
    hasPurchase = purchases.length > 0
  }

  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN} `}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <VerificationClient 
            paymentStatus={paymentStatus} 
            serverHasPurchase={hasPurchase} 
          />
        </Suspense>
      </main>
    </div>
  )
}
