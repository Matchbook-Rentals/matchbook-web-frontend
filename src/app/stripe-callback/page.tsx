'use client'

import { useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function StripeCallbackPage() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for Clerk to load
      if (!isLoaded) return

      const redirectTo = searchParams.get('redirect_to')
      const accountId = searchParams.get('account_id')

      // If not signed in, redirect to sign-in
      if (!isSignedIn) {
        const signInUrl = new URL('/sign-in', window.location.origin)
        signInUrl.searchParams.set('redirect_url', window.location.href)
        signInUrl.searchParams.set('from_stripe', 'true')
        router.push(signInUrl.toString())
        return
      }

      // User is authenticated, now check onboarding status and redirect
      try {
        let onboardingComplete = false
        let userAccountId = accountId

        // Get account ID from user record if not in URL
        if (!userAccountId) {
          const userResponse = await fetch('/api/user/stripe-account')
          const userData = await userResponse.json()
          userAccountId = userData.stripeAccountId
        }

        // Check onboarding status and update database
        let chargesEnabled = false
        let detailsSubmitted = false
        let payoutsEnabled = false
        if (userAccountId) {
          // Update and get the latest status from Stripe
          const updateResponse = await fetch('/api/user/update-stripe-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })

          if (updateResponse.ok) {
            const updateData = await updateResponse.json()
            chargesEnabled = updateData.chargesEnabled
            detailsSubmitted = updateData.detailsSubmitted
            payoutsEnabled = updateData.payoutsEnabled
            onboardingComplete = chargesEnabled && detailsSubmitted
          } else {
            // Fallback to checking status without updating
            const statusResponse = await fetch(`/api/stripe/account-status?account_id=${userAccountId}`)
            const statusData = await statusResponse.json()
            onboardingComplete = statusData.onboardingComplete
            chargesEnabled = statusData.chargesEnabled
            detailsSubmitted = statusData.detailsSubmitted
            payoutsEnabled = statusData.payoutsEnabled
          }
        }

        // Determine where to redirect
        let finalRedirectUrl = redirectTo || '/app/host/dashboard/overview'

        // Use replace to avoid back button issues
        router.replace(finalRedirectUrl)

      } catch (error) {
        console.error('Error in Stripe callback:', error)
        router.replace('/app/host/dashboard/overview?error=callback-failed')
      } finally {
        setIsChecking(false)
      }
    }

    handleCallback()
  }, [isLoaded, isSignedIn, userId, searchParams, router])

  // Show loading state while checking auth
  if (isChecking || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#3c8787]" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Setup...
          </h2>
          <p className="text-gray-600">
            Please wait while we finalize your payment setup.
          </p>
        </div>
      </div>
    )
  }

  return null
}