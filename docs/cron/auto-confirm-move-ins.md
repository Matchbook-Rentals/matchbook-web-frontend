# Auto-Confirm Move-Ins

**Status:** ⚠️ **NOT YET IMPLEMENTED** - Documentation only

**Endpoint:** `/api/cron/auto-confirm-move-ins`
**Schedule:** Daily at 3:00 AM Pacific Time (10:00 AM UTC)
**Purpose:** Automatically confirms move-in and processes first payment if renter hasn't responded

---

## Overview

⚠️ **Implementation Status**: This cron job is **NOT YET IMPLEMENTED**. This documentation serves as the specification for future implementation.

This cron job automatically confirms successful move-in for bookings where the renter hasn't responded to the initial prompt or reminder. It assumes the move-in was successful and triggers immediate processing of the first rent payment. This is the final step in the automated move-in confirmation flow.

**Important**: This uses external cron scheduling (NOT Vercel crons). All times are Pacific timezone.

---

## Business Logic

### What This Cron Does

1. **Identifies Non-Responders from Yesterday**
   - Finds bookings where `startDate` was yesterday (Pacific timezone)
   - Only bookings with `moveInStatus = 'pending'` (still no response)
   - Only bookings where `moveInPromptSentAt IS NOT NULL` (prompt was sent)

2. **Auto-Confirms Move-In**
   - Calls `confirmMoveIn()` server action (same as manual confirmation)
   - Processes first rent payment immediately
   - Transitions remaining payments from `PENDING_MOVE_IN` to `PENDING`
   - Updates `booking.moveInStatus = 'confirmed'`

3. **Records Auto-Confirmation**
   - Sets `booking.moveInAutoConfirmedAt = NOW`
   - Creates audit log entry
   - Does NOT notify host (per requirements)

### Flow Integration

This is the final step in a 3-step automated flow:

```
Move-In Day:
  5:00 AM Pacific → Send initial confirmation prompt
  6:00 PM Pacific → Send reminder if no response

Day After Move-In:
  3:00 AM Pacific → Auto-confirm if still no response ← YOU ARE HERE
```

**Timing Logic**:
- Initial prompt sent at 5 AM on move-in day
- Reminder sent at 6 PM on move-in day
- Auto-confirm at 3 AM next day (~22 hours after initial prompt)
- Total response window: ~22 hours

---

## Database Queries

### Finding Eligible Bookings

```typescript
const yesterdayPacific = getYesterdayInPacific(); // Start of yesterday in PT
const todayPacific = getTodayInPacific(); // Start of today in PT

const bookings = await prisma.booking.findMany({
  where: {
    startDate: {
      gte: yesterdayPacific,
      lt: todayPacific,
    },
    moveInStatus: 'pending', // Still no response
    moveInPromptSentAt: {
      not: null, // Prompt was sent
    },
  },
  include: {
    user: {  // Renter
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    listing: {
      select: {
        id: true,
        title: true,
        user: {  // Host
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
    rentPayments: {
      where: {
        type: 'MONTHLY_RENT',
        isPaid: false,
        cancelledAt: null,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        stripePaymentMethodId: true,
      },
    },
  },
});
```

### Updating Booking After Auto-Confirm

```typescript
// This happens inside confirmMoveIn() action
await prisma.booking.update({
  where: { id: booking.id },
  data: {
    moveInStatus: 'confirmed',
    moveInCompletedAt: new Date(),
    moveInConfirmedAt: new Date(),
    moveInAutoConfirmedAt: new Date(), // NEW: marks as auto-confirmed
  },
});
```

---

## Auto-Confirmation Logic

### Calling the confirmMoveIn Action

This cron job reuses the same `confirmMoveIn()` server action that renters use manually:

```typescript
import { confirmMoveIn } from '@/app/app/rent/bookings/[bookingId]/move-in/_actions';

for (const booking of eligibleBookings) {
  try {
    // Call the same action as manual confirmation
    const result = await confirmMoveIn(booking.id);

    if (result.success) {
      // Additionally mark as auto-confirmed
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          moveInAutoConfirmedAt: new Date(),
        },
      });

      successCount++;
      console.log(`[AUTO-CONFIRM] Successfully auto-confirmed booking ${booking.id}`);
    } else {
      errors.push(`Failed to auto-confirm booking ${booking.id}: ${result.error}`);
    }
  } catch (error) {
    errors.push(`Error processing booking ${booking.id}: ${error.message}`);
  }
}
```

