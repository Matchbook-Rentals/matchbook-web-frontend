import { PAGE_MARGIN } from "@/constants/styles"
import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import prismadb from "@/lib/prismadb"
import { VerificationFormValues } from "./utils"
import { FrameScreen } from "./components/FrameScreen"

// Handle server component with payment status and purchase check
export default async function VerificationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const paymentStatus = searchParams.payment as string
  const { userId } = auth()
  let hasPurchase = false
  let applicationData: Partial<VerificationFormValues> | undefined = undefined

  // Check for unredeemed purchases if user is logged in
  if (userId) {
    const purchases = await prismadb.purchase.findMany({
      where: {
        userId,
        type: 'matchbookVerification',
        isRedeemed: false
      }
    })

    // Set hasPurchase flag if there are any unredeemed verification purchases
    hasPurchase = purchases.length > 0

    // Check if user has an application to prefill form data
    const userApplication = await prismadb.application.findFirst({
      where: {
        userId,
        isDefault: true
      }
    })

    if (userApplication) {
      // Map fields from application to verification form
      applicationData = {
        firstName: userApplication.firstName || "",
        lastName: userApplication.lastName || "",
        // Don't prefill SSN for security reasons
        ssn: "",
        // Format date of birth to YYYY-MM-DD if available
        dob: userApplication.dateOfBirth ?
          userApplication.dateOfBirth.toISOString().split('T')[0] :
          "",
      }

      // Check if user has residential history to get address information
      const residentialHistory = await prismadb.residentialHistory.findFirst({
        where: {
          applicationId: userApplication.id,
          index: 0 // Get the current/most recent address
        }
      })

      if (residentialHistory) {
        applicationData = {
          ...applicationData,
          address: residentialHistory.street || "",
          city: residentialHistory.city || "",
          state: residentialHistory.state || "",
          zip: residentialHistory.zipCode || ""
        }
      }
    }
  }

  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN} `}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <FrameScreen />
        </Suspense>
      </main>
    </div>
  )
}
