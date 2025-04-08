import { PAGE_MARGIN } from "@/constants/styles"
import { redirect } from "next/navigation"
import prismadb from "@/lib/prismadb"
import { auth } from "@clerk/nextjs/server"
import VerificationClient from "../verification-client"

// Payment Review Page that verifies session ID
export default async function VerificationReviewPage({
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
  
  let validSession = false
  let hasPurchase = false
  
  // Verify the session ID against purchases in the database
  if (userId) {
    const purchases = await prismadb.purchase.findMany({
      where: {
        userId,
        type: 'matchbookVerification',
        isRedeemed: false,
      }
    })
    
    // Check if any purchase has the matching session ID
    for (const purchase of purchases) {
      try {
        if (purchase.metadata) {
          const metadata = JSON.parse(purchase.metadata as string)
          if (metadata.sessionId === sessionId) {
            validSession = true
            hasPurchase = true
            break
          }
        }
      } catch (error) {
        console.error('Error parsing purchase metadata:', error)
      }
    }
  }
  
  // If session is invalid, redirect to main verification page
  if (!validSession) {
    redirect('/platform/verification?error=invalid_session')
  }

  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN} `}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <VerificationClient 
          paymentStatus="success" 
          serverHasPurchase={hasPurchase} 
          reviewMode={true}
          sessionId={sessionId}
        />
      </main>
    </div>
  )
}