### What confirmMoveIn() Does

See [Move-In Flow Documentation](../move-in-flow.md) for complete details:

1. Finds all unpaid monthly rent payments
2. Identifies first payment (earliest due date)
3. Processes first payment via `processRentPaymentNow()`
4. Transitions remaining payments to `PENDING`
5. Updates booking status to `confirmed`

**Payment Processing**:
- Card payments: Immediate charge, status = `SUCCEEDED`
- ACH payments: Initiated, status = `PROCESSING` (settles in 3-5 days)

---

## Safety Checks

### Pre-Flight Validations

Before auto-confirming, the cron job should verify:

```typescript
// 1. Verify payment method exists
if (!booking.rentPayments[0]?.stripePaymentMethodId) {
  console.error(`[AUTO-CONFIRM] Booking ${booking.id} has no payment method`);
  errors.push(`Booking ${booking.id}: No payment method configured`);
  continue; // Skip this booking
}

// 2. Verify booking is still in correct status
if (booking.moveInStatus !== 'pending') {
  console.log(`[AUTO-CONFIRM] Booking ${booking.id} already responded, skipping`);
  continue; // Renter responded between query and processing
}

// 3. Verify host can receive payments
const host = booking.listing.user;
if (!host.stripeAccountId || !host.stripeChargesEnabled) {
  console.error(`[AUTO-CONFIRM] Host for booking ${booking.id} cannot receive payments`);
  errors.push(`Booking ${booking.id}: Host Stripe account not configured`);
  continue; // Skip this booking
}
```

### Error Handling

If auto-confirm fails:
1. Log detailed error
2. Add to errors array
3. Continue processing other bookings
4. Return errors in response for monitoring

```typescript
catch (error) {
  console.error(`[AUTO-CONFIRM] Failed to process booking ${booking.id}:`, error);
  errors.push({
    bookingId: booking.id,
    renterEmail: booking.user.email,
    error: error.message,
  });
  // Continue to next booking
}
```

---

## Audit Logging

### Database Field

**New Field**: `Booking.moveInAutoConfirmedAt`

**Purpose**:
- Distinguishes auto-confirmed from manually confirmed bookings
- Enables analytics on response rates
- Supports auditing and troubleshooting

### Query for Auto-Confirmed Bookings

```typescript
// Find all auto-confirmed bookings
const autoConfirmed = await prisma.booking.findMany({
  where: {
    moveInAutoConfirmedAt: {
      not: null,
    },
  },
});

// Analytics: What % of move-ins are auto-confirmed?
const totalConfirmed = await prisma.booking.count({
  where: { moveInStatus: 'confirmed' }
});

const autoConfirmedCount = await prisma.booking.count({
  where: { moveInAutoConfirmedAt: { not: null } }
});

const autoConfirmRate = (autoConfirmedCount / totalConfirmed) * 100;
console.log(`Auto-confirm rate: ${autoConfirmRate}%`);
```

---

## Host Notifications

### Requirement: Do NOT Notify Hosts

Per your requirements, hosts should **NOT** be notified when:
- Renter manually confirms move-in
- System auto-confirms move-in

Hosts **SHOULD** be notified when:
- Renter reports move-in issue (see `reportMoveInIssue()` action)

### Implementation Note

The auto-confirm process does **NOT** send any notifications. The `confirmMoveIn()` action only:
1. Processes payment
2. Updates database
3. Returns success/error response

---

## Implementation Checklist

### Prerequisites

- [ ] Add `moveInAutoConfirmedAt` field to Booking model
- [ ] Initial prompt cron must be running
- [ ] `confirmMoveIn()` action must be working correctly
- [ ] `processRentPaymentNow()` function must be available

### Cron Job Implementation

**File**: `src/app/api/cron/auto-confirm-move-ins/route.ts`

