# Send Move-In Confirmation Prompt

**Status:** ⚠️ **NOT YET IMPLEMENTED** - Documentation only

**Endpoint:** `/api/cron/send-move-in-confirmation-prompt`
**Schedule:** Daily at 5:00 AM Pacific Time (12:00 PM UTC)
**Purpose:** Prompts renters to confirm successful move-in on their move-in day

---

## Overview

⚠️ **Implementation Status**: This cron job is **NOT YET IMPLEMENTED**. This documentation serves as the specification for future implementation.

This cron job sends the initial move-in confirmation prompt to renters on their move-in day. The prompt asks them to confirm they've successfully moved in or report any issues. This is the first step in the automated move-in confirmation flow.

**Important**: This uses external cron scheduling (NOT Vercel crons). All times are Pacific timezone.

---

## Business Logic

### What This Cron Does

1. **Identifies Move-In Day Bookings**
   - Finds bookings where `startDate` equals today (Pacific timezone)
   - Only bookings with `status` in `['confirmed', 'reserved']`
   - Only bookings where `moveInStatus = 'pending'` (haven't responded yet)

2. **Sends Confirmation Prompt**
   - Creates in-app notification
   - Sends email (if user preference enabled)
   - Records prompt sent timestamp

3. **Tracks Prompt Delivery**
   - Sets `booking.moveInPromptSentAt = NOW`
   - Prevents duplicate prompts

### Flow Integration

This is part of a 3-step automated flow:

```
5:00 AM Pacific (Move-In Day)
  └─ Send initial confirmation prompt ← YOU ARE HERE

6:00 PM Pacific (Move-In Day)
  └─ Send reminder if no response (see send-move-in-reminder.md)

3:00 AM Pacific (Day After Move-In)
  └─ Auto-confirm if still no response (see auto-confirm-move-ins.md)
```

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
    status: {
      in: ['confirmed', 'reserved'],
    },
    moveInStatus: 'pending',
    moveInPromptSentAt: null, // Haven't sent prompt yet
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

### Updating Booking After Prompt Sent

```typescript
await prisma.booking.update({
  where: { id: booking.id },
  data: {
    moveInPromptSentAt: new Date(),
  },
});
```

---

## Notification Configuration

### Notification Type

**Action Type**: `move_in_confirmation_prompt`

### Email Configuration

**Location**: `src/lib/notification-email-config.ts`

```typescript
move_in_confirmation_prompt: {
  subject: 'Confirm Your Move-In at {listingTitle}',
  headerText: 'Welcome to Your New Home!',
  contentTitle: '',
  buttonText: 'Confirm Move-In',
  secondaryButtonText: 'Report an Issue',
  getContentText: (content, notification, user, additionalData) => {
    const firstName = user?.firstName || 'there';
    const listingTitle = additionalData?.listingTitle || 'your new home';

    return `Hi ${firstName}, we hope your move-in to ${listingTitle} went smoothly! Please confirm below that you've successfully moved in so we can begin processing your rent payments. If you experienced any issues, please let us know and we'll work with you to resolve them.`;
  },
}
```

### User Preference

**Field**: `UserPreferences.emailMoveInConfirmationPromptNotifications`
**Default**: `true`

Users can disable these emails in their notification preferences.

---

## Notification Creation

```typescript
await createNotification({
  userId: booking.user.id,
  actionType: 'move_in_confirmation_prompt',
  actionId: booking.id,
  content: `Confirm your move-in at ${booking.listing.title}`,
  url: `/app/rent/bookings/${booking.id}/move-in`,
  emailData: buildNotificationEmailData('move_in_confirmation_prompt', {
    listingTitle: booking.listing.title,
    bookingId: booking.id,
    listingAddress: `${booking.listing.streetAddress1}, ${booking.listing.city}, ${booking.listing.state}`,
    moveInDate: formatDate(booking.startDate),
  }),
});
```

---

## Implementation Checklist

### Prerequisites

- [ ] Add `moveInPromptSentAt` field to Booking model
- [ ] Add `emailMoveInConfirmationPromptNotifications` to UserPreferences model
- [ ] Register `move_in_confirmation_prompt` in notification email config
- [ ] Add preference mapping in `src/app/actions/notifications.ts`

### Cron Job Implementation

**File**: `src/app/api/cron/send-move-in-confirmation-prompt/route.ts`

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

    console.log('[MOVE-IN PROMPT] Looking for move-ins on:', todayPacific.toISOString());

    // 3. Find eligible bookings
    const bookings = await prisma.booking.findMany({
      where: {
        startDate: { gte: todayPacific, lt: tomorrowPacific },
        status: { in: ['confirmed', 'reserved'] },
        moveInStatus: 'pending',
        moveInPromptSentAt: null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        listing: { select: { id: true, title: true, streetAddress1: true, city: true, state: true } },
      },
    });

    console.log(`[MOVE-IN PROMPT] Found ${bookings.length} bookings`);

    // 4. Send prompts
    let successCount = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        // Send notification
        const result = await createNotification({
          userId: booking.user.id,
          actionType: 'move_in_confirmation_prompt',
          actionId: booking.id,
          content: `Confirm your move-in at ${booking.listing.title}`,
          url: `/app/rent/bookings/${booking.id}/move-in`,
          emailData: buildNotificationEmailData('move_in_confirmation_prompt', {
            listingTitle: booking.listing.title,
            bookingId: booking.id,
            listingAddress: `${booking.listing.streetAddress1}, ${booking.listing.city}, ${booking.listing.state}`,
            moveInDate: formatDate(booking.startDate),
          }),
        });

        if (result.success) {
          // Mark prompt as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { moveInPromptSentAt: new Date() },
          });

          successCount++;
          console.log(`[MOVE-IN PROMPT] Sent to ${booking.user.email} for booking ${booking.id}`);
        } else {
          errors.push(`Failed to send notification for booking ${booking.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`[MOVE-IN PROMPT] Error processing booking ${booking.id}:`, error);
        errors.push(`Error processing booking ${booking.id}: ${error.message}`);
      }
    }

    // 5. Return results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bookingsFound: bookings.length,
      promptsSent: successCount,
      errors: errors,
    });

  } catch (error) {
    console.error('[MOVE-IN PROMPT] Cron job failed:', error);
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
2. Find "Send Move-In Confirmation Prompt" in the list
3. Click "Trigger Now"
4. Monitor execution results

### Manual Testing via API

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/send-move-in-confirmation-prompt
```

### Setting Up Test Data

Create a booking with move-in date today:

```typescript
const booking = await prisma.booking.create({
  data: {
    userId: 'test-renter-id',
    listingId: 'test-listing-id',
    matchId: 'test-match-id',
    startDate: new Date(), // Today
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    moveInStatus: 'pending',
    moveInPromptSentAt: null, // Important: null to trigger prompt
    monthlyRent: 2000,
    totalPrice: 2000,
  }
});
```

### Verification Checklist

After running test:
- [ ] Check logs for successful execution
- [ ] Verify renter received in-app notification
- [ ] Verify renter received email
- [ ] Verify email has both "Confirm" and "Report Issue" buttons
- [ ] Verify `booking.moveInPromptSentAt` is set
- [ ] Click email link, verify it goes to move-in page
- [ ] Verify no duplicate prompts sent on second run

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
| No bookings found | No move-ins today | Expected behavior |
| Notification creation failed | Database issue | Check database connectivity |
| Email send failed | Resend API issue | Notification still created in-app |
| Duplicate prompts | `moveInPromptSentAt` not set | Verify database update succeeds |

---

## Monitoring

### Key Metrics

| Metric | Expected Value | Alert Threshold |
|--------|---------------|-----------------|
| Execution frequency | Once daily at 5 AM PT | Missed for 2+ days |
| Success rate | 100% | < 95% |
| Bookings found | 0-20/day | > 50/day |
| Prompts sent | Same as bookings found | < bookings found |

### Log Output

```
[MOVE-IN PROMPT] Starting cron job...
[MOVE-IN PROMPT] Looking for move-ins on: 2025-01-15T08:00:00.000Z
[MOVE-IN PROMPT] Found 3 bookings
[MOVE-IN PROMPT] Sent to renter@example.com for booking abc-123
[MOVE-IN PROMPT] Sent to renter2@example.com for booking def-456
[MOVE-IN PROMPT] Sent to renter3@example.com for booking ghi-789
✅ Move-in prompt cron completed: { bookingsFound: 3, promptsSent: 3, errors: [] }
```

---

## Scheduling Setup

### Recommended Schedule

**Time**: Daily at 5:00 AM Pacific Time (12:00 PM UTC)

**Reasoning**:
- Early enough that renter sees it before/during move-in
- Not too early to disturb sleep
- Gives renter full day to respond before evening reminder

### External Cron Service Configuration

**Important**: Do NOT use Vercel crons. Use external service like cron-job.org, GitHub Actions, or server crontab.

#### cron-job.org Setup

1. Go to cron-job.org
2. Create new job:
   - **URL**: `https://your-domain.com/api/cron/send-move-in-confirmation-prompt`
   - **Schedule**: Daily at 12:00 UTC (5 AM Pacific)
   - **Header**: `Authorization: Bearer [CRON_SECRET]`
   - **Timezone**: UTC

#### GitHub Actions

Add to `.github/workflows/cron.yml`:

```yaml
- cron: '0 12 * * *'  # 5 AM PT (12 PM UTC)
```

Job step:
```yaml
- name: Send Move-In Confirmation Prompts
  run: |
    curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
      https://your-domain.com/api/cron/send-move-in-confirmation-prompt
```

#### Server Crontab

```bash
# Send move-in confirmation prompts daily at 5 AM Pacific (12 PM UTC)
0 12 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/send-move-in-confirmation-prompt
```

---

## Related Documentation

- [Move-In Confirmation System Overview](../notifications/move-in-confirmation-system.md)
- [Send Move-In Reminder Cron](./send-move-in-reminder.md) - 6 PM reminder
- [Auto-Confirm Move-Ins Cron](./auto-confirm-move-ins.md) - 3 AM auto-confirm
- [Move-In Flow](../move-in-flow.md) - Complete move-in process
- [Send Move-In Reminders Cron](./send-move-in-reminders.md) - T-3 days advance notice

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-XX | Initial documentation created | Claude |
