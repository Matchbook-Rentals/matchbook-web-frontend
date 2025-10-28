# Stripe Identity Development Setup & Testing Guide

## Overview

Stripe Identity verification has been implemented for development and testing. This is a **separate system** from Stripe Connect (which handles host payouts) and is used specifically for identity verification to prevent fraud and ensure compliance.

## What Was Implemented

### 1. Database Schema ✅
Added 5 new fields to the `User` model (prisma/schema.prisma:119-124):
- `stripeVerificationSessionId` - Session ID from Stripe
- `stripeVerificationStatus` - Current status ('requires_input' | 'processing' | 'verified' | 'canceled')
- `stripeVerificationLastCheck` - Last webhook update timestamp
- `stripeVerificationReportId` - Verification report ID
- `stripeIdentityPayload` - Full session data (JSON)

### 2. Server Actions ✅
Created `src/app/actions/stripe-identity.ts` with:
- `createStripeVerificationSession()` - Creates verification session
- `getStripeVerificationStatus()` - Gets current status
- `cancelStripeVerificationSession()` - Cancels session for retry

### 3. Webhook Handlers ✅
Extended `src/app/api/payment-webhook/route.ts` to handle:
- `identity.verification_session.created`
- `identity.verification_session.processing`
- `identity.verification_session.verified` ✅
- `identity.verification_session.requires_input` ⚠️
- `identity.verification_session.canceled` ❌

### 4. Frontend Components ✅
- `src/components/stripe-identity-verification.tsx` - Main verification UI
- `src/app/app/host/onboarding/identity-verification/identity-verification-router.tsx` - Feature flag router

---

## Development Setup

### Step 1: Environment Variables

Add to your `.env.local`:

```bash
# Already have these (for Connect):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Add this for frontend:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Enable Stripe Identity (optional, defaults to Medallion):
NEXT_PUBLIC_USE_STRIPE_IDENTITY=true
```

### Step 2: Enable Stripe Identity in Dashboard

1. Go to https://dashboard.stripe.com/test/identity
2. Enable "Identity" product in test mode
3. No additional configuration needed for basic testing

### Step 3: Configure Webhooks

You have two options for webhook testing:

#### Option A: Stripe CLI (Recommended for Local Dev)

```bash
# Install Stripe CLI if you haven't
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payment-webhook

# This will give you a webhook signing secret like: whsec_...
# Use this in your .env.local as STRIPE_WEBHOOK_SECRET
```

#### Option B: ngrok + Dashboard Webhook

```bash
# Start ngrok
ngrok http 3000

# In Stripe Dashboard > Webhooks, add endpoint:
# URL: https://your-ngrok-url.ngrok.io/api/payment-webhook
# Events to listen for:
#   - identity.verification_session.*
```

---

## Testing

### Test Mode 1: Feature Flag (Environment Variable)

1. Set `NEXT_PUBLIC_USE_STRIPE_IDENTITY=true` in `.env.local`
2. Restart your dev server
3. Navigate to: `/app/host/onboarding/identity-verification`
4. You'll see the Stripe Identity UI instead of Medallion

### Test Mode 2: URL Parameter (Quick Testing)

No need to change environment variables:

```
http://localhost:3000/app/host/onboarding/identity-verification?use_stripe=true
```

### Running a Test Verification

1. Click "Start Verification"
2. Stripe modal will open
3. Use Stripe test documents:
   - Upload any clear photo of a government ID (it will accept test images)
   - Follow the selfie prompts
   - Or skip and use test mode shortcuts

4. Check webhook logs in your terminal (if using Stripe CLI)
5. Refresh the page - you should be marked as verified

### Verify Database Updates

```bash
npx prisma studio
```

Navigate to the `User` table and check:
- `stripeVerificationSessionId` should be populated
- `stripeVerificationStatus` should be `'verified'`
- `stripeVerificationReportId` should be populated
- `stripeIdentityPayload` should contain JSON data

---

## Webhook Event Flow

```
1. User clicks "Start Verification"
   ↓
2. Frontend calls createStripeVerificationSession()
   ↓
3. Backend creates session, saves sessionId to DB
   ↓
4. Frontend shows Stripe modal (stripe.verifyIdentity())
   ↓
5. User completes verification
   ↓
6. Stripe sends webhook: identity.verification_session.verified
   ↓
7. Webhook handler updates DB status to 'verified'
   ↓
8. User is redirected, page checks status
```

---

## Testing Different Verification Outcomes

### Success Flow
- Upload any valid-looking ID
- Complete selfie
- Status → `verified`

