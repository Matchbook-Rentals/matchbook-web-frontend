# Host Onboarding Requirements

This document outlines the requirements for a host to be considered "onboarding complete" and able to access all host features on the Matchbook platform.

## Current Requirements (as of Oct 2025)

A host is considered **onboarding complete** when all of the following conditions are met:

### 1. Stripe Account Setup
- `stripeAccountId` must exist (host has created a Stripe Connect account)

### 2. Stripe Onboarding Complete
- `stripeChargesEnabled` must be `true` (Stripe has verified payout capability)
- `stripeDetailsSubmitted` must be `true` (host has completed Stripe Connect onboarding)

### 3. Identity Verification
Host identity must be verified through **either** of the following systems:

**Option A: Medallion (Legacy)**
- `medallionIdentityVerified` is `true`
- Supported for backward compatibility with existing hosts

**Option B: Stripe Identity (Current)**
- `stripeVerificationStatus` is `'verified'`
- Preferred method for all new verifications

## Implementation

### Onboarding Completion Check

The canonical implementation is in `src/app/app/host/components/onboarding-checklist-card.tsx:35-43`:

```typescript
import { isIdentityVerified } from '@/lib/verification-utils';

export function isHostOnboardingComplete(hostUserData: HostUserData | null): boolean {
  if (!hostUserData) return false;

  const hasStripeAccount = !!hostUserData.stripeAccountId;
  const stripeComplete = hostUserData.stripeChargesEnabled && hostUserData.stripeDetailsSubmitted;
  const identityVerified = isIdentityVerified(hostUserData);

  return hasStripeAccount && stripeComplete && identityVerified;
}
```

### Identity Verification Utility

The dual verification system is handled by `src/lib/verification-utils.ts:16-26`:

```typescript
export const isIdentityVerified = (user: {
  medallionIdentityVerified?: boolean | null;
  stripeVerificationStatus?: string | null;
} | null): boolean => {
  if (!user) return false;

  const medallionVerified = !!user.medallionIdentityVerified;
  const stripeVerified = user.stripeVerificationStatus === 'verified';

  return medallionVerified || stripeVerified;
};
```

## What Changed

### Removed Requirements

**`agreedToHostTerms` is NO LONGER required for onboarding completion.**

**Why was it removed?**
- Terms agreement is captured and stored for legal record-keeping
- However, it should not gate access to host features
- Hosts can agree to terms at any point and it's tracked separately
- This change was implemented in commit `5a165dd7` (Oct 2025)

**Where it was removed:**
- Host onboarding completion checks
- Application access gating logic
- Booking details access logic

**Where it still exists:**
- Database field for legal compliance
- Terms display and acceptance flow
- Audit logs and legal records

### Migration to Dual Verification

**Prior to Oct 2025:**
- Only Medallion verification was supported
- All hosts were verified through Medallion's system

**After Stripe Identity Migration (Oct 2025):**
- Stripe Identity became the primary verification method
- Medallion remains supported for legacy hosts
- The system accepts both as valid via `isIdentityVerified()` utility
- New hosts are encouraged to use Stripe Identity

## User Flow

### For New Hosts

1. Create Stripe Connect account → `stripeAccountId` set
2. Complete Stripe Connect onboarding → `stripeChargesEnabled` and `stripeDetailsSubmitted` set to `true`
3. Complete identity verification via Stripe Identity → `stripeVerificationStatus` set to `'verified'`
4. ✅ Onboarding complete - full access to host features

### For Legacy Hosts (Medallion)

1. Create Stripe Connect account → `stripeAccountId` set
2. Complete Stripe Connect onboarding → `stripeChargesEnabled` and `stripeDetailsSubmitted` set to `true`
3. Already verified via Medallion → `medallionIdentityVerified` is `true`
4. ✅ Onboarding complete - full access to host features

## Feature Access Gates

The following features are gated behind onboarding completion:

- Viewing application details (`/app/host/[listingId]/applications/[applicationId]`)
- Viewing booking details (`/app/host/[listingId]/bookings/[bookingId]`)
- Managing payouts and earnings
- Accessing sensitive guest information

When a host attempts to access these features without completing onboarding:
- They are shown an `OnboardingModal` component
- The modal displays their completion status via `OnboardingChecklistCard`
- They can complete remaining steps directly from the modal
- Once complete, they gain immediate access

## Database Fields Reference

### Stripe Connect Fields
```typescript
stripeAccountId: string | null          // Stripe Connect account ID
stripeChargesEnabled: boolean           // Can receive payments
stripeDetailsSubmitted: boolean         // Completed Stripe onboarding
stripeAccountStatus: string | null      // Overall account status
```

### Identity Verification Fields

**Medallion (Legacy)**
```typescript
medallionIdentityVerified: boolean      // Verified via Medallion
medallionUserId: string | null          // Medallion user ID
medallionUserAccessCode: string | null  // Medallion access code
```

**Stripe Identity (Current)**
```typescript
stripeVerificationStatus: string | null       // 'verified' | 'processing' | 'requires_input' | 'canceled'
stripeVerificationSessionId: string | null    // Session ID
stripeVerificationReportId: string | null     // Report ID
stripeIdentityPayload: JSON | null            // Full verification data
```

### Terms & Legal (Not Required for Onboarding)
```typescript
agreedToHostTerms: boolean              // Legal record, not a gate
agreedToHostTermsAt: DateTime | null    // Timestamp of agreement
```

## Testing

### Test Onboarding Completion

```typescript
// Complete onboarding
const completeHost = {
  stripeAccountId: 'acct_123',
  stripeChargesEnabled: true,
  stripeDetailsSubmitted: true,
  stripeVerificationStatus: 'verified'
};
isHostOnboardingComplete(completeHost); // Returns true

// Legacy Medallion host
const legacyHost = {
  stripeAccountId: 'acct_456',
  stripeChargesEnabled: true,
  stripeDetailsSubmitted: true,
  medallionIdentityVerified: true
};
isHostOnboardingComplete(legacyHost); // Returns true

// Incomplete (no identity verification)
const incompleteHost = {
  stripeAccountId: 'acct_789',
  stripeChargesEnabled: true,
  stripeDetailsSubmitted: true
};
isHostOnboardingComplete(incompleteHost); // Returns false
```

## Related Documentation

- **Stripe Identity Setup**: `STRIPE_IDENTITY_DEV_SETUP.md`
- **Migration Guide**: `STRIPE_ID_MIGRATION_GUIDE.md`
- **Medallion (Legacy)**: `MEDALLION_SDK_SETUP.md`
- **Verification Utilities**: `src/lib/verification-utils.ts`
- **Onboarding Checklist**: `src/app/app/host/components/onboarding-checklist-card.tsx`

## Support

If you encounter issues with host onboarding:

1. Check Stripe Connect status in Stripe Dashboard
2. Verify identity verification status (Medallion portal or Stripe Identity dashboard)
3. Review webhook logs for failed verification events
4. Check database fields match expected values
5. Ensure `isIdentityVerified()` utility is used consistently

For verification system changes, always update this documentation to maintain accuracy.
