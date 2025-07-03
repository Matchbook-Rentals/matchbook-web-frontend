'use client'

import { useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

        // Check onboarding status if we have an account
        let chargesEnabled = false
        let detailsSubmitted = false
        if (userAccountId) {
          const statusResponse = await fetch(`/api/stripe/account-status?account_id=${userAccountId}`)
          const statusData = await statusResponse.json()
          onboardingComplete = statusData.onboardingComplete
          chargesEnabled = statusData.chargesEnabled
          detailsSubmitted = statusData.detailsSubmitted
        }

        // If onboarding is not complete, redirect to a completion page instead
        if (userAccountId && (!chargesEnabled || !detailsSubmitted)) {
          const incompleteUrl = new URL('/onboarding-incomplete', window.location.origin)
          incompleteUrl.searchParams.set('redirect_to', redirectTo || '/dashboard')
          incompleteUrl.searchParams.set('account_id', userAccountId)
          incompleteUrl.searchParams.set('charges_enabled', chargesEnabled.toString())
          incompleteUrl.searchParams.set('details_submitted', detailsSubmitted.toString())
          router.replace(incompleteUrl.toString())
          return
        }

        // Determine where to redirect for completed onboarding
        let finalRedirectUrl = redirectTo || '/dashboard'
        
        // Add onboarding status to URL
        const redirectUrl = new URL(finalRedirectUrl, window.location.origin)
        redirectUrl.searchParams.set('onboarding_complete', onboardingComplete.toString())
        
        // Use replace to avoid back button issues
        router.replace(redirectUrl.toString())

      } catch (error) {
        console.error('Error in Stripe callback:', error)
        router.replace('/dashboard?error=callback-failed')
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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