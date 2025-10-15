'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { createStripeVerificationSession } from '@/app/actions/stripe-identity';

interface StripeIdentityVerificationProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectUrl?: string;
}

export default function StripeIdentityVerification({
  onSuccess,
  onError,
  redirectUrl,
}: StripeIdentityVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Auto-redirect after successful verification
  useEffect(() => {
    if (verificationStatus === 'success') {
      const timer = setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          onSuccess?.();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, redirectUrl, onSuccess]);

  const handleVerifyIdentity = async () => {
    setIsLoading(true);
    setError(null);
    setVerificationStatus('loading');

    try {
      console.log('🔐 Starting Stripe Identity verification...');

      // Get the verification session from our backend
      const result = await createStripeVerificationSession();

      if (!result.success || !result.clientSecret) {
        const errorMsg = result.error || 'Failed to create verification session';
        setError(errorMsg);
        setVerificationStatus('error');
        onError?.(errorMsg);
        setIsLoading(false);
        return;
      }

      console.log('✅ Verification session created:', result.sessionId);

      // Load Stripe.js
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

      if (!stripe) {
        const errorMsg = 'Failed to load Stripe';
        setError(errorMsg);
        setVerificationStatus('error');
        onError?.(errorMsg);
        setIsLoading(false);
        return;
      }

      console.log('🎨 Opening Stripe Identity verification modal...');

      // Open the verification modal
      const { error: verifyError } = await stripe.verifyIdentity(result.clientSecret);

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
        setError(verifyError.message || 'Verification failed');
        setVerificationStatus('error');
        onError?.(verifyError.message || 'Verification failed');
        setIsLoading(false);
        return;
      }

      console.log('✅ Verification completed successfully!');
      setVerificationStatus('success');
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Error during verification:', err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      setVerificationStatus('error');
      onError?.(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Identity Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationStatus === 'idle' && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Why do we verify identities?</h3>
                <p className="text-sm text-gray-600">
                  Identity verification helps us maintain a safe and trusted community by:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  <li>Preventing fraud and protecting both hosts and renters</li>
                  <li>Ensuring compliance with regulatory requirements</li>
                  <li>Building trust within the Matchbook community</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What you&apos;ll need:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>A valid government-issued photo ID (driver&apos;s license, passport, etc.)</li>
                  <li>A camera or smartphone for document capture</li>
                  <li>Good lighting for clear photos</li>
                  <li>A few minutes to complete the process</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Privacy note:</strong> Your verification data is securely encrypted and processed by Stripe.
                  We never store your ID documents on our servers.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleVerifyIdentity}
              disabled={isLoading}
              className="w-full h-12 bg-[#3c8787] hover:bg-[#2d6666] text-white"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Loading verification...
                </>
              ) : (
                'Start Verification'
              )}
            </Button>
          </>
        )}

        {verificationStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-700 mb-2">
              Verification Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              Your identity has been successfully verified. Redirecting you back...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">Redirecting...</span>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && error && (
          <div className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 mb-2">
              Verification Failed
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                setVerificationStatus('idle');
                setError(null);
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
