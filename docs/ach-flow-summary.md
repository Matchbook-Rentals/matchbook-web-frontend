# ACH Payment Flow: Happy Path vs Sad Path

Quick reference guide for how ACH payments work in the Matchbook platform.

---

## 🟢 Happy Path: ACH Payment Success

### Timeline: 3-5 Business Days

```
DAY 0 (T+0) - Renter Submits Payment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Renter enters bank account details
✓ Clicks "Pay Now" button
✓ Stripe immediately authorizes payment
✓ PaymentIntent status: "processing"

Database Updates:
  Match.paymentStatus = 'processing'
  Match.paymentAuthorizedAt = NOW
  Booking created with status = 'pending_payment'
  Booking.paymentStatus = 'processing'

User Experience:
  Renter sees: "Payment processing (3-5 business days)"
  Host sees: "Booking pending payment settlement"

Webhook Fired: payment_intent.processing
  → Updates confirmed in database
  → No emails sent yet


DAYS 1-4 (T+1 to T+4) - Bank Processing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ ACH transfer in progress
⏳ Funds moving between banks
⏳ No action from Matchbook

User Experience:
  Renter: Still shows "processing"
  Host: Still shows "pending"


DAY 3-5 (T+3 to T+5) - Payment Clears! ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Bank confirms funds available
✅ Stripe settles the payment

Webhook Fired: payment_intent.succeeded

Database Updates:
  Match.paymentStatus = 'captured'
  Match.paymentCapturedAt = NOW
  Booking.status = 'confirmed'
  Booking.paymentStatus = 'settled'
  Booking.paymentSettledAt = NOW

  ListingUnavailability created:
    → Blocks calendar dates
    → Prevents double-booking

Email Sent to Renter:
  Subject: "✅ Payment Confirmed - Your Booking is Complete"
  Content:
    - Payment of $234.02 cleared
    - Booking ID and property details
    - Move-in instructions coming soon

User Experience:
  Renter: "✅ Booking Confirmed"
  Host: "✅ Payment Settled - Booking Confirmed"

Money Transfer:
  Platform receives: $234.02
  Platform keeps: $7.00 (transfer fee)
  Host receives: $227.02 (deposits)
```

### Final State (Happy Path)

```typescript
Match {
  paymentStatus: 'captured',
  paymentAuthorizedAt: '2025-01-15T10:00:00Z',
  paymentCapturedAt: '2025-01-18T14:23:11Z',
  stripePaymentIntentId: 'pi_xxx'
}

Booking {
  status: 'confirmed',
  paymentStatus: 'settled',
  paymentSettledAt: '2025-01-18T14:23:11Z'
}

ListingUnavailability {
  startDate: '2025-02-01',
  endDate: '2025-08-01',
  reason: 'Booking'
}
```

---

## 🔴 Sad Path: ACH Payment Failure

### Timeline: 3-5 Business Days (Same timing, different outcome)

```
DAY 0 (T+0) - Renter Submits Payment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Same as happy path - everything looks good!

✓ PaymentIntent status: "processing"
✓ Booking: status = 'pending_payment'
✓ Renter thinks everything is fine
✓ Host sees pending booking


DAYS 1-4 (T+1 to T+4) - Bank Processing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ Still processing...
⏳ Renter and host both waiting


DAY 3-5 (T+3 to T+5) - Payment Fails! ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Bank rejects the payment
❌ Common reasons:
   • R01: Insufficient funds
   • R02: Account closed
   • R07: Authorization revoked

Webhook Fired: payment_intent.payment_failed

Database Updates:
  Match.paymentStatus = 'failed'
  Match.paymentFailureCode = 'R01'
  Match.paymentFailureMessage = 'Insufficient funds in the bank account.'

  Booking.status = 'payment_failed'
  Booking.paymentStatus = 'failed'
  Booking.paymentFailureCode = 'R01'
  Booking.paymentFailureMessage = 'Insufficient funds in the bank account.'

In-App Notifications Created:

  Notification for Renter:
    Type: 'payment_failed'
    Priority: 'urgent'
    Title: '⚠️ Payment Failed - Action Required'
    Message: 'Your payment could not be processed. You have 48 hours to retry.'
    Link: '/app/rent/booking/[bookingId]/payment-failure'

  Notification for Host:
    Type: 'payment_failed_host'
    Priority: 'high'
    Title: 'Booking Payment Issue'
    Message: 'Payment failed. Renter has been notified and has 48 hours to resolve.'
    Link: '/app/host/booking/[bookingId]/payment-failure'

Emails Sent:

  Email to Renter:
    Subject: "⚠️ Payment Failed - Action Required"
    Content:
      - Payment of $234.02 could not be processed
      - Reason: Insufficient funds in bank account
      - You have 48 HOURS to resolve
      - [View Payment Issue & Take Action] button
        → Links to /app/rent/booking/[bookingId]/payment-failure

  Email to Host:
    Subject: "Booking Payment Issue - Renter Notified"
    Content:
      - Payment for booking failed
      - Renter: John Doe
      - Amount: $234.02
      - Reason: Insufficient funds
      - Renter has 48 hours to resolve
      - We'll keep you updated
      - [View Booking Status] button
        → Links to /app/host/booking/[bookingId]/payment-failure
```

