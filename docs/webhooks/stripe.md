# Stripe Webhook Events Documentation

This document describes all Stripe webhook events that Matchbook monitors, the business logic that executes for each event, and crucial events we currently don't handle.

> **📚 For a complete list of all webhook endpoints** (not just Stripe), see [`/docs/webhooks/master.md`](./master.md)

## Overview

Matchbook uses a **unified webhook endpoint** to monitor all Stripe events:

**Endpoint**: `/api/webhooks/stripe`

This single endpoint handles:
1. **Payment Events** - Payment lifecycle (processing, succeeded, failed)
2. **Connect Events** - Connected account (host) status and health

### Benefits of Unified Approach
- ✅ **One webhook secret** (`STRIPE_WEBHOOK_SECRET`) instead of two
- ✅ **One Stripe Dashboard configuration** instead of two endpoints
- ✅ **Simplified deployment** and maintenance
- ✅ **Business logic still separated** by concern in handler modules

## Architecture: Destination Charges

Matchbook uses **Destination Charges** for payment processing:
- PaymentIntents are created on the platform account
- Funds are automatically transferred to host accounts via `transfer_data`
- All payment events fire on the **platform account** (not connected accounts)
- Connect webhooks monitor the health of connected accounts separately

---

## 1. Payment Webhook Events

**Endpoint**: `/api/webhooks/stripe/route.ts`
**Handler Module**: `/src/lib/webhooks/stripe-payment-handler.ts`
**Stripe Dashboard**: Developers → Webhooks → Add endpoint (standard webhook)

### Events We Monitor

#### `payment_intent.processing`

**When it fires**: ACH payment has been initiated but not yet settled (3-5 business days)

**Business Logic**:
1. Update Match: `paymentStatus = 'processing'`
2. Update Booking: `status = 'pending_payment'`, `paymentStatus = 'processing'`
3. Host sees booking as "pending" until settlement

**Why this matters**: ACH payments are asynchronous. Unlike credit cards that succeed instantly, ACH takes days to clear. We create the booking immediately but mark it as pending until funds actually settle.

**Example payload**:
```json
{
  "type": "payment_intent.processing",
  "data": {
    "object": {
      "id": "pi_xxx",
      "status": "processing",
      "metadata": {
        "matchId": "cm123",
        "type": "security_deposit_direct"
      }
    }
  }
}
```

---

#### `payment_intent.succeeded`

**When it fires**: Payment has successfully settled (instant for cards, 3-5 days for ACH)

**Business Logic**:
1. Update Match:
   - `paymentStatus = 'captured'`
   - `paymentCapturedAt = now()`
2. Update or Create Booking:
   - `status = 'confirmed'`
   - `paymentStatus = 'settled'`
   - `paymentSettledAt = now()`
3. Create listing unavailability for booked dates (if not exists)
4. Send success email to renter with booking confirmation

**Why this matters**: This is the definitive "money is in the bank" event. For ACH, this might fire days after the initial payment. Only at this point can we guarantee the booking is financially secure.

**Edge cases handled**:
- Booking might not exist if payment action failed → Create it in webhook as backup
- Listing unavailability might already exist → Check first before creating

