# Process Rent Payments

**Endpoint:** `/api/cron/process-rent-payments`
**Schedule:** Daily at 1:00 AM Pacific Time (8:00 AM UTC)
**Purpose:** Processes all rent payments due today

## Description

Automatically charges renters and transfers funds to hosts for rent payments due today. This is the core payment processing system for recurring rent payments.

## Business Logic

1. **Find Due Payments**: Identifies rent payments where `dueDate` is today (UTC calendar date)
2. **Payment Processing**: Creates Stripe PaymentIntents with automatic capture
3. **Fund Transfer**: Transfers full amount to host's Stripe Connect account
4. **Record Keeping**: Updates payment status and creates transaction records
5. **Notifications**: Sends email notifications for success/failure
6. **Error Handling**: Implements retry logic (max 3 attempts)

## Fee Structure

- **Service fees** (3% for trips ≤6 months, 1.5% for trips >6 months) are already included in the payment amount
- **Full amount** including service fee is transferred to host
- Stripe processing fees are automatically deducted by Stripe
- Platform revenue comes from the $7 deposit transfer fee collected at booking time

## Payment Flow

```
1. Query RentPayment records where dueDate = today
2. For each payment:
   a. Verify payment method is valid
   b. Create Stripe PaymentIntent
   c. Capture payment from renter
   d. Transfer funds to host's Connect account
   e. Update payment status (isPaid, paymentCapturedAt)
   f. Create transaction record
   g. Send notifications to renter and host
```

## Safety Features

- **Idempotency checks**: Prevent duplicate processing using Stripe idempotency keys
- **Maximum retry attempts**: Automatic retries for transient failures (max 3 attempts)
- **Comprehensive logging**: Full audit trail for debugging and compliance
- **Graceful handling**: Invalid payment methods don't stop processing of other payments

## Retry Logic

- **Retry Count**: Tracked in `retryCount` field on RentPayment
- **Max Retries**: 3 attempts total
- **Retry Schedule**: Daily (will retry on next cron run)
- **Failure Notifications**:
  - First failure: Informational notification to renter and host
  - Second failure: Urgent notification with payment method update request
  - Third failure: Final notification, manual intervention required

## Notifications

### Renter Notifications
- **Payment Success**: Confirmation email with receipt
- **Payment Processing** (ACH only): Notification that ACH payment is being processed
- **Payment Failed**: Action required notification with payment method update link

### Host Notifications
- **Payment Success**: Confirmation email with payout details
- **Payment Failed**: Information about renter's payment failure

## Implementation Details

**File:** `src/app/api/cron/process-rent-payments/route.ts`

### Key Functions
- `findDuePayments()`: Queries for payments due today
- `processPayment()`: Handles individual payment processing
- `createStripePaymentIntent()`: Creates and captures Stripe payment
- `transferToHost()`: Transfers funds to host's Connect account
- `sendPaymentNotifications()`: Sends email/in-app notifications

## Testing

**IMPORTANT**: Never test with real payment methods or production data.

Test this cron job in development:
1. Create test bookings with test payment methods
2. Set `dueDate` to today
3. Navigate to `/app/admin/cron-jobs`
4. Click "Trigger Now" for Process Rent Payments
5. Monitor logs and Stripe dashboard (test mode)

## Manual Trigger

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/process-rent-payments
```

## Monitoring

Monitor payment processing through:
- Application logs (check for errors and retry counts)
- Admin cron jobs interface (execution status and results)
- Stripe dashboard (payment and transfer status)
- Email notifications (preview-rent-payments cron sends daily preview)

## Troubleshooting

### Common Issues

**Payment Failed - Insufficient Funds**
- Notification sent to renter to update payment method
- Will retry next day (up to 3 times)
- After 3 failures, manual intervention required

**Payment Failed - Invalid Payment Method**
- Notification sent to renter to add new payment method
- Payment skipped until valid method added
- Does not count toward retry limit

**Transfer Failed - Host Account Issue**
- Payment captured but transfer pending
- Admin notification sent
- Requires manual review of host's Stripe account

## Related Documentation

- [Payment System Overview](/docs/payment-spec.md)
- [Stripe Integration](/docs/webhooks/stripe.md)
- [Preview Rent Payments Cron](./preview-rent-payments.md)
