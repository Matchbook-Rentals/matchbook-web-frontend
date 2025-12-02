import { APP_PAGE_MARGIN } from "@/constants/styles"
import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import prismadb from "@/lib/prismadb"
import stripe from "@/lib/stripe"
import { VerificationFormValues } from "./utils"
import { VerificationFlow } from "./components/VerificationFlow"
import type { SavedPaymentMethod } from "@/components/stripe/verification-payment-selector"

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
  let initialPaymentMethods: SavedPaymentMethod[] = []
  let initialClientSecret: string | null = null

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

    // Fetch payment methods server-side
    try {
      const user = await prismadb.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true }
      })

      if (user?.stripeCustomerId) {
        const cardMethods = await stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: 'card',
        })

        initialPaymentMethods = cardMethods.data.map(pm => ({
          id: pm.id,
          type: 'card' as const,
          card: {
            brand: pm.card?.brand || 'card',
            last4: pm.card?.last4 || '****',
            expMonth: pm.card?.exp_month || 1,
            expYear: pm.card?.exp_year || 2025,
          },
          created: pm.created,
        }))
      }

      // If no payment methods, pre-create setup intent
      if (initialPaymentMethods.length === 0) {
        // Ensure customer exists for setup intent
        let customerId = user?.stripeCustomerId
        if (!customerId) {
          const customer = await stripe.customers.create({
            metadata: { userId }
          })
          customerId = customer.id
          await prismadb.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId }
          })
        }

        const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
          metadata: { userId, purpose: 'verification' }
        })
        initialClientSecret = setupIntent.client_secret
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      // Continue without initial data - component will fetch client-side
    }
  }

  return (
    <div className={`min-h-screen bg-background ${APP_PAGE_MARGIN} `}>
      {/* Main Content */}
      <main className="md:container mx-auto py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <VerificationFlow
            initialPaymentMethods={initialPaymentMethods}
            initialClientSecret={initialClientSecret}
          />
        </Suspense>
      </main>
    </div>
  )
}