```typescript
import { confirmMoveIn } from '@/app/app/rent/bookings/[bookingId]/move-in/_actions';

export async function GET(request: Request) {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Calculate date range (Pacific timezone)
    const yesterdayPacific = getYesterdayInPacific();
    const todayPacific = getTodayInPacific();

    console.log('[AUTO-CONFIRM] Looking for non-responders from:', yesterdayPacific.toISOString());

    // 3. Find eligible bookings
    const bookings = await prisma.booking.findMany({
      where: {
        startDate: { gte: yesterdayPacific, lt: todayPacific },
        moveInStatus: 'pending',
        moveInPromptSentAt: { not: null },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        listing: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                id: true,
                stripeAccountId: true,
                stripeChargesEnabled: true,
              },
            },
          },
        },
        rentPayments: {
          where: {
            type: 'MONTHLY_RENT',
            isPaid: false,
            cancelledAt: null,
          },
          select: {
            id: true,
            status: true,
            stripePaymentMethodId: true,
          },
        },
      },
    });

    console.log(`[AUTO-CONFIRM] Found ${bookings.length} bookings to auto-confirm`);

    // 4. Process auto-confirmations
    let successCount = 0;
    const errors: any[] = [];

    for (const booking of bookings) {
      try {
        // Safety check: Payment method exists
        if (!booking.rentPayments[0]?.stripePaymentMethodId) {
          console.error(`[AUTO-CONFIRM] Booking ${booking.id} has no payment method`);
          errors.push({
            bookingId: booking.id,
            renterEmail: booking.user.email,
            error: 'No payment method configured',
          });
          continue;
        }

        // Safety check: Host can receive payments
        const host = booking.listing.user;
        if (!host.stripeAccountId || !host.stripeChargesEnabled) {
          console.error(`[AUTO-CONFIRM] Host for booking ${booking.id} cannot receive payments`);
          errors.push({
            bookingId: booking.id,
            renterEmail: booking.user.email,
            error: 'Host Stripe account not configured',
          });
          continue;
        }

        // Call confirmMoveIn action
        const result = await confirmMoveIn(booking.id);

        if (result.success) {
          // Mark as auto-confirmed
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              moveInAutoConfirmedAt: new Date(),
            },
          });

          successCount++;
          console.log(`[AUTO-CONFIRM] Auto-confirmed booking ${booking.id} for ${booking.user.email}`);
        } else {
          errors.push({
            bookingId: booking.id,
            renterEmail: booking.user.email,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        console.error(`[AUTO-CONFIRM] Error processing booking ${booking.id}:`, error);
        errors.push({
          bookingId: booking.id,
          renterEmail: booking.user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 5. Return results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bookingsFound: bookings.length,
      autoConfirmed: successCount,
      errors: errors,
    });

  } catch (error) {
    console.error('[AUTO-CONFIRM] Cron job failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
```

---

## Testing

### Manual Testing via Admin Interface

1. Navigate to `/app/admin/cron-jobs`
2. Find "Auto-Confirm Move-Ins" in the list
3. Click "Trigger Now"
4. Monitor execution results

### Manual Testing via API

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/auto-confirm-move-ins
```

### Setting Up Test Data

Create a booking with move-in yesterday, no response:

```typescript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const booking = await prisma.booking.create({
  data: {
    userId: 'test-renter-id',
    listingId: 'test-listing-id',
    matchId: 'test-match-id',
    startDate: yesterday,
    endDate: new Date(yesterday.getTime() + 30 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    moveInStatus: 'pending', // Still pending
    moveInPromptSentAt: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000), // 5 AM yesterday
    moveInReminderSentAt: new Date(yesterday.getTime() + 18 * 60 * 60 * 1000), // 6 PM yesterday
    monthlyRent: 2000,
  }
});