**Example payload**:
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 23400,
      "status": "succeeded",
      "metadata": {
        "matchId": "cm123",
        "userId": "user_123",
        "hostUserId": "user_456",
        "type": "security_deposit_direct"
      }
    }
  }
}
```

---

#### `payment_intent.payment_failed`

**When it fires**: Payment failed (ACH rejected, card declined, insufficient funds)

**Business Logic**:
1. Extract failure details:
   - `failureCode` (R01, R02, card_declined, etc)
   - `failureMessage` (raw error from Stripe)
2. Update Match:
   - `paymentStatus = 'failed'`
   - Store failure code and message
3. Update Booking:
   - `status = 'payment_failed'`
   - `paymentStatus = 'failed'`
   - Store failure code and message
4. Create in-app notifications for both parties:
   - **Renter**: Links to `/app/rent/booking/[bookingId]/payment-failure`
   - **Host**: Links to `/app/host/booking/[bookingId]/payment-failure`
5. Send failure emails to BOTH parties:
   - **Renter**: Urgent action required, link to payment failure page, 48-hour countdown
   - **Host**: Informational notification with link to monitor status

**Why this matters**: ACH failures can happen days after the initial authorization. The renter thought everything was fine, but their bank rejected it. We need to notify both parties immediately and provide a recovery path.

**Common failure codes**:
- `R01` - Insufficient funds
- `R02` - Account closed
- `R07` - Authorization revoked
- `card_declined` - Card issuer declined
- `insufficient_funds` - Not enough money

**Example payload**:
```json
{
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_xxx",
      "status": "failed",
      "last_payment_error": {
        "code": "R01",
        "message": "Insufficient funds in the bank account."
      },
      "metadata": {
        "matchId": "cm123"
      }
    }
  }
}
```

---

## 2. Connect Webhook Events

**Endpoint**: `/api/webhooks/stripe/route.ts` (same unified endpoint)
**Handler Module**: `/src/lib/webhooks/stripe-connect-handler.ts`
**Stripe Dashboard**: Same endpoint as payment events

These events monitor the health and status of connected accounts (hosts on your platform).

### Events We Monitor

#### `account.updated`

**When it fires**: Any change to a connected account's status, capabilities, or requirements

**Critical fields to check**:
- `charges_enabled` - Can accept payments
- `payouts_enabled` - Can receive payouts
- `requirements.currently_due` - Array of missing verification items
- `requirements.eventually_due` - Items needed in the future
- `requirements.past_due` - Overdue items (account restricted)
- `requirements.disabled_reason` - Why account was disabled

**Business Logic**:
1. Update User record:
   - `stripeAccountStatus` (enabled/restricted/disabled)
   - `stripeChargesEnabled`
   - `stripePayoutsEnabled`
   - `stripeRequirementsDue` (JSON array)
   - `stripeAccountLastUpdated`
2. If `charges_enabled = false`:
   - Prevent new bookings for this host
   - Notify admin dashboard
   - Email host about issue
3. If `requirements.currently_due` not empty:
   - Email host with list of required documents
   - Show banner in host dashboard
4. If `requirements.past_due` exists:
   - Mark host as restricted
   - Pause all active listings
   - Urgent notification

**Why this matters**: Hosts can lose payment acceptance for many reasons:
- Failed identity verification
- Suspicious activity detected
- Missing tax documents
- Invalid bank account
- Compliance issues

If we try to create a PaymentIntent with `transfer_data` to a disabled account, the payment will fail. We must check account health BEFORE accepting renter payments.

**Example payload**:
```json
{
  "type": "account.updated",
  "data": {
    "object": {
      "id": "acct_xxx",
      "charges_enabled": false,
      "payouts_enabled": true,
      "requirements": {
        "currently_due": ["individual.id_number", "individual.verification.document"],
        "past_due": [],
        "disabled_reason": "requirements.past_due"
      }
    }
  }
}
```

---

#### `account.application.deauthorized`

**When it fires**: A host disconnects their Stripe account from your platform

**Business Logic**:
1. Update User:
   - `stripeAccountId = null`
   - `stripeChargesEnabled = false`
   - Mark account as inactive
2. Cancel all pending bookings for this host
3. Pause/unpublish all host's listings
4. Notify admin immediately
5. Email host confirming disconnection

**Why this matters**: This is a critical security event. If a host deauthorizes and we don't catch it, we'll try to create payments that will fail. Worse, we might accept money from renters that we can't transfer.

**Recovery**: Host must reconnect via Stripe Connect onboarding flow.

**Example payload**:
```json
{
  "type": "account.application.deauthorized",
  "data": {
    "object": {
      "id": "acct_xxx"
    }
  }
}
```

---

#### `person.updated`

**When it fires**: Changes to an individual associated with a connected account (identity verification, representative updates)

**Business Logic**:
1. Check `person.verification.status`:
   - `verified` - Identity confirmed
   - `pending` - Awaiting review
   - `unverified` - Failed verification
2. If verification failed:
   - Email host with instructions
   - Update dashboard to show issue
3. If verification succeeded:
   - Update account status
   - May enable previously disabled capabilities

**Why this matters**: Express accounts require identity verification for representatives. If verification fails, the account may lose payment capabilities.

**Example payload**:
```json
{
  "type": "person.updated",
  "data": {
    "object": {
      "id": "person_xxx",
      "account": "acct_xxx",
      "verification": {
        "status": "pending",
        "document": {
          "back": null,
          "front": "file_xxx"
        }
      }
    }
  }
}
```

---

#### `account.external_account.updated`

**When it fires**: Host's bank account or debit card (for payouts) is updated or becomes invalid

**Business Logic**:
1. Check `external_account.status`:
   - `verified` - Bank account is valid
   - `verification_failed` - Invalid routing/account number
   - `errored` - Bank rejected verification
2. If invalid:
   - Email host urgently
   - Funds will accumulate in Stripe but can't be paid out
   - Host dashboard shows payout issue
3. Log for admin review

**Why this matters**: Even if payments succeed, if the host's bank account is invalid, funds get stuck in Stripe. Host won't receive money and will be frustrated. We need to catch this and notify immediately.

**Example payload**:
```json
{
  "type": "account.external_account.updated",
  "data": {
    "object": {
      "id": "ba_xxx",
      "account": "acct_xxx",
      "object": "bank_account",
      "status": "verification_failed",
      "last4": "6789"
    }
  }
}
```

---

## Events We DON'T Handle (Yet)

### Payment Events

#### `payment_intent.created`
**Why skip**: No business logic needed. We create these ourselves, we already know they exist.

#### `payment_intent.canceled`
**Why skip**: We don't implement payment cancellation flow yet. If needed in future for abandoned bookings.

#### `payment_intent.requires_action`
**Why skip**: 3D Secure/SCA authentication is handled client-side by Stripe Elements. If this fires, the client-side flow handles it.

#### `charge.refunded`
**Why skip**: We don't have a refund system yet. Future feature for cancellations/disputes.

#### `charge.dispute.created`
**Why skip**: No dispute handling flow yet. Should add when scaling.

### Connect Events

#### `capability.updated`
**Why skip**: Already covered by `account.updated` which includes capability changes. Redundant for our needs.

#### `payout.paid` / `payout.failed`
**Why skip**: Payouts are between Stripe and the host. We don't need to track individual payouts unless building a detailed financial dashboard for hosts.

#### `transfer.created` / `transfer.paid`
**Why skip**: Transfers happen automatically via `transfer_data`. We don't manually create transfers, so no need to monitor.

#### `balance.available`
**Why skip**: Platform balance tracking not critical for MVP. Add if building financial reporting.

---

## Status Flow Diagrams

### ACH Payment Flow

```
Renter submits ACH payment
         ↓
