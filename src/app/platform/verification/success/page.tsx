import { PAGE_MARGIN } from "@/constants/styles"
import { redirect } from "next/navigation"
import prismadb from "@/lib/prismadb"
import { auth, currentUser } from "@clerk/nextjs/server"
import VerificationClient from "../verification-client"

// Payment Success Page that creates a purchase record
export default async function VerificationSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { userId } = auth()
  const sessionId = searchParams.session_id as string
  
  // Redirect if no session ID
  if (!sessionId) {
    redirect('/platform/verification')
  }
  
  // Create a purchase record if user is authenticated
  if (userId) {
    // Check if purchase already exists with this session ID
    const existingPurchases = await prismadb.purchase.findMany({
      where: {
        userId,
        type: 'matchbookVerification',
        isRedeemed: false,
      }
    })
    
    let hasPurchaseWithSessionId = false
    
    // Check if any purchase has the matching session ID
    for (const purchase of existingPurchases) {
      try {
        if (purchase.metadata) {
          const metadata = purchase.metadata as any
          if (metadata.sessionId === sessionId) {
            hasPurchaseWithSessionId = true
            break
          }
        }
      } catch (error) {
        console.error('Error checking purchase metadata:', error)
      }
    }
    
    // If no purchase exists with this session ID, create one
    if (!hasPurchaseWithSessionId) {
      try {
        await prismadb.purchase.create({
          data: {
            type: 'matchbookVerification',
            amount: 2500, // $25.00 in cents
            userId,
            isRedeemed: false,
            metadata: {
              sessionId
            }
          }
        })
      } catch (error) {
        console.error('Error creating purchase record:', error)
      }
    }
  }

  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN} `}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <VerificationClient 
          paymentStatus="success" 
          serverHasPurchase={true} 
          reviewMode={true}
          sessionId={sessionId}
        />
      </main>
    </div>
  )
}