// Create test payment
await prisma.rentPayment.create({
  data: {
    bookingId: booking.id,
    type: 'MONTHLY_RENT',
    status: 'PENDING_MOVE_IN',
    amount: 2000,
    dueDate: yesterday,
    stripePaymentMethodId: 'pm_test_card',
  }
});
```

### Verification Checklist

After running test:
- [ ] Verify `booking.moveInStatus` = 'confirmed'
- [ ] Verify `booking.moveInAutoConfirmedAt` is set
- [ ] Verify first payment processed (status = SUCCEEDED or PROCESSING)
- [ ] Verify remaining payments transitioned to PENDING
- [ ] Verify no host notification sent
- [ ] Verify no duplicate auto-confirms on second run
- [ ] Verify payment transaction created
- [ ] Check logs for successful execution

---

## Error Handling

### Critical Errors (Stop Processing This Booking)

1. **No Payment Method**: Skip booking, log error
2. **Host Cannot Receive Payments**: Skip booking, log error
3. **Payment Processing Failed**: Log error, include in response

### Non-Critical Errors (Continue Processing)

- Single booking failure doesn't stop other bookings
- All errors collected and returned in response
- Monitoring alerts can be set based on error count

### Failed Payment Processing

If `confirmMoveIn()` fails due to payment issues:
- Booking status remains `pending`
- Will retry next day (cron runs daily)
- After 3 days of failures, manual intervention needed

---

## Edge Cases

### Renter Responds During Cron Execution

**Scenario**: Renter confirms at 3:05 AM while cron is running at 3:00 AM

**Behavior**:
- If query already ran: Booking will be auto-confirmed (timing conflict)
- If not yet processed: Skip booking (moveInStatus no longer 'pending')

**Mitigation**: Check status again before calling `confirmMoveIn()`

### Payment Method Removed

**Scenario**: Renter deleted payment method before auto-confirm

**Behavior**: Safety check catches this, skips booking, logs error

**Resolution**: Manual follow-up needed with renter

### Host Stripe Account Issues

**Scenario**: Host's Stripe account disabled after booking created

**Behavior**: Safety check catches this, skips booking, logs error

**Resolution**: Admin must resolve host's Stripe account issues

### No Prompt Sent

**Scenario**: Initial prompt cron failed yesterday

**Behavior**: No auto-confirm (requires `moveInPromptSentAt` not null)

**Resolution**: Booking stays in pending, manual follow-up needed

---

## Monitoring

### Key Metrics

| Metric | Expected Value | Alert Threshold |
|--------|---------------|-----------------|
| Execution frequency | Once daily at 3 AM PT | Missed for 2+ days |
| Success rate | > 90% | < 80% |
| Bookings found | 0-10/day | > 30/day |
| Auto-confirmed | ~80-90% of found | < 50% of found |
| Errors | < 10% | > 20% |

### Analytics

Track these metrics over time:
- Auto-confirm rate (what % don't respond?)
- Payment success rate on auto-confirm
- Time-to-response distribution
- Issues reported vs auto-confirmed

### Log Output

```
[AUTO-CONFIRM] Starting cron job...
[AUTO-CONFIRM] Looking for non-responders from: 2025-01-14T08:00:00.000Z
[AUTO-CONFIRM] Found 3 bookings to auto-confirm
[AUTO-CONFIRM] Auto-confirmed booking abc-123 for renter@example.com
[AUTO-CONFIRM] Auto-confirmed booking def-456 for renter2@example.com
[AUTO-CONFIRM] Auto-confirmed booking ghi-789 for renter3@example.com
✅ Auto-confirm cron completed: {
  bookingsFound: 3,
  autoConfirmed: 3,
  errors: []
}
```

---

## Scheduling Setup

### Recommended Schedule

**Time**: Daily at 3:00 AM Pacific Time (10:00 AM UTC)

**Reasoning**:
- Runs ~22 hours after initial prompt (5 AM previous day)
- Runs ~9 hours after reminder (6 PM previous day)
- Early morning timing minimizes user-facing timing conflicts
- Gives ample response window while staying close to move-in day

### External Cron Service Configuration

#### cron-job.org Setup

1. Create new job:
   - **URL**: `https://your-domain.com/api/cron/auto-confirm-move-ins`
   - **Schedule**: Daily at 10:00 AM UTC (3 AM PT)
   - **Header**: `Authorization: Bearer [CRON_SECRET]`

#### GitHub Actions

Add to `.github/workflows/cron.yml`:

```yaml
- cron: '0 10 * * *'  # 3 AM PT (10 AM UTC, DST-dependent)
```

Job step:
```yaml
- name: Auto-Confirm Move-Ins
  run: |
    curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
      https://your-domain.com/api/cron/auto-confirm-move-ins
```

#### Server Crontab

```bash
# Auto-confirm move-ins daily at 3 AM Pacific (10 AM UTC)
0 10 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/auto-confirm-move-ins
```

---

## Related Documentation

- [Move-In Confirmation System Overview](../notifications/move-in-confirmation-system.md)
- [Send Move-In Confirmation Prompt](./send-move-in-confirmation-prompt.md) - Initial 5 AM prompt
- [Send Move-In Reminder](./send-move-in-reminder.md) - 6 PM reminder
- [Move-In Flow](../move-in-flow.md) - Complete move-in process
- [Payment Processing](../../lib/payment-processing.ts) - processRentPaymentNow()

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-XX | Initial documentation created | Claude |