### Requires Input Flow
- Upload blurry/expired document
- Status → `requires_input`
- User can retry with better images

### Cancel Flow
- Close the modal without completing
- Status → `canceled`
- User can start new session

---

## Useful Stripe CLI Commands

```bash
# Test webhook events manually
stripe trigger identity.verification_session.verified

stripe trigger identity.verification_session.requires_input

# View webhook events in real-time
stripe listen

# View recent events
stripe events list --limit 10
```

---

## Troubleshooting

### Issue: "Stripe publishable key not configured"
**Fix**: Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local`

### Issue: Webhook not firing
**Fix**:
- Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/payment-webhook`
- Verify webhook secret matches in `.env`

### Issue: Modal doesn't open
**Fix**:
- Check browser console for errors
- Verify Stripe.js loaded: Look for network request to `https://js.stripe.com`
- Check publishable key is correct

### Issue: Status not updating after verification
**Fix**:
- Check webhook handler logs
- Verify `user_id` in session metadata
- Check database connection

---

## Migration Strategy

### Current State (Production)
- **Medallion**: Legacy system, still supported for backward compatibility
- **Stripe Identity**: Primary verification system for all new verifications
- **Dual Verification**: Both systems are accepted as valid via `isIdentityVerified()` utility

### Host Onboarding Requirements
A host is considered "onboarding complete" when:
1. ✅ Stripe Account created (`stripeAccountId`)
2. ✅ Stripe onboarding complete (`stripeChargesEnabled` && `stripeDetailsSubmitted`)
3. ✅ Identity verified via **either** Medallion OR Stripe Identity

**Note:** `agreedToHostTerms` is NO LONGER required for onboarding completion. Terms agreement is handled separately and does not gate access to host features.

### Rollout Status
1. ✅ Enabled for internal team testing
2. ✅ Implemented dual verification system
3. ✅ Deployed to production with feature flag
4. ⏳ Monitor metrics (completion rate, failure reasons)
5. ⏳ Eventually deprecate Medallion (keeping read-only support)

### Feature Flag Options for Production
1. **Environment Variable** (simplest)
   ```bash
   NEXT_PUBLIC_USE_STRIPE_IDENTITY=true
   ```

2. **User-based Rollout** (recommended)
   - Modify router to check user properties
   - Example: Enable for users created after certain date
   - Example: Enable for specific user IDs (beta testers)

3. **Third-party Feature Flags** (advanced)
   - LaunchDarkly, Split.io, etc.
   - Allows real-time toggling without deployment

---

## Stripe Identity vs Stripe Connect

**Stripe Connect** (Already Implemented):
- Verifies hosts can receive payments
- Required for KYC/AML compliance
- Lives on `stripeAccountId`, `stripeChargesEnabled`, etc.

**Stripe Identity** (Just Implemented):
- Verifies user identity for fraud prevention
- Separate product from Connect
- Lives on `stripeVerificationStatus`, `stripeVerificationSessionId`, etc.

**They are independent!** A host needs:
1. Stripe Connect setup (to receive payments)
2. Stripe Identity verification (to prevent fraud)

---

## Next Steps

1. ✅ Basic implementation complete
2. ⏳ Test in development with test documents
3. ⏳ Enable Identity product in Stripe Dashboard (production)
4. ⏳ Monitor webhook delivery and success rates
5. ⏳ Plan gradual rollout strategy
6. ⏳ Update onboarding checklist to use Stripe status
7. ⏳ Create admin panel to view verification status

---

## Files Modified/Created

### Created:
- `src/app/actions/stripe-identity.ts`
- `src/components/stripe-identity-verification.tsx`
- `src/app/app/host/onboarding/identity-verification/identity-verification-router.tsx`

### Modified:
- `prisma/schema.prisma` (added 5 fields)
- `src/app/api/payment-webhook/route.ts` (added 5 webhook handlers)
- `src/app/app/host/onboarding/identity-verification/page.tsx` (added router)

### Unchanged:
- All Medallion code (preserved for backward compatibility)
- All Stripe Connect code (independent system)

---

## Support & Resources

- **Stripe Identity Docs**: https://docs.stripe.com/identity
- **Test Documents**: Use any clear photo in test mode
- **Webhook Events**: https://dashboard.stripe.com/test/webhooks
- **Verification Sessions**: https://dashboard.stripe.com/test/identity/verification_sessions

---

**Ready to test!** 🚀

Set `NEXT_PUBLIC_USE_STRIPE_IDENTITY=true` in your `.env.local` and start the dev server.