### Renter Payment Failure Page

**URL**: `/app/rent/booking/[bookingId]/payment-failure`

```
┌─────────────────────────────────────────────┐
│ ⚠️ Payment Failed                           │
│ Your ACH payment could not be processed.    │
│ Reason: Insufficient funds in bank account  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⏰ Time Remaining                            │
│                                             │
│   42h 15m 33s                               │
│                                             │
│   Time remaining to resolve payment issue   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ What Happened?                              │
│                                             │
│ Failure Reason: Insufficient funds          │
│ Original Method: ACH - Bank ending in 6789  │
│ Amount: $234.02                             │
│ Booking ID: bk_123                          │
└─────────────────────────────────────────────┘

Actions:

  ┌─────────────────────────────────────┐
  │ 🔄 Retry Payment with Different     │
  │    Method                           │
  └─────────────────────────────────────┘
  ↓ Redirects to retry payment page
  ↓ Can use credit card for instant success

  ┌─────────────────────────────────────┐
  │ 💬 Message Host                     │
  └─────────────────────────────────────┘
  ↓ Opens messaging system

  ┌─────────────────────────────────────┐
  │ ❌ Cancel Booking                   │
  └─────────────────────────────────────┘
  ↓ Shows confirmation dialog:

    "Are you sure you want to cancel?"

    Consequences:
    • You will lose this property
    • Dates become available to others
    • Match marked as cancelled
    • Cannot be undone

    [Keep Booking]  [Yes, Cancel]
```

### Host Payment Failure Page

**URL**: `/app/host/booking/[bookingId]/payment-failure`

```
┌─────────────────────────────────────────────┐
│ ⚠️ Booking Payment Failed                   │
│ The renter's ACH payment could not be       │
│ processed. They have been notified and have │
│ 48 hours to resolve.                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⏰ Time Remaining for Renter                │
│                                             │
│   42h 15m 33s                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Booking Details                             │
│                                             │
│ Renter: John Doe                            │
│ Property: 123 Main St, Austin, TX           │
│ Dates: Feb 1 - Aug 1, 2025                  │
│ Amount: $234.02                             │
│ Failure Reason: Insufficient funds          │
│ Status: Waiting for renter action           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ What Happens Next?                          │
│                                             │
│ ✉️ Renter has been notified via email       │
│ ⏰ They have 48 hours to retry payment       │
│ 💳 If they retry, booking will be confirmed  │
│ ❌ If time expires, you can cancel           │
│ 💬 You can message them to discuss           │
└─────────────────────────────────────────────┘

Actions:

  ┌─────────────────────────────────────┐
  │ 💬 Message Renter                   │
  └─────────────────────────────────────┘

  (If 48 hours expired OR host wants to cancel early)

  ┌─────────────────────────────────────┐
  │ ❌ Cancel Booking & Unapprove       │
  └─────────────────────────────────────┘
  ↓ Shows confirmation dialog:

    "Cancel Booking & Unapprove?"

    [If time NOT expired:]
    ⚠️ The renter still has time to resolve.
    Are you sure you want to cancel now?

    This will:
    • Cancel the booking immediately
    • Mark your approval as withdrawn
    • Make dates available for other renters
    • Notify the renter

    Consider messaging first.

    [Keep Booking]  [Yes, Cancel]
```

---

## Recovery Scenarios

### Scenario 1: Renter Retries with Card (IMMEDIATE SUCCESS)

