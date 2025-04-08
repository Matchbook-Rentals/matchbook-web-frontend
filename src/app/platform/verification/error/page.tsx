import { PAGE_MARGIN } from "@/constants/styles"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Error page for verification process
export default function VerificationErrorPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const errorType = searchParams.type as string
  
  let errorTitle = "Verification Error"
  let errorMessage = "There was an error processing your verification request."
  
  // Handle different error types
  switch (errorType) {
    case 'invalid_session':
      errorTitle = "Invalid Session"
      errorMessage = "We couldn't verify your payment session. This could happen if you're using an old link or if your session has expired."
      break
    case 'payment_failed':
      errorTitle = "Payment Failed"
      errorMessage = "Your payment could not be processed. Please try again."
      break
    default:
      // Use default messages
      break
  }

  return (
    <div className={`min-h-screen bg-background ${PAGE_MARGIN}`}>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-red-100">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{errorTitle}</h1>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/platform/verification">
                Return to Verification
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}