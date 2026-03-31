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

// ============================================================================
// Host Onboarding
// ============================================================================

export const isHostOnboardingComplete = (hostUserData: {
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean | null;
  stripeDetailsSubmitted: boolean | null;
  medallionIdentityVerified?: boolean | null;
  stripeVerificationStatus?: string | null;
  agreedToHostTerms: Date | null;
} | null): boolean => {
  if (!hostUserData) return false;

  const hasStripeAccount = !!hostUserData.stripeAccountId;
  const stripeComplete = hostUserData.stripeChargesEnabled && hostUserData.stripeDetailsSubmitted;
  const identityVerified = isIdentityVerified(hostUserData);
  const fcraAcknowledged = !!hostUserData.agreedToHostTerms;

  return hasStripeAccount && !!stripeComplete && identityVerified && fcraAcknowledged;
};

// ============================================================================
// Host Stripe Account Health
// ============================================================================

interface UserWithStripeAccount {
  stripeAccountStatus?: string | null;
  stripeChargesEnabled?: boolean | null;
}

export const isHostAccountActive = (user: UserWithStripeAccount | null): boolean => {
  if (!user) return false;
  if (user.stripeAccountStatus === null || user.stripeAccountStatus === undefined) {
    return user.stripeChargesEnabled === true;
  }
  return user.stripeAccountStatus === 'enabled' && user.stripeChargesEnabled !== false;
};

export type AccountIssueSeverity = 'none' | 'warning' | 'critical';

export interface HostAccountIssues {
  isActive: boolean;
  severity: AccountIssueSeverity;
  status: string | null;
  requirementsDue: {
    currently_due: string[];
    past_due: string[];
    eventually_due: string[];
    disabled_reason: string | null;
  } | null;
  disabledReason: string | null;
}

export const getHostAccountIssues = (user: UserWithStripeAccount & {
  stripeRequirementsDue?: string | null;
} | null): HostAccountIssues => {
  const defaultResult: HostAccountIssues = {
    isActive: true, severity: 'none', status: null, requirementsDue: null, disabledReason: null,
  };
  if (!user) return defaultResult;

  const isActive = isHostAccountActive(user);
  const status = user.stripeAccountStatus ?? null;

  let requirementsDue: HostAccountIssues['requirementsDue'] = null;
  if (user.stripeRequirementsDue) {
    try { requirementsDue = JSON.parse(user.stripeRequirementsDue); } catch { requirementsDue = null; }
  }

  let severity: AccountIssueSeverity = 'none';
  if (status === 'disabled' || status === 'restricted') severity = 'critical';
  else if (status === 'pending') severity = 'warning';
  else if (!isActive) severity = 'critical';

  return { isActive, severity, status, requirementsDue, disabledReason: requirementsDue?.disabled_reason ?? null };
};
