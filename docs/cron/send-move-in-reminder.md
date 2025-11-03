# Send Move-In Reminder

**Status:** ⚠️ **NOT YET IMPLEMENTED** - Documentation only

**Endpoint:** `/api/cron/send-move-in-reminder`
**Schedule:** Daily at 6:00 PM Pacific Time (1:00 AM UTC next day)
**Purpose:** Reminds renters to confirm move-in if they haven't responded to initial prompt

---

## Overview

⚠️ **Implementation Status**: This cron job is **NOT YET IMPLEMENTED**. This documentation serves as the specification for future implementation.

This cron job sends a reminder to renters who received the initial move-in confirmation prompt but haven't responded yet. This is the second step in the automated move-in confirmation flow, giving renters one more chance to respond before the system auto-confirms the next morning.

**Important**: This uses external cron scheduling (NOT Vercel crons). All times are Pacific timezone.

---

## Business Logic

### What This Cron Does

1. **Identifies Non-Responders**
   - Finds bookings where `startDate` equals today (Pacific timezone)
   - Only bookings with `moveInStatus = 'pending'` (no response yet)
   - Only bookings where `moveInPromptSentAt IS NOT NULL` (initial prompt was sent)
   - Only bookings where `moveInReminderSentAt IS NULL` (reminder not yet sent)

2. **Sends Reminder**
   - Creates in-app notification (same type as initial, flagged as reminder)
   - Sends email (if user preference enabled)
   - Records reminder sent timestamp

3. **Prevents Duplicate Reminders**
   - Sets `booking.moveInReminderSentAt = NOW`
   - Will not send reminder again

### Flow Integration

This is part of a 3-step automated flow:

```
5:00 AM Pacific (Move-In Day)
  └─ Send initial confirmation prompt

6:00 PM Pacific (Move-In Day) ← YOU ARE HERE
  └─ Send reminder if no response

3:00 AM Pacific (Day After Move-In)
  └─ Auto-confirm if still no response
```

**Timing Logic**:
- Initial prompt sent at 5 AM
- Reminder sent at 6 PM (13 hours later)
- Auto-confirm at 3 AM next day (9 hours after reminder, 22 hours after initial prompt)
- Total window: ~22 hours to respond before auto-confirm

---

## Database Queries

### Finding Eligible Bookings

```typescript
const todayPacific = getTodayInPacific(); // Start of day in PT
const tomorrowPacific = getTomorrowInPacific(); // Start of next day in PT

const bookings = await prisma.booking.findMany({
  where: {
    startDate: {
      gte: todayPacific,
      lt: tomorrowPacific,
    },
    moveInStatus: 'pending', // Still no response
    moveInPromptSentAt: {
      not: null, // Initial prompt was sent
    },
    moveInReminderSentAt: null, // Reminder not yet sent
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
        streetAddress1: true,
        city: true,
        state: true,
      },
    },
  },
});
```

### Updating Booking After Reminder Sent

```typescript
await prisma.booking.update({
  where: { id: booking.id },
  data: {
    moveInReminderSentAt: new Date(),
  },
});
```

---

## Notification Configuration

### Notification Type

**Action Type**: `move_in_confirmation_reminder`

### Email Configuration

**Location**: `src/lib/notification-email-config.ts`

```typescript
move_in_confirmation_reminder: {
  subject: 'Reminder: Confirm Your Move-In at {listingTitle}',
  headerText: 'Move-In Confirmation Needed',
  contentTitle: '',
  buttonText: 'Confirm Move-In Now',
  secondaryButtonText: 'Report an Issue',
  getContentText: (content, notification, user, additionalData) => {
    const firstName = user?.firstName || 'there';
    const listingTitle = additionalData?.listingTitle || 'your new home';

    return `Hi ${firstName}, this is a friendly reminder to confirm your move-in at ${listingTitle}. We need to know if everything went smoothly so we can process your rent payments. If you don't respond by tonight, we'll assume your move-in was successful and begin processing your first payment tomorrow morning. If you experienced any issues, please report them now.`;
  },
}
```

### User Preference

Uses the same preference as initial prompt:
**Field**: `UserPreferences.emailMoveInConfirmationPromptNotifications`
**Default**: `true`

---

## Notification Creation

