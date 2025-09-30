# Payment Specification

> **Reference Document**: This document describes how payments work in the Matchbook platform. All payment-related code should reference this document for context.

**Last Updated**: 2025-01-XX
**Status**: Active

---

## Table of Contents

1. [Overview](#overview)
2. [Payment Types](#payment-types)
3. [Fee Structure](#fee-structure)
4. [Payment Flow](#payment-flow)
5. [Payment States](#payment-states)
6. [Amount Calculations](#amount-calculations)
7. [ACH-Specific Handling](#ach-specific-handling)
8. [Error Handling](#error-handling)
9. [Webhook Events](#webhook-events)
10. [Implementation Files](#implementation-files)

---

## Overview

The Matchbook platform processes two main types of transactions:
1. **Initial Deposit Payment** - Security deposit + pet deposit + $7 transfer fee (paid at lease signing)
2. **Monthly Rent Payments** - Recurring rent payments (scheduled separately, not covered in lease signing flow)

This spec focuses on the **initial deposit payment** during the lease signing process.

---

## Payment Types

### Credit Card
- **Type Code**: `card` (frontend), `card` (Stripe API)
- **Processing**: Immediate authorization and capture
- **Fee**: 3% processing fee (self-inclusive formula)
- **Settlement**: Instant - funds available immediately
- **User Experience**: Immediate confirmation, booking created instantly

### ACH Bank Transfer
- **Type Code**: `bank` (frontend), `us_bank_account` (Stripe API)
- **Processing**: Asynchronous - can take 3-5 business days
- **Fee**: No additional processing fee
- **Settlement**: Delayed - funds verified after 3-5 business days
- **User Experience**: Immediate booking creation, but payment "processing" for days
- **Verification**: New bank accounts may require micro-deposit verification

---

## Fee Structure

### Transfer Fee (Deposits)
- **Amount**: $7 flat fee
- **Applied To**: All deposit transactions (security + pet deposits)
- **Purpose**: Platform fee for handling deposit transfers
- **Who Pays**: Tenant
- **Who Receives**: MatchBook platform
- **When Charged**: At lease signing payment

### Credit Card Processing Fee
- **Amount**: 3% of total amount
- **Formula**: Self-inclusive calculation
  ```
  totalToCharge = baseAmount / (1 - 0.03)
  fee = totalToCharge - baseAmount
  ```
- **Applied To**: ALL amounts when paying by card (deposits + transfer fee)
- **Purpose**: Cover Stripe's payment processing costs
- **Who Pays**: Tenant (optional - can choose ACH to avoid)
- **Who Receives**: Stripe (payment processor)
- **Example**:
  - Base amount: $227 (deposits + $7 transfer fee)
  - Credit card fee: $7.01
  - Total charged: $234.01
  - We receive: $227 ✓

### Service Fee (Rent)
- **Amount**: 3% (trips ≤6 months) or 1.5% (trips >6 months)
- **Applied To**: Monthly rent only (not deposits)
- **Note**: Not relevant for initial deposit payment at lease signing
- **Charged**: As part of recurring rent payments

---

## Payment Flow

### Step 1: Lease Signing
**File**: `src/app/app/rent/match/[matchId]/lease-signing-client.tsx`

1. User reviews lease document
2. User signs all required fields
3. System transitions to payment step
4. User sees `PaymentReviewScreen` component

### Step 2: Payment Method Selection
**File**: `src/components/payment-review/PaymentReviewScreen.tsx`

1. System fetches available payment methods via `/api/user/payment-methods`
2. User sees list of saved payment methods (cards + bank accounts)
3. User can:
   - Select existing payment method
   - Add new payment method via inline form
4. Amount updates dynamically based on payment type:
   - **Card selected**: Shows amount + 3% fee
   - **Bank selected**: Shows base amount (no fee)

### Step 3: Payment Processing
**File**: `src/app/actions/process-payment.ts`

1. User clicks "Pay and Book"
2. System calls `processDirectPayment()` server action with:
   - `matchId` - The match being paid for
   - `paymentMethodId` - Selected Stripe payment method ID
   - `amount` - Total amount to charge
   - `includeCardFee` - Boolean (true for cards, false for ACH)

3. Server action:
   - Verifies user is the renter
   - Verifies host has Stripe Connect account
   - Gets/creates Stripe customer for renter
   - Attaches payment method to customer
   - Calculates landlord transfer amount (deposits - $7 fee)
   - Creates Stripe PaymentIntent with:
     - `confirm: true` - Auto-confirm
     - `capture_method: 'automatic'` - Auto-capture
     - `transfer_data` - Transfer to landlord's Stripe Connect account

4. Payment Intent created with metadata:
   ```javascript
   {
     matchId: 'match_xxx',
     userId: 'user_xxx',
     hostUserId: 'host_xxx',
     type: 'security_deposit_direct',
     paymentMethodType: 'card' | 'us_bank_account',
     transferFee: '7.00',
     cardProcessingFee: '7.01', // if card
     landlordAmount: '220.00',
     totalAmount: '234.01'
   }
   ```

### Step 4: Payment Status Update
**File**: `src/app/actions/process-payment.ts:199-228`

Based on PaymentIntent status:

**Card Payment (Status: `succeeded`)**:
- ✅ Immediate success
- Sets `paymentCapturedAt` timestamp
- Sets `paymentStatus = 'captured'`
- Creates booking immediately
- User sees success screen

**ACH Payment (Status: `processing`)**:
- ⏳ Payment is processing
- Sets `paymentCapturedAt` timestamp (important for booking creation!)
- Sets `paymentStatus = 'processing'`
- Creates booking immediately (payment will settle in 3-5 days)
- User sees success screen (but payment still settling in background)

### Step 5: Booking Creation
**File**: `src/app/actions/process-payment.ts:250-284`

If payment is authorized (or processing) AND no booking exists:
1. Create `Booking` record
2. Set status to `confirmed`
3. Link to match, trip, and listing
4. Create `ListingUnavailability` to block dates

### Step 6: Webhook Confirmation (Async)
**File**: `src/app/api/payment-webhook/route.ts`

Stripe sends webhook events as payment progresses:

**For Card Payments**:
- `payment_intent.succeeded` - Immediate (within seconds)
- Updates match status if needed
- Backup booking creation if primary flow failed

**For ACH Payments**:
- `payment_intent.processing` - Immediate (payment started)
- `payment_intent.succeeded` - 3-5 business days later (payment cleared)
- `payment_intent.payment_failed` - If ACH fails (insufficient funds, etc.)

---

## Payment States

### Match Payment Status Field Values
**Database Field**: `Match.paymentStatus` (String)

| Status | Description | Next Steps |
|--------|-------------|------------|
| `null` | No payment attempted yet | User needs to complete payment |
| `authorized` | Payment method authorized but not charged | Should not occur (we auto-capture) |
| `processing` | ACH payment initiated, awaiting bank transfer | Wait 3-5 days for settlement |
| `captured` | Payment successfully charged and settled | Booking confirmed |
| `failed` | Payment attempt failed | User needs to retry with different method |

### Match Timestamp Fields
**Database Fields**: `Match.paymentAuthorizedAt`, `Match.paymentCapturedAt`

| Field | Description | When Set |
|-------|-------------|----------|
| `paymentAuthorizedAt` | When payment intent was created | Immediately for all payment types |
| `paymentCapturedAt` | When payment was captured/charged | Immediately for cards, immediately for ACH (even while processing) |

**⚠️ Important**: We set `paymentCapturedAt` for ACH payments even while status is "processing" because we need this timestamp to create bookings. The booking is created optimistically, and if ACH fails in 3-5 days, we handle it via webhook.

---

## Amount Calculations

### Initial Deposit Payment Calculation
**Files**:
- `src/lib/payment-calculations.ts`
- `src/lib/fee-constants.ts`

```typescript
// Example: 1 bedroom, $2000/month, 1 pet
const securityDeposit = 2000;      // 1 month rent
const petDeposit = 200;            // Per pet
const totalDeposits = 2200;

const transferFee = 7;             // Flat platform fee
const baseAmount = 2207;           // Total before card fee

// If paying by card:
const cardFee = baseAmount / (1 - 0.03) - baseAmount;  // = ~$68.25
const totalWithCard = baseAmount + cardFee;            // = $2275.25

// If paying by bank:
const totalWithBank = baseAmount;                      // = $2207 (no fee)
```

### Landlord Transfer Calculation
**File**: `src/app/actions/process-payment.ts:147-160`

```typescript
// What landlord receives (example with card payment):
const totalCharged = 2275.25;      // Total charged to tenant
const cardFee = 68.25;             // Stripe's cut (goes to Stripe, not us)
const baseAmount = 2207;           // After Stripe fee

const transferFee = 7;             // MatchBook platform fee
const landlordAmount = 2200;       // baseAmount - transferFee

// Transfer breakdown:
// - Tenant pays: $2275.25
// - Stripe takes: $68.25 (card processing)
// - MatchBook takes: $7.00 (platform fee)
// - Landlord gets: $2200.00 (original deposits)
```

---

## ACH-Specific Handling

### Why ACH is Different

ACH bank transfers are **asynchronous** and take 3-5 business days to settle, unlike credit cards which are instant. This creates several special considerations:

### ACH Payment Timeline

```
Day 0 (Lease Signing):
  ├─ User selects bank account
  ├─ Stripe PaymentIntent created (status: processing)
  ├─ Match.paymentStatus = 'processing'
  ├─ Match.paymentCapturedAt = NOW (set immediately!)
  ├─ Booking created immediately
  └─ User sees "success" screen

Day 1-4:
  ├─ ACH transfer in progress
  ├─ Stripe is debiting user's bank account
  └─ Funds not yet available to landlord

Day 3-5:
  ├─ ACH transfer completes
  ├─ Stripe webhook: payment_intent.succeeded
  ├─ Match.paymentStatus = 'captured'
  └─ Funds transferred to landlord's Stripe account

  OR (if fails):
  ├─ ACH transfer fails
  ├─ Stripe webhook: payment_intent.payment_failed
  └─ Match.paymentStatus = 'failed'
```

### ACH Recovery Flow (✅ Implemented)

We've implemented a comprehensive recovery system for ACH payment failures. Here's how it works:

#### Updated ACH Payment Timeline

```
Day 0 (Lease Signing):
  ├─ User selects bank account
  ├─ Stripe PaymentIntent created (status: processing)
  ├─ Match.paymentStatus = 'processing'
  ├─ Booking created with status = 'pending_payment'  ✅ NEW
  ├─ Booking.paymentStatus = 'processing'  ✅ NEW
  └─ User sees "success" screen with processing notice

Day 1-4:
  ├─ ACH transfer in progress
  ├─ Stripe is debiting user's bank account
  └─ Booking remains in 'pending_payment' state

Day 3-5 (Success Path):
  ├─ ACH transfer completes
  ├─ Webhook: payment_intent.succeeded  ✅
  ├─ Match.paymentStatus = 'captured'
  ├─ Match.paymentCapturedAt = NOW (finally set!)  ✅
  ├─ Booking.status = 'confirmed'  ✅
  ├─ Booking.paymentStatus = 'settled'  ✅
  ├─ Booking.paymentSettledAt = NOW  ✅
  └─ Success email sent to renter  ✅

Day 1-5 (Failure Path):
  ├─ ACH transfer rejected by bank
  ├─ Webhook: payment_intent.payment_failed  ✅
  ├─ Match.paymentStatus = 'failed'  ✅
  ├─ Match.paymentFailureCode = 'R01' (etc)  ✅
  ├─ Booking.status = 'payment_failed'  ✅
  ├─ Booking.paymentFailureMessage = human-readable reason  ✅
  ├─ Failure email sent to BOTH renter and host  ✅
  ├─ Renter gets retry link + 48-hour deadline  ✅
  └─ Host gets notification of issue  ✅
```

#### Booking Status Values

| Status | Meaning | User Action |
|--------|---------|-------------|
| `reserved` | Lease signed, no payment yet | Complete payment |
| `pending_payment` | ACH processing (3-5 days) | Wait for settlement |
| `confirmed` | Payment settled, booking active | None - all good! |
| `payment_failed` | ACH rejected by bank | Retry payment within 48 hours |
| `cancelled` | Booking cancelled | None |

#### Payment Status Values (on Booking model)

| Status | Meaning |
|--------|---------|
| `pending` | Payment not initiated |
| `processing` | ACH in progress |
| `settled` | Payment completed |
| `failed` | Payment rejected |

#### Email Notifications (✅ Implemented)

**Success Email** (`sendPaymentSuccessEmail`):
- Sent to renter when ACH settles
- Confirms payment amount and booking
- Provides booking details
- File: `src/lib/emails.ts:77-136`

**Failure Emails** (`sendPaymentFailureEmails`):
- **To Renter**: Urgent action required
  - Shows failure reason (e.g., "Insufficient funds")
  - Provides retry payment link
  - Shows 48-hour countdown
  - Clear call-to-action button
- **To Host**: Informational notification
  - Alerts about payment issue
  - Explains 48-hour grace period
  - No action required from host
- File: `src/lib/emails.ts:145-284`

#### Retry Payment Flow (🚧 Placeholder Created)

Location: `/app/rent/match/[matchId]/retry-payment`

**Features**:
- Access control: Only renter can access
- Shows failure reason clearly
- 48-hour countdown timer
- Payment method selector (reuse existing)
- Calls same `processDirectPayment` action
- Can retry with different card or bank account

**Implementation Status**: Detailed README created at `src/app/app/rent/match/[matchId]/retry-payment/README.md`

Full UI implementation needed with:
- Server component for data fetching
- Client component for payment interaction
- Countdown timer component
- Dashboard status badges

#### Database Changes (✅ Implemented)

**Booking Model** (`prisma/schema.prisma`):
```prisma
model Booking {
  status                String?   // "reserved", "pending_payment", "confirmed", "payment_failed"
  paymentStatus         String?   // "pending", "processing", "settled", "failed"
  paymentFailureCode    String?   // Stripe error code (R01, R02, etc)
  paymentFailureMessage String?   // Human-readable reason
  paymentSettledAt      DateTime? // When ACH actually cleared
}
```

**Match Model** (`prisma/schema.prisma`):
```prisma
model Match {
  paymentStatus         String?   // "processing", "captured", "failed"
  paymentFailureCode    String?   // Stripe error code
  paymentFailureMessage String?   // Human-readable reason
}
```

#### Webhook Events Handled (✅ Implemented)

**File**: `src/app/api/payment-webhook/route.ts`

1. **`payment_intent.processing`** (NEW)
   - Updates match/booking to processing status
   - Confirms ACH has started

2. **`payment_intent.succeeded`** (ENHANCED)
   - Sets `paymentCapturedAt` (finally!)
   - Updates booking to `confirmed`
   - Sets `paymentSettledAt`
   - Sends success email

3. **`payment_intent.payment_failed`** (ENHANCED)
   - Captures failure code and message
   - Updates booking to `payment_failed`
   - Sends failure emails to both parties
   - Provides recovery instructions

### Remaining TODOs

**⚠️ Still Needed**:

1. **Retry Payment UI** - Full implementation
   - Server + client components
   - Countdown timer
   - Payment method integration

2. **Dashboard Status Badges** - Show payment states
   - 🟡 "Payment Processing (3-5 days)"
   - 🔴 "Payment Failed - Action Required"
   - 🟢 "Payment Confirmed"

3. **Automatic Cancellation** - Cron job
   - Cancel bookings after 48 hours if not paid
   - Send final notification emails
   - Release listing availability

4. **Micro-Deposit Verification** - Future enhancement
   - Handle `payment_method.automatically_updated`
   - UI for entering verification amounts
   - Show pending verification status

---

## Error Handling

### Payment Processing Errors
**File**: `src/app/actions/process-payment.ts:297-324`

| Error Type | Stripe Error Code | User Message | Recovery Action |
|------------|------------------|--------------|-----------------|
| Authentication Required | `authentication_required` | "Payment requires additional authentication. Please try again." | User retries with 3D Secure |
| Insufficient Funds | `insufficient_funds` | "Payment failed due to insufficient funds." | User tries different payment method |
| Card Declined | `card_declined` | "Your card was declined. Please try a different card." | User tries different card |
| Invalid Account | `invalid_account` | "Bank account is invalid or closed." | User tries different bank account |
| Generic Failure | (any other) | "Failed to process payment. Please try again." | User retries or contacts support |

### ACH-Specific Errors

| Error Type | When Occurs | User Experience | Recovery |
|------------|-------------|-----------------|----------|
| Account Closed | 1-2 days later | Webhook marks as failed | Needs retry UI (not implemented) |
| Insufficient Funds | 3-5 days later | Webhook marks as failed | Needs retry UI (not implemented) |
| Account Frozen | 1-3 days later | Webhook marks as failed | Needs retry UI (not implemented) |
| Authorization Revoked | Any time | Webhook marks as failed | Needs retry UI (not implemented) |

**Current Gap**: We handle card errors well, but ACH failure recovery is limited.

---

## Webhook Events

> **📚 For comprehensive webhook documentation**, see:
> - [`/docs/webhooks/stripe.md`](./webhooks/stripe.md) - Stripe webhook events
> - [`/docs/webhooks/master.md`](./webhooks/master.md) - All webhook endpoints
>
> These documents cover ALL webhook events (payment + Connect account monitoring), business logic, status flows, and testing details.

### Webhook Endpoint
**File**: `src/app/api/payment-webhook/route.ts`

**URL**: `https://yourdomain.com/api/payment-webhook`
**Method**: POST
**Authentication**: Stripe signature verification (`stripe-signature` header)

### Handled Events

#### `payment_intent.succeeded`
**When**: Payment has successfully completed and funds are available

**For Cards**: Fires immediately (within seconds)
**For ACH**: Fires 3-5 business days after initiation

**Actions**:
1. Update `Match.paymentStatus = 'captured'`
2. Set `Match.paymentCapturedAt` if not already set
3. Create booking if doesn't exist (backup mechanism)
4. Create listing unavailability

**Metadata Used**:
- `matchId` - Which match this payment is for
- `type` - Should be `'security_deposit_direct'`
- `userId` - The renter
- `hostUserId` - The landlord

#### `payment_intent.payment_failed`
**When**: Payment attempt has failed (card declined, ACH returned, etc.)

**For Cards**: Fires immediately if card declined
**For ACH**: Fires 1-5 days later if bank rejects transfer

**Actions**:
1. Update `Match.paymentStatus = 'failed'`
2. Store payment intent ID for reference
3. ⚠️ **No notification sent** (gap in current implementation)
4. ⚠️ **No retry mechanism** (gap in current implementation)

### Webhook Security
```typescript
// Verify webhook signature
const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Environment Variable Required**: `STRIPE_WEBHOOK_SECRET`

---

## Implementation Files

### Core Payment Logic

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/app/actions/process-payment.ts` | Main payment processing server action | `processDirectPayment()` |
| `src/lib/payment-calculations.ts` | Pure calculation functions | `calculateCreditCardFee()`, `calculatePaymentBreakdown()` |
| `src/lib/fee-constants.ts` | Fee structure constants | `FEES`, calculation helpers |

### UI Components

| File | Purpose | Key Features |
|------|---------|--------------|
| `src/app/app/rent/match/[matchId]/lease-signing-client.tsx` | Lease signing orchestration | Step management, payment trigger |
| `src/components/payment-review/PaymentReviewScreen.tsx` | Payment review and confirmation | Method selection, amount display, processing |
| `src/components/payment-review/sections/PaymentMethodsSection.tsx` | Payment method list and selection | Fetch methods, display cards/banks, delete |
| `src/components/stripe/add-payment-method-inline.tsx` | Add new payment method form | Stripe Elements integration |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/user/payment-methods` | GET | Fetch user's saved payment methods |
| `/api/user/payment-methods/[id]` | DELETE | Remove a payment method |
| `/api/matches/[matchId]/confirm-payment-and-book` | POST | Confirm payment and create booking |
| `/api/payment-webhook` | POST | Handle Stripe webhook events |

### Database Schema

**Match Table** (relevant fields):
```prisma
model Match {
  id                    String
  stripePaymentMethodId String?    // Selected payment method ID
  stripePaymentIntentId String?    // Created payment intent ID
  paymentAuthorizedAt   DateTime?  // When payment was initiated
  paymentCapturedAt     DateTime?  // When payment was captured
  paymentAmount         Int?       // Amount in dollars
  paymentStatus         String?    // 'processing', 'captured', 'failed'
  // ... other fields
}
```

---

## Future Improvements

### Priority 1: ACH User Communication
- [ ] Add "3-5 business days" warning when selecting bank account
- [ ] Show expected settlement date on confirmation screen
- [ ] Send email when ACH payment settles
- [ ] Add "Payment Processing" badge to booking details

### Priority 2: ACH Failure Recovery
- [ ] Detect `payment_intent.payment_failed` for ACH
- [ ] Send urgent email to renter with retry link
- [ ] Add retry payment UI (keep same booking, new payment)
- [ ] Notify host of payment issue
- [ ] Implement 48-hour grace period before cancellation

### Priority 3: Micro-Deposit Verification
- [ ] Handle `payment_method.automatically_updated` webhook
- [ ] Add verification UI for entering micro-deposit amounts
- [ ] Show pending verification status
- [ ] Consider Stripe instant verification as alternative

### Priority 4: Better Error Messages
- [ ] Add ACH-specific error messages (account closed, insufficient funds)
- [ ] Show helpful next steps based on error type
- [ ] Distinguish between immediate vs delayed failures
- [ ] Add support chat link for payment issues

### Priority 5: Payment Dashboard
- [ ] Add admin view of all payments and their states
- [ ] Show ACH payments in "processing" state
- [ ] Add manual payment reconciliation tools
- [ ] Export payment reports for accounting

---

## Testing

### Test Scenarios

**Card Payment - Success**:
1. Use test card `4242 4242 4242 4242`
2. Complete lease signing
3. Select card payment method
4. Verify amount includes 3% fee
5. Complete payment
6. Verify booking created immediately
7. Verify webhook fires (use Stripe CLI)

**Card Payment - Decline**:
1. Use test card `4000 0000 0000 0002` (declined)
2. Complete lease signing
3. Attempt payment
4. Verify error message displayed
5. Verify user can retry with different card

**ACH Payment - Success**:
1. Use test bank account
2. Complete lease signing
3. Select bank account
4. Complete payment
5. Verify booking created immediately
6. Verify status is "processing"
7. Verify webhook fires after test delay

**ACH Payment - Failure** (Manual Testing Required):
1. Use test bank account that will fail
2. Complete lease signing
3. Complete payment
4. Wait for webhook (or trigger manually)
5. Verify match status updated to "failed"
6. ⚠️ Verify user notification (currently not implemented)

### Stripe CLI Testing

```bash
# Listen to webhooks locally
stripe listen --forward-to localhost:3000/api/payment-webhook

# Trigger specific events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

---

## FAQ

**Q: Why do we set `paymentCapturedAt` immediately for ACH if it takes 3-5 days?**
A: We need this timestamp to create bookings. The booking is created optimistically, and we handle failures via webhook if the ACH transfer is rejected.

**Q: What happens if an ACH payment fails after the user has moved in?**
A: Currently, we only update the match status to "failed" via webhook. We don't have a recovery flow. This is a known gap that needs to be addressed.

**Q: Why 3% instead of passing through Stripe's 2.9% + $0.30?**
A: Simpler for customers to understand. We use a self-inclusive formula to ensure we still receive the intended amount after fees.

**Q: Can users have both cards and bank accounts saved?**
A: Yes. They can save multiple payment methods and choose which to use for each payment.

**Q: What's the difference between `paymentAuthorizedAt` and `paymentCapturedAt`?**
A: `Authorized` means we created a payment intent. `Captured` means funds were actually charged. For our flow with `capture_method: 'automatic'`, both happen nearly simultaneously for cards. For ACH, we set both immediately even though actual capture takes days.

**Q: Why don't we wait for ACH to settle before creating the booking?**
A: User experience. Waiting 3-5 days would create a poor experience. Instead, we create the booking optimistically and handle failures via webhook + grace period (to be implemented).

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-XX | Initial specification created | Claude |
| TBD | Add ACH failure recovery | TBD |
| TBD | Add micro-deposit verification | TBD |

---

## Questions or Issues?

If you have questions about payment implementation, please:
1. Check this spec first
2. Review the referenced implementation files
3. Ask in #engineering Slack channel
4. Tag @tyler for payment-specific questions

**This document should be updated whenever payment logic changes.**