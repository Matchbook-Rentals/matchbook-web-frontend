# Move-In Confirmation Flow

**Last Updated**: 2025-01-XX
**Status**: Active

---

## Table of Contents

1. [Overview](#overview)
2. [User Experience Flow](#user-experience-flow)
3. [Payment Status Transitions](#payment-status-transitions)
4. [Database Schema](#database-schema)
5. [Implementation Details](#implementation-details)
6. [Testing](#testing)
7. [Admin Tools](#admin-tools)
8. [Troubleshooting](#troubleshooting)
9. [Related Documentation](#related-documentation)

---

## Overview

The move-in confirmation flow handles the critical transition from booking to active rental. When renters arrive at their new home, they confirm whether the move-in was successful. This confirmation triggers immediate processing of their first month's rent payment.

### Why Move-In Confirmation?

1. **Ensures actual move-in** - Verifies renter actually took possession
2. **Protects renters** - Allows reporting issues before first payment
3. **Triggers first payment** - Processes first rent payment immediately
4. **Releases remaining payments** - Transitions future payments from hold to scheduled

### Key Features

- Two-path flow: Successful move-in or report issues
- Immediate first payment processing (bypasses cron schedule)
- Admin dev testing tools for QA
- Comprehensive debug logging
- Defense-in-depth security (role checks at multiple levels)

---

## User Experience Flow

### Timeline

```
Booking Created (T-30 days):
  ├─ Booking created with status: 'confirmed'
  ├─ Rent payments created with status: 'PENDING_MOVE_IN'
  └─ All payments on hold until move-in

T-3 Days (9:00 AM PT):
  ├─ Move-in reminder sent to renter
  ├─ Move-in reminder sent to host
  └─ Email includes link to move-in instructions

Move-In Day (T-0):
  5:00 AM PT:
    ├─ Automated confirmation prompt sent to renter ← NEW
    ├─ Email + in-app notification
    └─ Link to /app/rent/bookings/[bookingId]/move-in

  During Day:
    ├─ Renter arrives at property
    └─ Renter may visit move-in page to respond

  6:00 PM PT:
    ├─ Reminder sent if no response yet ← NEW
    ├─ Email mentions auto-confirm tomorrow
    └─ Final chance to respond before auto-confirm

Move-In Confirmation (Manual):
  ├─ Path A: Confirm Successful Move-In
  │   ├─ First payment processed immediately
  │   ├─ Remaining payments moved to PENDING
  │   ├─ Booking.moveInStatus = 'confirmed'
  │   └─ Redirect to booking details
  │
  └─ Path B: Report Move-In Issue
      ├─ All payments held (FAILED_MOVE_IN)
      ├─ Booking.moveInStatus = 'issue_reported'
      ├─ Issue notes captured
      ├─ Host notified immediately ← NEW
      └─ Support team intervention required

Day After Move-In (T+1, 3:00 AM PT): ← NEW
  If No Response:
    ├─ System auto-confirms move-in
    ├─ First payment processed automatically
    ├─ Remaining payments moved to PENDING
    ├─ Booking.moveInAutoConfirmedAt set
    └─ No notification sent to renter or host
```

**See**: [Move-In Confirmation System](./notifications/move-in-confirmation-system.md) for complete automated flow details.

### Page Sections

#### Before Confirmation

**URL**: `/app/rent/bookings/[bookingId]/move-in`

**Content**:
- Welcome message with listing details
- Move-in date display
- Explanation of payment processing
- Two prominent action buttons:
  - ✅ "Yes, I've Successfully Moved In"
  - ⚠️ "I'm Having Issues with Move-In"
- Support contact information

**File**: `src/app/app/rent/bookings/[bookingId]/move-in/move-in-client.tsx:300-400`

#### After Confirmation

**URL**: Same page, updated view

**Content**:
- Confirmation icon (green check or red alert)
- Status message
- Timestamp of confirmation
- Link to booking details
- (If issue reported) Issue notes display

**Admin Dev Only Section** (visible to admin_dev users only):
- Warning about testing-only usage
- Reset button with confirmation dialog
- Details about what will be reset

---

## Automated Move-In Confirmation Prompts

⚠️ **Status**: **NOT YET IMPLEMENTED** - This section describes planned functionality.

The platform will automatically prompt renters to confirm their move-in through a three-step notification system. This ensures payment processing happens promptly while giving renters multiple opportunities to report issues.

### Notification Schedule

| Time | Action | Condition | Purpose |
|------|--------|-----------|---------|
| 5:00 AM PT (Move-In Day) | Send initial prompt | `moveInStatus = 'pending'` | First request for confirmation |
| 6:00 PM PT (Move-In Day) | Send reminder | Still `pending` | Urgent reminder before auto-confirm |
| 3:00 AM PT (Next Day) | Auto-confirm | Still `pending` | Assume success, process payment |

### Response Window

Renters have **~22 hours** to respond:
- From 5:00 AM (initial prompt)
- Through 6:00 PM (reminder)
- Until 3:00 AM next day (auto-confirm)

### Automated Cron Jobs

Three cron jobs manage this flow:

1. **send-move-in-confirmation-prompt** - [Documentation](./cron/send-move-in-confirmation-prompt.md)
   - Sends initial prompt at 5 AM
   - Sets `moveInPromptSentAt` timestamp
   - Notification type: `move_in_confirmation_prompt`

2. **send-move-in-reminder** - [Documentation](./cron/send-move-in-reminder.md)
   - Sends reminder at 6 PM if no response
   - Sets `moveInReminderSentAt` timestamp
   - Notification type: `move_in_confirmation_reminder`

3. **auto-confirm-move-ins** - [Documentation](./cron/auto-confirm-move-ins.md)
   - Auto-confirms at 3 AM if still no response
   - Calls `confirmMoveIn()` action automatically
   - Sets `moveInAutoConfirmedAt` timestamp
   - No notification sent

### Database Fields for Tracking

```prisma
model Booking {
  moveInPromptSentAt       DateTime?  // 5 AM prompt timestamp
  moveInReminderSentAt     DateTime?  // 6 PM reminder timestamp
  moveInAutoConfirmedAt    DateTime?  // 3 AM auto-confirm timestamp
}
```

### Analytics

Track these metrics:
- **Response rate**: % who manually confirm vs auto-confirm
- **Time-to-response**: How quickly renters respond
- **Issue rate**: % who report problems

See [Move-In Confirmation System](./notifications/move-in-confirmation-system.md) for complete implementation details.

---

## Payment Status Transitions

### Rent Payment Statuses

```
Initial State (Before Move-In):
  RentPayment.status = 'PENDING_MOVE_IN'
  RentPayment.isPaid = false

After Successful Move-In:
  First Payment:
    ├─ If card payment:
    │   ├─ RentPayment.status = 'SUCCEEDED'
    │   ├─ RentPayment.isPaid = true
    │   ├─ RentPayment.paymentCapturedAt = NOW
    │   └─ PaymentTransaction created
    │
    └─ If ACH payment:
        ├─ RentPayment.status = 'PROCESSING'
        ├─ RentPayment.isPaid = false (still pending)
        ├─ RentPayment.paymentAuthorizedAt = NOW
        └─ PaymentTransaction created (pending)

  Remaining Payments:
    └─ RentPayment.status = 'PENDING' (ready for cron processing)

After Issue Reported:
  All Payments:
    └─ RentPayment.status = 'FAILED_MOVE_IN' (on hold)
```

### Booking Move-In Status

```
Initial:
  Booking.moveInStatus = 'pending'
  Booking.moveInCompletedAt = null
  Booking.moveInConfirmedAt = null

Successful Move-In:
  Booking.moveInStatus = 'confirmed'
  Booking.moveInCompletedAt = NOW
  Booking.moveInConfirmedAt = NOW

Issue Reported:
  Booking.moveInStatus = 'issue_reported'
  Booking.moveInIssueReportedAt = NOW
  Booking.moveInIssueNotes = "[user's explanation]"
```

---

## Database Schema

### Booking Fields

```prisma
model Booking {
  // Move-in tracking
  moveInStatus           String?    // 'pending', 'confirmed', 'issue_reported'
  moveInCompletedAt      DateTime?  // When renter confirmed move-in
  moveInConfirmedAt      DateTime?  // Same as moveInCompletedAt (for confirmed status)
  moveInIssueReportedAt  DateTime?  // When issue was reported
  moveInIssueNotes       String?    // Renter's description of issue

  // Relations
  rentPayments RentPayment[]
}
```

### RentPayment Fields

```prisma
model RentPayment {
  id                      String
  bookingId               String
  type                    RentPaymentType  // 'MONTHLY_RENT', 'SECURITY_DEPOSIT', etc.
  status                  RentPaymentStatus
  amount                  Int              // Base rent amount
  totalAmount             Int?             // Including service fee
  isPaid                  Boolean          @default(false)
  dueDate                 DateTime

  // Stripe references
  stripePaymentMethodId   String?
  stripePaymentIntentId   String?

  // Timestamps
  paymentAuthorizedAt     DateTime?
  paymentCapturedAt       DateTime?
  cancelledAt             DateTime?

  // Failure tracking
  failureReason           String?
  retryCount              Int              @default(0)
  lastRetryAttempt        DateTime?

  // Relations
  booking   Booking @relation(fields: [bookingId], references: [id])
  charges   Charge[]
}

enum RentPaymentStatus {
  PENDING_MOVE_IN
  FAILED_MOVE_IN
  PENDING
  PROCESSING
  AUTHORIZED
  SUCCEEDED
  FAILED
  CANCELLED
  REFUNDED
}
```

---

## Implementation Details

### Server Component

**File**: `src/app/app/rent/bookings/[bookingId]/move-in/page.tsx`

**Responsibilities**:
1. Authenticate user
2. Fetch booking with payment and listing data
3. Check admin_dev role for testing tools
4. Determine if user already responded
5. Pass data to client component

**Key Query**:
```typescript
const booking = await prisma.booking.findUnique({
  where: { id: params.bookingId },
  include: {
    listing: true,
    rentPayments: {
      where: {
        type: 'MONTHLY_RENT',
        status: 'PENDING_MOVE_IN',
      },
      select: {
        id: true,
        status: true,
        dueDate: true,
      },
    },
  },
});
```

**Access Control**:
```typescript
// Must be the renter
if (!booking || booking.userId !== userId) {
  redirect('/app/rent/bookings');
}
```

### Server Actions

**File**: `src/app/app/rent/bookings/[bookingId]/move-in/_actions.ts`

#### 1. confirmMoveIn()

**Purpose**: Process successful move-in confirmation

**Steps**:
1. Verify authentication
2. Verify booking ownership
3. Check if already confirmed (prevent double-processing)
4. Find all unpaid monthly rent payments
5. Identify first payment (earliest dueDate)
6. Process first payment immediately via `processRentPaymentNow()`
7. Update remaining payments to PENDING status
8. Update booking move-in status
9. Return success message

**Key Code**:
```typescript
// Find all unpaid payments (regardless of current status)
const bookingDetails = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: {
    rentPayments: {
      where: {
        type: 'MONTHLY_RENT',
        isPaid: false,
        cancelledAt: null,
      },
      orderBy: {
        dueDate: 'asc',
      },
    },
  },
});

// Get first payment
const firstPayment = bookingDetails.rentPayments[0];

// Process immediately
if (firstPayment) {
  const firstPaymentResult = await processRentPaymentNow(firstPayment.id);
}

// Get remaining payment IDs
const remainingPaymentIds = bookingDetails.rentPayments
  .filter((p) => p.id !== firstPayment?.id)
  .map((p) => p.id);

// Update in transaction
await prisma.$transaction([
  // Mark booking as moved in
  prisma.booking.update({
    where: { id: bookingId },
    data: {
      moveInCompletedAt: new Date(),
      moveInStatus: 'confirmed',
      moveInConfirmedAt: new Date(),
    },
  }),
  // Transition remaining payments to PENDING
  ...(remainingPaymentIds.length > 0
    ? [
        prisma.rentPayment.updateMany({
          where: {
            id: { in: remainingPaymentIds },
          },
          data: {
            status: 'PENDING',
          },
        }),
      ]
    : []),
]);
```

**Debug Logging**:
```typescript
console.log('[MOVE-IN CONFIRM] Booking details:', {
  bookingId,
  startDate: bookingDetails.startDate,
  totalPaymentsFound: bookingDetails.rentPayments.length,
});

console.log('[MOVE-IN CONFIRM] All unpaid monthly rent payments:',
  bookingDetails.rentPayments.map(p => ({
    id: p.id,
    dueDate: p.dueDate,
    status: p.status,
    isPaid: p.isPaid,
    amount: p.amount,
  }))
);
```

#### 2. reportMoveInIssue()

**Purpose**: Handle move-in problems reported by renter

**Steps**:
1. Verify authentication
2. Verify booking ownership
3. Check if already confirmed (prevent reporting after confirmation)
4. Update booking status to 'issue_reported'
5. Mark all PENDING_MOVE_IN payments as FAILED_MOVE_IN
6. Store issue notes
7. Return success message

**Key Code**:
```typescript
await prisma.$transaction([
  // Mark booking as having move-in issue
  prisma.booking.update({
    where: { id: bookingId },
    data: {
      moveInStatus: 'issue_reported',
      moveInIssueReportedAt: new Date(),
      moveInIssueNotes: reason || 'Issue reported without specific details',
    },
  }),
  // Mark all PENDING_MOVE_IN payments as FAILED_MOVE_IN
  prisma.rentPayment.updateMany({
    where: {
      bookingId,
      status: 'PENDING_MOVE_IN',
    },
    data: {
      status: 'FAILED_MOVE_IN',
    },
  }),
]);
```

#### 3. resetMoveInStatus() (Admin Dev Only)

**Purpose**: Reset move-in status for testing

**Security**:
```typescript
const { userId } = auth();
if (!userId) {
  return { success: false, error: 'Unauthorized' };
}

// Check admin_dev role (defense in depth)
const isAdminDev = await checkRole('admin_dev');
if (!isAdminDev) {
  return { success: false, error: 'Admin dev access required' };
}
```

**Reset Actions**:
```typescript
await prisma.$transaction([
  // Reset all move-in tracking fields
  prisma.booking.update({
    where: { id: bookingId },
    data: {
      moveInCompletedAt: null,
      moveInStatus: 'pending',
      moveInConfirmedAt: null,
      moveInIssueReportedAt: null,
      moveInIssueNotes: null,
    },
  }),
  // Reset all monthly rent payments to PENDING_MOVE_IN
  prisma.rentPayment.updateMany({
    where: {
      bookingId,
      type: 'MONTHLY_RENT',
    },
    data: {
      status: 'PENDING_MOVE_IN',
      isPaid: false,
      paymentAuthorizedAt: null,
      paymentCapturedAt: null,
      stripePaymentIntentId: null,
    },
  }),
]);
```

### Payment Processing

**File**: `src/lib/payment-processing.ts`

**Function**: `processRentPaymentNow(paymentId: string)`

**Purpose**: Process a rent payment immediately (bypassing cron schedule)

**Detailed Flow**:

1. **Fetch Payment Data**:
```typescript
const payment = await prisma.rentPayment.findUnique({
  where: { id: paymentId },
  include: {
    booking: {
      include: {
        user: {  // Renter
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            stripeCustomerId: true,
          },
        },
        listing: {
          include: {
            user: {  // Host
              select: {
                id: true,
                stripeAccountId: true,
                stripeChargesEnabled: true,
              },
            },
          },
        },
      },
    },
    charges: true,
  },
});
```

2. **Verify Host Can Receive Payments**:
```typescript
if (!host.stripeAccountId || !host.stripeChargesEnabled) {
  throw new Error('Host Stripe account not properly configured');
}
```

3. **Calculate Platform Fee**:
```typescript
// Read from charges table (new system)
const platformFeeCharge = payment.charges.find(
  (c: any) => c.category === 'PLATFORM_FEE' && c.isApplied
);

if (platformFeeCharge) {
  platformFeeAmount = Number(platformFeeCharge.amount);
  platformFeeRate = Number(platformFeeCharge.metadata.rate) / 100;
}

// Fallback to legacy calculation
if (platformFeeAmount === 0) {
  const durationInMonths = calculateDuration(booking);
  platformFeeRate = durationInMonths >= 6 ? 0.015 : 0.03;
  platformFeeAmount = Math.round(totalAmount * platformFeeRate);
}
```

4. **Create Stripe PaymentIntent**:
```typescript
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: totalAmount,
    currency: 'usd',
    customer: renter.stripeCustomerId,
    payment_method: payment.stripePaymentMethodId,
    payment_method_types: isCard ? ['card'] : isACH ? ['us_bank_account'] : ['card', 'us_bank_account'],
    capture_method: 'automatic',
    confirm: true,  // Immediately attempt charge
    application_fee_amount: platformFeeAmount,
    transfer_data: {
      destination: host.stripeAccountId,
    },
    metadata: {
      rentPaymentId: payment.id,
      bookingId: payment.bookingId,
      type: 'monthly_rent',
      // ... more metadata
    },
    receipt_email: renter.email,
  },
  {
    idempotencyKey: `rent-payment-${payment.id}-movein-${Date.now()}`,
  }
);
```

5. **Handle Payment Outcome**:
```typescript
if (paymentIntent.status === 'succeeded') {
  // Card payment succeeded
  await prisma.$transaction([
    prisma.rentPayment.update({
      where: { id: payment.id },
      data: {
        isPaid: true,
        status: 'SUCCEEDED',
        paymentCapturedAt: new Date(),
        stripePaymentIntentId: paymentIntent.id,
      },
    }),
    prisma.paymentTransaction.create({
      data: {
        transactionNumber: `RENT-${payment.id}-${Date.now()}`,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        status: 'succeeded',
        // ... more fields
      },
    }),
  ]);

  return { success: true, status: 'succeeded' };

} else if (paymentIntent.status === 'processing') {
  // ACH payment processing
  await prisma.$transaction([
    prisma.rentPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PROCESSING',
        paymentAuthorizedAt: new Date(),
        stripePaymentIntentId: paymentIntent.id,
      },
    }),
    prisma.paymentTransaction.create({
      data: {
        status: 'pending',
        // ... more fields
      },
    }),
  ]);

  return { success: true, status: 'processing' };
}
```

6. **Error Handling**:
```typescript
catch (error) {
  let errorMessage = 'Payment processing failed';
  if (error instanceof Error) {
    if (error.message.includes('insufficient_funds')) {
      errorMessage = 'Insufficient funds';
    } else if (error.message.includes('card_declined')) {
      errorMessage = 'Card declined';
    } // ... more specific errors
  }

  await prisma.rentPayment.update({
    where: { id: paymentId },
    data: {
      status: 'FAILED',
      failureReason: errorMessage,
      retryCount: { increment: 1 },
      lastRetryAttempt: new Date(),
    },
  });

  return { success: false, status: 'failed', error: errorMessage };
}
```

### Client Component

**File**: `src/app/app/rent/bookings/[bookingId]/move-in/move-in-client.tsx`

**State Management**:
```typescript
const [isProcessing, setIsProcessing] = useState(false);
const [actionType, setActionType] = useState<'confirm' | 'issue' | 'reset' | null>(null);
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
const [showResetDialog, setShowResetDialog] = useState(false);
```

**Handlers**:
```typescript
const handleConfirmMoveIn = async () => {
  setIsProcessing(true);
  setActionType('confirm');

  const result = await confirmMoveIn(bookingId);
  if (result.success) {
    router.push(`/app/rent/bookings/${bookingId}`);
  } else {
    setMessage({ type: 'error', text: result.error });
  }

  setIsProcessing(false);
};

const handleReportIssue = async () => {
  // Similar to confirmMoveIn
};

const handleResetMoveInStatus = async () => {
  // Admin only - resets status for testing
};
```

---

## Testing

### Manual Testing Process

1. **Create Test Booking**:
```typescript
// Via Prisma Studio or script
const booking = await prisma.booking.create({
  data: {
    userId: 'renter-user-id',
    listingId: 'test-listing-id',
    matchId: 'test-match-id',
    startDate: new Date(), // Today
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    moveInStatus: 'pending',
    monthlyRent: 2000,
  }
});
```

2. **Create Test Rent Payments**:
```typescript
const payment1 = await prisma.rentPayment.create({
  data: {
    bookingId: booking.id,
    type: 'MONTHLY_RENT',
    status: 'PENDING_MOVE_IN',
    amount: 2000,
    dueDate: booking.startDate,
    stripePaymentMethodId: 'pm_test_card',
  }
});

const payment2 = await prisma.rentPayment.create({
  data: {
    bookingId: booking.id,
    type: 'MONTHLY_RENT',
    status: 'PENDING_MOVE_IN',
    amount: 2000,
    dueDate: new Date(booking.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    stripePaymentMethodId: 'pm_test_card',
  }
});
```

3. **Test Successful Move-In**:
   - Navigate to `/app/rent/bookings/[bookingId]/move-in`
   - Click "Yes, I've Successfully Moved In"
   - Verify redirect to booking page
   - Check database:
     - `booking.moveInStatus` = 'confirmed'
     - First payment status = 'SUCCEEDED' or 'PROCESSING'
     - Other payments status = 'PENDING'

4. **Test Issue Reporting** (after reset):
   - Click "I'm Having Issues with Move-In"
   - Verify booking status = 'issue_reported'
   - Verify all payments status = 'FAILED_MOVE_IN'

5. **Test Admin Reset** (as admin_dev user):
   - Click "Reset Move-In Status" button
   - Confirm in dialog
   - Verify all fields reset to initial state
   - Verify can go through flow again

### Automated Testing Scenarios

```typescript
describe('Move-In Confirmation', () => {
  it('should process first payment on successful move-in', async () => {
    // Setup
    const booking = await createTestBooking();
    const payment = await createTestPayment(booking.id);

    // Act
    const result = await confirmMoveIn(booking.id);

    // Assert
    expect(result.success).toBe(true);
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });
    expect(updatedBooking.moveInStatus).toBe('confirmed');
  });

  it('should hold payments when issue reported', async () => {
    // Setup
    const booking = await createTestBooking();

    // Act
    const result = await reportMoveInIssue(booking.id, 'Test issue');

    // Assert
    expect(result.success).toBe(true);
    const payments = await prisma.rentPayment.findMany({
      where: { bookingId: booking.id }
    });
    expect(payments.every(p => p.status === 'FAILED_MOVE_IN')).toBe(true);
  });
});
```

---

## Admin Tools

### Admin Dev Reset Functionality

**Access**: Only users with `admin_dev` role can see and use

**Purpose**: Allow QA and development testing of move-in flow

**Location**:
- UI: Visible at bottom of move-in page
- Action: `src/app/app/rent/bookings/[bookingId]/move-in/_actions.ts:resetMoveInStatus()`

**What Gets Reset**:
- Booking move-in fields:
  - `moveInCompletedAt` → `null`
  - `moveInStatus` → `'pending'`
  - `moveInConfirmedAt` → `null`
  - `moveInIssueReportedAt` → `null`
  - `moveInIssueNotes` → `null`
- All monthly rent payment fields:
  - `status` → `'PENDING_MOVE_IN'`
  - `isPaid` → `false`
  - `paymentAuthorizedAt` → `null`
  - `paymentCapturedAt` → `null`
  - `stripePaymentIntentId` → `null`

**Security Measures**:
1. Role check in server component (page.tsx)
2. Role check in server action (_actions.ts)
3. Confirmation dialog before reset
4. Audit logging of who performed reset

**UI Design**:
- Red border card to indicate danger
- Yellow warning alert
- Detailed explanation of what will be reset
- Destructive button style
- Confirmation dialog with cancel option

### Admin Dashboard - Move-In Failures

**Location**: `/app/admin/move-in-failures`

**Purpose**: Monitor bookings with reported move-in issues

**Displayed Information**:
- Booking ID and dates
- Renter and host information
- Issue report timestamp
- Issue notes
- Payment hold status
- Action buttons (view details, contact users)

**Added to Admin Layout**:
```typescript
{
  title: "Move-In Failures",
  url: "/admin/move-in-failures",
  icon: "AlertCircle",
}
```

---

## Troubleshooting

### Common Issues

#### Payment Not Found

**Symptom**: "No first payment to process" in logs

**Possible Causes**:
1. No rent payments created for booking
2. All payments already paid (`isPaid: true`)
3. All payments cancelled (`cancelledAt` is set)
4. Wrong payment type (not 'MONTHLY_RENT')

**Solutions**:
- Check rent payment records in database
- Verify payment creation logic in booking flow
- Ensure payment method was saved

#### Payment Processing Failed

**Symptom**: First payment shows 'FAILED' status

**Possible Causes**:
1. Insufficient funds
2. Card declined
3. Bank account invalid
4. Host Stripe account not configured

**Solutions**:
- Check payment failure reason in database
- Verify host has completed Stripe onboarding
- Test with valid payment method
- Review Stripe dashboard for details

#### Timezone Issues with Due Dates

**Historical Issue** (now resolved): Previously attempted to match payment dueDate to booking startDate using string comparison, which failed due to timezone conversion.

**Current Solution**: Simply take first element from array ordered by dueDate ascending. This avoids all timezone complexity.

**If Similar Issue Arises**:
- Use UTC for all date comparisons
- Compare date components separately (year, month, day)
- Avoid `.toDateString()` conversions
- Log actual date values for debugging

#### Admin Reset Not Visible

**Symptom**: Admin dev users don't see reset button

**Possible Causes**:
1. User doesn't have 'admin_dev' role
2. Role check not working
3. Client component not receiving prop

**Solutions**:
- Verify user role in Clerk dashboard
- Check `checkRole('admin_dev')` function
- Verify `isAdminDev` prop passed to client

### Debug Logging

Enable detailed logging in move-in confirmation:

```typescript
// Check booking details
console.log('[MOVE-IN CONFIRM] Booking details:', {
  bookingId,
  startDate: bookingDetails.startDate,
  totalPaymentsFound: bookingDetails.rentPayments.length,
});

// Check all payments
console.log('[MOVE-IN CONFIRM] All unpaid monthly rent payments:',
  bookingDetails.rentPayments.map(p => ({
    id: p.id,
    dueDate: p.dueDate,
    status: p.status,
    isPaid: p.isPaid,
    amount: p.amount,
  }))
);

// Check first payment
console.log('[MOVE-IN CONFIRM] First payment (earliest dueDate):',
  firstPayment ? {
    id: firstPayment.id,
    dueDate: firstPayment.dueDate,
    status: firstPayment.status,
    amount: firstPayment.amount,
  } : 'NULL - No payments found'
);

// Check payment processing result
console.log('[MOVE-IN CONFIRM] First payment processing result:',
  firstPaymentResult
);
```

---

## Related Documentation

### Core Documentation
- [Payment Specification](./payment-spec.md) - Overall payment system
- [Move-In Confirmation System](./notifications/move-in-confirmation-system.md) - Automated prompt system overview
- [Payment Rules](./payment-rules.md) - Business rules for payments

### Cron Jobs
- [Send Move-In Confirmation Prompt](./cron/send-move-in-confirmation-prompt.md) - 5 AM initial prompt
- [Send Move-In Reminder](./cron/send-move-in-reminder.md) - 6 PM reminder
- [Auto-Confirm Move-Ins](./cron/auto-confirm-move-ins.md) - 3 AM auto-confirm
- [Send Move-In Reminders (T-3 days)](./cron/send-move-in-reminders.md) - Advance notice
- [Process Rent Payments](./cron/process-rent-payments.md) - Scheduled payment processing

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-XX | Initial documentation created | Claude |
| 2025-01-XX | Fixed payment query to remove status filter | Claude |
| 2025-01-XX | Simplified first payment logic to use array index | Claude |
| 2025-01-XX | Added comprehensive debug logging | Claude |
| 2025-01-XX | Added admin dev reset functionality | Claude |
