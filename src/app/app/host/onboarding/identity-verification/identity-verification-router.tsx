'use client';

import { useSearchParams } from 'next/navigation';
import IdentityVerificationSDKClient from './identity-verification-sdk-client';
import StripeIdentityVerification from '@/components/stripe-identity-verification';

interface UserData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  authenticatedFirstName: string | null;
  authenticatedMiddleName: string | null;
  authenticatedLastName: string | null;
  authenticatedDateOfBirth: string | null;
  medallionIdentityVerified: boolean | null;
  medallionVerificationStatus: string | null;
  medallionUserId: string | null;
  stripeVerificationStatus: string | null;
}

interface IdentityVerificationRouterProps {
  userData: UserData;
  redirectUrl?: string;
  isReturningFromVerification?: boolean;
  error?: string;
}

/**
 * Identity Verification Router
 *
 * All new identity verifications now go through Stripe Identity (redirect-based flow).
 * Medallion verification is still accepted for users who were verified before the migration.
 */
export default function IdentityVerificationRouter({
  userData,
  redirectUrl,
  isReturningFromVerification = false,
  error,
}: IdentityVerificationRouterProps) {
  const searchParams = useSearchParams();

  // Legacy: Force Medallion via URL parameter (for debugging only)
  const forceMedallion = searchParams?.get('use_medallion') === 'true';

  console.log('Identity Verification Router:', {
    isReturningFromVerification,
    stripeStatus: userData.stripeVerificationStatus,
    medallionStatus: userData.medallionIdentityVerified,
    forceMedallion,
  });

  // Route to Stripe Identity (default for all new verifications)
  if (!forceMedallion) {
    console.log('✨ Routing to Stripe Identity verification');

    // If returning from Stripe and status is processing, show processing state
    if (isReturningFromVerification && userData.stripeVerificationStatus === 'processing') {
      console.log('⏳ Verification is processing, showing status page');
    }

    // Check if user is already verified via either system
    if (userData.stripeVerificationStatus === 'verified' || userData.medallionIdentityVerified) {
      console.log('✅ User already verified');
      // Let the parent page handle redirect
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="text-[#3c8787] hover:text-[#2d6666] font-semibold"
          >
            ← Back
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#373940] mb-2">
            Host Identity Verification
          </h1>
          <p className="text-gray-600">
            All hosts must verify their identity before accepting an application
          </p>
        </div>

        <StripeIdentityVerification
          redirectUrl={redirectUrl || '/app/host/dashboard/overview'}
          isReturningFromVerification={isReturningFromVerification}
          verificationStatus={userData.stripeVerificationStatus || undefined}
          onSuccess={() => {
            console.log('✅ Stripe Identity verification successful');
          }}
          onError={(err) => {
            console.error('❌ Stripe Identity verification error:', err);
          }}
        />

      </div>
    );
  }

  // Legacy: Use Medallion (only via ?use_medallion=true URL parameter for debugging)
  console.log('📜 Routing to Medallion verification (legacy/debug mode)');

  return (
    <IdentityVerificationSDKClient
      userData={userData}
      redirectUrl={redirectUrl}
      isReturningFromVerification={isReturningFromVerification}
      error={error}
    />
  );
}