```typescript
await createNotification({
  userId: booking.user.id,
  actionType: 'move_in_confirmation_reminder',
  actionId: booking.id,
  content: `Reminder: Confirm your move-in at ${booking.listing.title}`,
  url: `/app/rent/bookings/${booking.id}/move-in`,
  emailData: buildNotificationEmailData('move_in_confirmation_reminder', {
    listingTitle: booking.listing.title,
    bookingId: booking.id,
    listingAddress: `${booking.listing.streetAddress1}, ${booking.listing.city}, ${booking.listing.state}`,
    autoConfirmTime: '3:00 AM tomorrow',
  }),
});
```

---

## Implementation Checklist

### Prerequisites

- [ ] Add `moveInReminderSentAt` field to Booking model
- [ ] Register `move_in_confirmation_reminder` in notification email config
- [ ] Initial prompt cron must be running first

### Cron Job Implementation

**File**: `src/app/api/cron/send-move-in-reminder/route.ts`

```typescript
export async function GET(request: Request) {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Calculate date range (Pacific timezone)
    const todayPacific = getTodayInPacific();
    const tomorrowPacific = getTomorrowInPacific();

    console.log('[MOVE-IN REMINDER] Looking for non-responders on:', todayPacific.toISOString());

    // 3. Find eligible bookings
    const bookings = await prisma.booking.findMany({
      where: {
        startDate: { gte: todayPacific, lt: tomorrowPacific },
        moveInStatus: 'pending',
        moveInPromptSentAt: { not: null },
        moveInReminderSentAt: null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        listing: { select: { id: true, title: true, streetAddress1: true, city: true, state: true } },
      },
    });

    console.log(`[MOVE-IN REMINDER] Found ${bookings.length} non-responders`);

    // 4. Send reminders
    let successCount = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        // Send notification
        const result = await createNotification({
          userId: booking.user.id,
          actionType: 'move_in_confirmation_reminder',
          actionId: booking.id,
          content: `Reminder: Confirm your move-in at ${booking.listing.title}`,
          url: `/app/rent/bookings/${booking.id}/move-in`,
          emailData: buildNotificationEmailData('move_in_confirmation_reminder', {
            listingTitle: booking.listing.title,
            bookingId: booking.id,
            listingAddress: `${booking.listing.streetAddress1}, ${booking.listing.city}, ${booking.listing.state}`,
            autoConfirmTime: '3:00 AM tomorrow',
          }),
        });

        if (result.success) {
          // Mark reminder as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { moveInReminderSentAt: new Date() },
          });

          successCount++;
          console.log(`[MOVE-IN REMINDER] Sent to ${booking.user.email} for booking ${booking.id}`);
        } else {
          errors.push(`Failed to send reminder for booking ${booking.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`[MOVE-IN REMINDER] Error processing booking ${booking.id}:`, error);
        errors.push(`Error processing booking ${booking.id}: ${error.message}`);
      }
    }

    // 5. Return results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bookingsFound: bookings.length,
      remindersSent: successCount,
      errors: errors,
    });

  } catch (error) {
    console.error('[MOVE-IN REMINDER] Cron job failed:', error);
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
2. Find "Send Move-In Reminder" in the list
3. Click "Trigger Now"
4. Monitor execution results

### Manual Testing via API

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/send-move-in-reminder
```

### Setting Up Test Data

Create a booking that received prompt but no response:

```typescript
const booking = await prisma.booking.create({
  data: {
    userId: 'test-renter-id',
    listingId: 'test-listing-id',
    matchId: 'test-match-id',
    startDate: new Date(), // Today
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    moveInStatus: 'pending', // Still pending
    moveInPromptSentAt: new Date(Date.now() - 13 * 60 * 60 * 1000), // 13 hours ago (5 AM)
    moveInReminderSentAt: null, // No reminder yet
    monthlyRent: 2000,
  }
});
```

### Verification Checklist

After running test:
- [ ] Verify only bookings with initial prompt sent are found
- [ ] Verify renter received in-app notification
- [ ] Verify renter received email
- [ ] Verify email mentions auto-confirm tomorrow
- [ ] Verify `booking.moveInReminderSentAt` is set
- [ ] Verify no duplicate reminders on second run
- [ ] Verify bookings that already responded are excluded

---

## Error Handling

### Graceful Failure

The cron job continues processing other bookings even if one fails:

```typescript
for (const booking of bookings) {
  try {
    // Process booking
  } catch (error) {
    // Log error but continue
    errors.push(`Failed to process booking ${booking.id}: ${error.message}`);
  }
}
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| No bookings found | All renters responded or no move-ins today | Expected behavior |
| Notification creation failed | Database issue | Check database connectivity |
| Email send failed | Resend API issue | Notification still created in-app |
| Missing `moveInPromptSentAt` | Initial prompt cron not running | Check initial prompt cron logs |

---

## Edge Cases

### Renter Responds Between Initial Prompt and Reminder

**Scenario**: Renter confirms move-in at 2 PM, but reminder runs at 6 PM

**Behavior**: No reminder sent because `moveInStatus` will no longer be 'pending'

**Query Handles This**:
```typescript
where: {
  moveInStatus: 'pending', // ← This excludes responded bookings
}
```

### Initial Prompt Never Sent

**Scenario**: Initial prompt cron failed, but reminder cron runs

**Behavior**: No reminder sent because `moveInPromptSentAt` will be null

**Query Handles This**:
```typescript
where: {
  moveInPromptSentAt: { not: null }, // ← Requires initial prompt
}
```

### Reminder Already Sent

**Scenario**: Cron runs twice by accident

**Behavior**: No duplicate reminder sent

**Query Handles This**:
```typescript
where: {
  moveInReminderSentAt: null, // ← Prevents duplicates
}
```

---

## Monitoring

### Key Metrics

| Metric | Expected Value | Alert Threshold |
|--------|---------------|-----------------|
| Execution frequency | Once daily at 6 PM PT | Missed for 2+ days |
| Success rate | 100% | < 95% |
| Bookings found | 0-15/day | > 40/day |
| Reminders sent | Same as bookings found | < bookings found |

**Note**: Expect fewer bookings here than initial prompt (many renters will respond)

### Log Output

```
[MOVE-IN REMINDER] Starting cron job...
[MOVE-IN REMINDER] Looking for non-responders on: 2025-01-15T08:00:00.000Z
[MOVE-IN REMINDER] Found 2 non-responders
[MOVE-IN REMINDER] Sent to renter@example.com for booking abc-123
[MOVE-IN REMINDER] Sent to renter2@example.com for booking def-456
✅ Move-in reminder cron completed: { bookingsFound: 2, remindersSent: 2, errors: [] }
```

---

## Scheduling Setup

### Recommended Schedule

**Time**: Daily at 6:00 PM Pacific Time (1:00 AM UTC next day)

**Reasoning**:
- Gives renters full day to respond to initial prompt
- Evening timing catches renters after work/move-in activities
- Still leaves 9 hours before auto-confirm (3 AM next day)
- Urgent enough to prompt action before auto-confirm

**Note**: 6 PM Pacific = 1 AM UTC the next day (DST-dependent)

### External Cron Service Configuration

#### cron-job.org Setup

1. Create new job:
   - **URL**: `https://your-domain.com/api/cron/send-move-in-reminder`
   - **Schedule**: Daily at 1:00 AM UTC (6 PM PT previous day)
   - **Header**: `Authorization: Bearer [CRON_SECRET]`
   - **Important**: Account for daylight saving time shifts

#### GitHub Actions

Add to `.github/workflows/cron.yml`:

```yaml
- cron: '0 1 * * *'  # 6 PM PT (1 AM UTC next day, DST-dependent)
```

Job step:
```yaml
- name: Send Move-In Reminders
  run: |
    curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
      https://your-domain.com/api/cron/send-move-in-reminder
```

#### Server Crontab

```bash
# Send move-in reminders daily at 6 PM Pacific (1 AM UTC next day)
0 1 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/send-move-in-reminder
```

**DST Warning**: Pacific time shifts between PST (UTC-8) and PDT (UTC-7). Consider using a Pacific-timezone-aware scheduler or adjust cron times seasonally.

---

## Related Documentation

- [Move-In Confirmation System Overview](../notifications/move-in-confirmation-system.md)
- [Send Move-In Confirmation Prompt](./send-move-in-confirmation-prompt.md) - Initial 5 AM prompt
- [Auto-Confirm Move-Ins Cron](./auto-confirm-move-ins.md) - 3 AM auto-confirm
- [Move-In Flow](../move-in-flow.md) - Complete move-in process

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-XX | Initial documentation created | Claude |