payment_intent.processing (webhook)
         ↓
Booking: status = "pending_payment"
Match: paymentStatus = "processing"
         ↓
    [3-5 days]
         ↓
    ┌─────────┴─────────┐
    ↓                   ↓
SUCCESS             FAILURE
    ↓                   ↓
payment_intent     payment_intent
  .succeeded        .payment_failed
    ↓                   ↓
Booking:            Booking:
confirmed           payment_failed
    ↓                   ↓
Send success        Send failure emails
email               Start 48h timer
```

### Card Payment Flow

```
Renter submits card payment
         ↓
Instant authorization
         ↓
payment_intent.succeeded (webhook)
         ↓
Booking: status = "confirmed"
Match: paymentStatus = "captured"
         ↓
Send success email
```

### Host Account Status Flow

```
Host connects Stripe account
         ↓
account.updated (webhook)
charges_enabled = true
         ↓
Host can accept bookings
         ↓
    ┌─────────┴─────────┐
    ↓                   ↓
REQUIREMENTS        DEAUTHORIZED
DUE                     ↓
    ↓               account.application
requirements            .deauthorized
.currently_due          ↓
not empty           Cancel bookings
    ↓               Pause listings
Email host          Mark inactive
with required
documents
    ↓
If not resolved
in time:
    ↓
charges_enabled
= false
    ↓
Pause bookings
```

---

## Implementation Files

### Webhook Handlers
- `/src/app/api/webhooks/stripe/route.ts` - Unified webhook endpoint
- `/src/lib/webhooks/stripe-payment-handler.ts` - Payment event handlers
- `/src/lib/webhooks/stripe-connect-handler.ts` - Connect event handlers

### Email Notifications
- `/src/lib/emails.ts`:
  - `sendPaymentSuccessEmail()`
  - `sendPaymentFailureEmails()`
  - `getHumanReadableFailureReason()`

### Payment Processing
- `/src/app/actions/process-payment.ts` - Creates PaymentIntents with host validation

### Database Schema
- `prisma/schema.model` - Booking, Match, User models with payment tracking fields

### Documentation
- `/docs/payment-spec.md` - Complete payment specification
- `/docs/stripe-webhooks.md` - This file

---

## Testing Webhooks

### Local Testing with Stripe CLI

```bash
# Listen for ALL Stripe webhooks (unified endpoint)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger account.updated
```

### Test Cards

```
# Successful card
4242 4242 4242 4242

# Declined card
4000 0000 0000 0002

# Requires authentication (3D Secure)
4000 0025 0000 3155

# Insufficient funds
4000 0000 0000 9995
```

### Test ACH

ACH must be tested in Test mode with real Stripe test account numbers:
```
# Use Stripe's test bank account numbers
# Account number: 000123456789
# Routing number: 110000000
```

---

## Security

### Webhook Signature Verification

All webhook handlers MUST verify Stripe signatures:

```typescript
const signature = req.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Why**: Without verification, anyone could send fake webhook events to your endpoint and manipulate booking status.

### Idempotency

All webhook handlers MUST be idempotent (safe to process multiple times):
- Use `event.id` to track processed events (future enhancement)
- Database operations should be upserts where possible
- Check current status before transitions

**Why**: Stripe may send the same event multiple times if your server doesn't respond quickly enough.

---

## Monitoring & Alerts

### Webhook Failures

In Stripe Dashboard, monitor:
- Failed webhook deliveries (Developers → Webhooks → View logs)
- Response times (should be < 5 seconds)
- Error rates

### Business Logic Alerts

Set up alerts for:
- Multiple payment failures in short time
- Host accounts becoming disabled
- High rate of `account.application.deauthorized` events
- Bookings stuck in `pending_payment` > 7 days

---

## Future Enhancements

1. **Event Deduplication**: Track processed `event.id` in database
2. **Retry Queue**: Failed webhook processing → retry queue
3. **Admin Dashboard**: Real-time webhook event viewer
4. **Automatic Booking Cancellation**: Cron job to cancel bookings after 48 hours
5. **Dispute Handling**: Monitor and respond to `charge.dispute.*` events
6. **Refund System**: Handle `charge.refunded` for cancellations
7. **Financial Reporting**: Track `payout.*` and `balance.*` for host dashboards
8. **Account Health Score**: Proactive monitoring of host account status
