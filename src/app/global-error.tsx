'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button' // Assuming you have a Button component

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // You can check error.message or error.name here for specific Clerk errors if needed
    console.error("Global Error Boundary Caught:", error)
  }, [error])

  // Basic error message - could be enhanced to check for specific Clerk errors
  const isAuthError = error.message.includes('unauthenticated') || error.message.includes('Unauthorized'); // Example check

  return (
    <html>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '20px' }}>
          <h2>Something went wrong!</h2>
          {isAuthError ? (
            <p>Your session might have expired. Please refresh the page or try logging in again.</p>
          ) : (
            <p>An unexpected error occurred. Please try refreshing the page.</p>
          )}
          <Button 
            onClick={
              // Attempt to recover by trying to re-render the segment
              // () => reset() 
              // OR more reliably for session issues, force a full refresh:
              () => window.location.reload()
            }
            style={{ marginTop: '20px' }}
          >
            Refresh Page
          </Button>
        </div>
      </body>
    </html>
  )
}
