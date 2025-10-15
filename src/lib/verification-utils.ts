/**
 * Verification Utility Functions
 *
 * Helper functions to check user identity verification status across multiple systems.
 * Supports both legacy Medallion and new Stripe Identity verification.
 */

/**
 * Checks if a user has completed identity verification through either system.
 *
 * - Medallion (legacy): Users verified before Stripe Identity migration
 * - Stripe Identity (new): All new verifications go through Stripe
 *
 * Both are considered valid for onboarding completion.
 */
export const isIdentityVerified = (user: {
  medallionIdentityVerified?: boolean | null;
  stripeVerificationStatus?: string | null;
} | null): boolean => {
  if (!user) return false;

  const medallionVerified = !!user.medallionIdentityVerified;
  const stripeVerified = user.stripeVerificationStatus === 'verified';

  return medallionVerified || stripeVerified;
};

/**
 * Gets the verification source for a user
 * Useful for analytics and debugging
 */
export const getVerificationSource = (user: {
  medallionIdentityVerified?: boolean | null;
  stripeVerificationStatus?: string | null;
} | null): 'medallion' | 'stripe' | 'none' => {
  if (!user) return 'none';
  if (user.medallionIdentityVerified) return 'medallion';
  if (user.stripeVerificationStatus === 'verified') return 'stripe';
  return 'none';
};

/**
 * Type definition for user data with verification fields
 */
export interface UserWithVerification {
  medallionIdentityVerified?: boolean | null;
  stripeVerificationStatus?: string | null;
}
