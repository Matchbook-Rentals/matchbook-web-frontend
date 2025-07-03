'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

export default function OnboardingIncompletePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const redirectTo = searchParams.get('redirect_to')
  const accountId = searchParams.get('account_id')
  const [chargesEnabled, setChargesEnabled] = useState(searchParams.get('charges_enabled') === 'true')
  const [detailsSubmitted, setDetailsSubmitted] = useState(searchParams.get('details_submitted') === 'true')

  const handleRefreshStatus = async () => {
    if (!accountId) return

    setIsRefreshing(true)
    try {
      // Check the current status from Stripe
      const statusResponse = await fetch(`/api/stripe/account-status?account_id=${accountId}`)
      const statusData = await statusResponse.json()
      
      // Update the local state with the new status
      setChargesEnabled(statusData.chargesEnabled || false)
      setDetailsSubmitted(statusData.detailsSubmitted || false)
      
      // If onboarding is now complete, redirect to the original destination
      if (statusData.onboardingComplete) {
        const finalUrl = new URL(redirectTo || '/dashboard', window.location.origin)
        finalUrl.searchParams.set('onboarding_complete', 'true')
        router.replace(finalUrl.toString())
      }
    } catch (error) {
      console.error('Error refreshing status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleContinueOnboarding = async () => {
    if (!accountId) return

    setIsCreatingLink(true)
    try {
      // Create callback URLs for the continuation
      const callbackUrl = new URL('/stripe-callback', window.location.origin)
      callbackUrl.searchParams.set('redirect_to', redirectTo || '/dashboard')
      callbackUrl.searchParams.set('account_id', accountId)
      
      const refreshUrl = new URL('/stripe-callback', window.location.origin)
      refreshUrl.searchParams.set('redirect_to', redirectTo || '/dashboard')
      refreshUrl.searchParams.set('account_id', accountId)
      
      // Create a new account link for continuation
      const linkResponse = await fetch('/api/payment/account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: accountId,
          returnUrl: callbackUrl.toString(),
          refreshUrl: refreshUrl.toString()
        }),
      })

      const linkData = await linkResponse.json()
      if (linkData.url) {
        // Redirect to Stripe's hosted onboarding to complete setup
        window.location.href = linkData.url
      } else {
        console.error('Error creating account link:', linkData.error)
        setIsCreatingLink(false)
      }
    } catch (error) {
      console.error('Error continuing onboarding:', error)
      setIsCreatingLink(false)
    }
  }

  const handleSkipForNow = () => {
    // Redirect to original destination with incomplete status
    const finalUrl = new URL(redirectTo || '/dashboard', window.location.origin)
    finalUrl.searchParams.set('onboarding_incomplete', 'true')
    router.push(finalUrl.toString())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg 
                className="h-6 w-6 text-yellow-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <CardTitle className="mt-6 text-2xl font-bold text-gray-900">
              Payment Setup Incomplete
            </CardTitle>
            <CardDescription className="mt-2">
              Your payment account needs additional information before you can accept payments.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Current Status:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Created</span>
                  <span className="text-green-600 font-medium">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Details Submitted</span>
                  <span className={detailsSubmitted ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                    {detailsSubmitted ? "✓ Complete" : "⚠ Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Charges Enabled</span>
                  <span className={chargesEnabled ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                    {chargesEnabled ? "✓ Complete" : "⚠ Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What&apos;s needed:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {!detailsSubmitted && <li>• Complete your business or personal information</li>}
                {!chargesEnabled && <li>• Verify your identity with required documents</li>}
                <li>• Bank account details for receiving payments</li>
              </ul>
            </div>

            {!chargesEnabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> If you haven't added your ID, please click "Continue Setup" below and upload your ID. 
                  If you have already uploaded your ID, please allow 1 minute for Stripe to process the ID, then click "Refresh Status".
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleContinueOnboarding}
                disabled={isCreatingLink || isRefreshing}
                className="w-full h-12 bg-[#3c8787] hover:bg-[#2d6565] text-white"
              >
                {isCreatingLink ? 'Creating Link...' : 'Continue Setup'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRefreshStatus}
                disabled={isCreatingLink || isRefreshing}
                className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking Status...' : 'Refresh Status'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSkipForNow}
                disabled={isCreatingLink || isRefreshing}
                className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Skip for Now
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You can complete this setup later, but you won&apos;t be able to accept payments until it&apos;s finished.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}