```
Renter clicks "Retry Payment" button
  ↓
Redirected to: /app/rent/match/[matchId]/retry-payment
  ↓
Renter selects credit card payment method
  ↓
Clicks "Retry Payment"
  ↓
processDirectPayment() called with card
  ↓
Stripe processes card payment
  ↓
PaymentIntent.status = 'succeeded' (INSTANT!)
  ↓
Booking.status = 'confirmed' (INSTANT!)
  ↓
Success email sent to renter
  ↓
Host notified of successful payment
  ↓
✅ CRISIS AVERTED - Booking confirmed
```

### Scenario 2: Renter Cancels

```
Renter clicks "Cancel Booking" button
  ↓
Confirmation dialog appears
  ↓
Renter confirms cancellation
  ↓
cancelBookingAsRenter() server action called
  ↓
Database Updates:
  Booking.status = 'cancelled'
  Booking.cancelledAt = NOW
  Booking.cancelledBy = 'renter'
  Match.status = 'cancelled'
  ListingUnavailability deleted (dates released)
  ↓
Email sent to host:
  "Renter John Doe cancelled booking bk_123
   due to payment failure"
  ↓
Host dashboard updated: Dates available again
```

### Scenario 3: Host Cancels After 48 Hours

```
48 hours elapse with no renter action
  ↓
Countdown timer shows "Time Expired"
  ↓
Host visits /app/host/booking/[bookingId]/payment-failure
  ↓
"Cancel Booking & Unapprove" button enabled
  ↓
Host clicks button
  ↓
Confirmation dialog appears
  ↓
Host confirms cancellation
  ↓
cancelBookingAsHost() server action called
  ↓
Database Updates:
  Booking.status = 'cancelled'
  Booking.cancelledAt = NOW
  Booking.cancelledBy = 'host'
  Match.status = 'unapproved'
  Match.approvedByHost = false
  ListingUnavailability deleted
  ↓
Email sent to renter:
  "Host has cancelled booking bk_123
   because payment could not be resolved"
  ↓
Both parties notified, dates released
```

### Scenario 4: Host Cancels Early (Impatient)

```
Host doesn't want to wait 48 hours
  ↓
Visits /app/host/booking/[bookingId]/payment-failure
  ↓
Clicks "I don't want to wait" link
  ↓
"Cancel Booking & Unapprove" button appears
  ↓
⚠️ Warning dialog shows:
  "Renter still has 35 hours remaining.
   Are you sure you want to cancel now?
   Consider messaging them first."
  ↓
Host confirms anyway
  ↓
Same cancellation flow as Scenario 3
```

---

## Key Differences: ACH vs Card

| Aspect | ACH (Bank) | Card (Credit/Debit) |
|--------|-----------|---------------------|
| **Authorization** | Instant | Instant |
| **Settlement** | 3-5 days | Instant |
| **Initial Status** | `processing` | `succeeded` |
| **Booking Status** | `pending_payment` | `confirmed` |
| **Failure Window** | Days later | Immediate |
| **Recovery Needed?** | Yes (48h window) | No (fails upfront) |
| **Risk to Platform** | High (delayed failure) | Low (instant feedback) |

---

## Status Transitions

### Match.paymentStatus

```
authorized → processing → captured   (Happy path)
                       ↘ failed      (Sad path)
```

### Booking.status

```
reserved → pending_payment → confirmed   (Happy path)
                          ↘ payment_failed → cancelled   (Sad path)
```

### Booking.paymentStatus

```
pending → processing → settled   (Happy path)
                    ↘ failed     (Sad path)
```

---

## Related Documentation

- **Complete webhook events**: `/docs/webhooks/stripe.md`
- **All webhook endpoints**: `/docs/webhooks/master.md`
- **Payment specification**: `/docs/payment-spec.md`
- **Failure page implementation**: `/docs/ach-payment-failure-pages.md`
- **Retry payment UI**: `/src/app/app/rent/match/[matchId]/retry-payment/README.md`

---

## Implementation Files

| File | Purpose |
|------|---------|
| `process-payment.ts` | Creates PaymentIntent, determines initial status |
| `payment-webhook/route.ts` | Handles success/failure webhooks |
| `emails.ts` | Sends failure notifications to both parties |
| `cancel-booking.ts` | Server actions for cancellation |
| `CountdownTimer.tsx` | Shows 48-hour countdown |
| `/app/rent/booking/[bookingId]/payment-failure/` | Renter failure page |
| `/app/host/booking/[bookingId]/payment-failure/` | Host failure page |
