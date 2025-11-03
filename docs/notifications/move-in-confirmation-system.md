# Move-In Confirmation Notification System

**Last Updated**: 2025-01-XX
**Status**: ⚠️ **NOT YET IMPLEMENTED** - Documentation only

---

⚠️ **IMPORTANT**: This entire system is **NOT YET IMPLEMENTED**. This documentation serves as the complete specification for building the automated move-in confirmation prompt system.

**What IS Implemented**:
- ✅ Manual move-in confirmation page (`/app/rent/bookings/[bookingId]/move-in`)
- ✅ `confirmMoveIn()` server action
- ✅ `reportMoveInIssue()` server action
- ✅ Payment processing via `processRentPaymentNow()`

**What IS NOT Implemented**:
- ❌ Automated prompt cron jobs (all 3)
- ❌ Notification types (`move_in_confirmation_prompt`, `move_in_confirmation_reminder`)
- ❌ Email configurations for prompts
- ❌ Database fields (`moveInPromptSentAt`, `moveInReminderSentAt`, `moveInAutoConfirmedAt`)
- ❌ User preference (`emailMoveInConfirmationPromptNotifications`)
- ❌ Host notification for issues

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Complete Flow Timeline](#complete-flow-timeline)
3. [Notification Types](#notification-types)
4. [Email Builder Configuration](#email-builder-configuration)
5. [Database Schema](#database-schema)
6. [Implementation Guide](#implementation-guide)
7. [User Preferences](#user-preferences)
8. [Host Notifications](#host-notifications)
9. [Analytics and Monitoring](#analytics-and-monitoring)

---

## System Overview

The move-in confirmation notification system automates prompting renters to confirm their move-in status. It consists of three automated touchpoints designed to maximize response rates while providing a graceful auto-confirm fallback.

### Design Goals

1. **High Response Rate**: Multiple prompts increase likelihood of renter response
2. **User-Friendly Timing**: Morning prompt, evening reminder, overnight auto-confirm
3. **Payment Protection**: Ensures payment processing only after successful move-in
4. **Graceful Fallback**: Auto-confirms to avoid blocking payments indefinitely
5. **Host Awareness**: Alerts hosts only to problems, not routine confirmations

### Three-Step Flow

```
DAY 1 (Move-In Day):
  5:00 AM PT  →  Initial confirmation prompt sent
                 ├─ In-app notification
                 ├─ Email with "Confirm" and "Report Issue" buttons
                 └─ Link to /app/rent/bookings/[id]/move-in

  6:00 PM PT  →  Reminder sent (if no response)
                 ├─ In-app notification
                 ├─ Email mentions auto-confirm tomorrow
                 └─ Same link to move-in page

DAY 2 (Day After Move-In):
  3:00 AM PT  →  Auto-confirm (if still no response)
                 ├─ Calls confirmMoveIn() action
                 ├─ Processes first payment
                 ├─ No notification to renter or host
                 └─ Audit log: moveInAutoConfirmedAt timestamp
```

### Response Window

- **Total time to respond**: ~22 hours (5 AM to 3 AM next day)
- **Time between prompts**: 13 hours (5 AM to 6 PM)
- **Time after reminder**: 9 hours (6 PM to 3 AM)

---

## Complete Flow Timeline

### Advance Notice (T-3 days)

**Cron**: `send-move-in-reminders`
**Time**: 9:00 AM Pacific
**Purpose**: Inform renter and host that move-in is approaching

```
Notification: move_in_upcoming
├─ To: Renter
├─ Content: "Your booking at [Listing] starts in 3 days"
└─ Link: /app/rent/bookings/[id]/move-in/instructions

Notification: move_in_upcoming_host
├─ To: Host
├─ Content: "[Renter] is scheduled to move in 3 days"
└─ Link: /app/host/[listingId]/bookings/[bookingId]
```

### Move-In Day Morning (T+0, 5 AM)

**Cron**: `send-move-in-confirmation-prompt`
**Time**: 5:00 AM Pacific
**Purpose**: Prompt renter to confirm or report issues

```
Notification: move_in_confirmation_prompt
├─ To: Renter only
├─ Content: "Confirm your move-in at [Listing]"
├─ Buttons: "Confirm Move-In" | "Report an Issue"
├─ Link: /app/rent/bookings/[id]/move-in
└─ Database: Sets moveInPromptSentAt
```

### Move-In Day Evening (T+0, 6 PM)

**Cron**: `send-move-in-reminder`
**Time**: 6:00 PM Pacific
**Condition**: Only if `moveInStatus` still 'pending'

```
Notification: move_in_confirmation_reminder
├─ To: Renter only
├─ Content: "Reminder: Confirm your move-in at [Listing]"
├─ Warning: "If no response, auto-confirm tomorrow morning"
├─ Buttons: "Confirm Move-In Now" | "Report an Issue"
├─ Link: /app/rent/bookings/[id]/move-in
└─ Database: Sets moveInReminderSentAt
```

### Next Morning (T+1, 3 AM)

**Cron**: `auto-confirm-move-ins`
**Time**: 3:00 AM Pacific
**Condition**: Only if `moveInStatus` still 'pending'

```
Action: Auto-Confirm Move-In
├─ Calls confirmMoveIn(bookingId)
├─ Processes first payment (processRentPaymentNow)
├─ Transitions remaining payments PENDING_MOVE_IN → PENDING
├─ Updates moveInStatus: 'pending' → 'confirmed'
├─ Sets moveInAutoConfirmedAt timestamp
└─ NO notifications sent
```

### Issue Reporting (Any Time)

**User Action**: Renter clicks "Report an Issue"
**Result**: Immediate notification to host

```
Notification: move_in_issue_reported_host
├─ To: Host only
├─ Content: "[Renter] reported an issue with move-in"
├─ Issue notes: [Renter's description]
├─ Action: All payments → FAILED_MOVE_IN
└─ Link: /app/host/[listingId]/bookings/[bookingId]
```

---

## Notification Types

### move_in_confirmation_prompt

**Sent**: 5:00 AM on move-in day
**To**: Renter
**Purpose**: Initial prompt to confirm move-in

**Action Type**: `move_in_confirmation_prompt`
**Action ID**: `bookingId`
**URL**: `/app/rent/bookings/[bookingId]/move-in`

**Additional Data**:
- `listingTitle`
- `bookingId`
- `listingAddress`
- `moveInDate`

### move_in_confirmation_reminder

**Sent**: 6:00 PM on move-in day (if no response)
**To**: Renter
**Purpose**: Reminder with urgency about auto-confirm

**Action Type**: `move_in_confirmation_reminder`
**Action ID**: `bookingId`
**URL**: `/app/rent/bookings/[bookingId]/move-in`

**Additional Data**:
- `listingTitle`
- `bookingId`
- `listingAddress`
- `autoConfirmTime` (3:00 AM tomorrow)

### move_in_issue_reported_host

**Sent**: Immediately when renter reports issue
**To**: Host
**Purpose**: Alert host to move-in problem

**Action Type**: `move_in_issue_reported_host`
**Action ID**: `bookingId`
**URL**: `/app/host/[listingId]/bookings/[bookingId]`

**Additional Data**:
- `renterName`
- `listingTitle`
- `bookingId`
- `issueNotes`
- `reportedAt`

---

## Email Builder Configuration

### Registration in notification-email-config.ts

**File**: `src/lib/notification-email-config.ts`

Add to `NOTIFICATION_EMAIL_CONFIGS` object:

```typescript
export const NOTIFICATION_EMAIL_CONFIGS = {
  // ... existing configs

  move_in_confirmation_prompt: {
    subject: '', // Dynamic: "Confirm Your Move-In at {listingTitle}"
    headerText: 'Welcome to Your New Home!',
    contentTitle: '',
    buttonText: 'Confirm Move-In',
    secondaryButtonText: 'Report an Issue',
    getContentText: (content, notification, user, additionalData) => {
      const firstName = user?.firstName || 'there';
      const listingTitle = additionalData?.listingTitle || 'your new home';
      const listingAddress = additionalData?.listingAddress || '';
      const moveInDate = additionalData?.moveInDate || 'today';

      return `Hi ${firstName}, we hope your move-in to ${listingTitle} went smoothly!

Your move-in date: ${moveInDate}
Property address: ${listingAddress}

Please confirm below that you've successfully moved in so we can begin processing your rent payments.

If you experienced any issues with your move-in (property condition, keys, access, etc.), please let us know immediately and we'll work with you to resolve them. Your payments will remain on hold until the issues are addressed.`;
    },
  },

  move_in_confirmation_reminder: {
    subject: '', // Dynamic: "Reminder: Confirm Your Move-In at {listingTitle}"
    headerText: 'Move-In Confirmation Needed',
    contentTitle: '',
    buttonText: 'Confirm Move-In Now',
    secondaryButtonText: 'Report an Issue',
    getContentText: (content, notification, user, additionalData) => {
      const firstName = user?.firstName || 'there';
      const listingTitle = additionalData?.listingTitle || 'your new home';
      const autoConfirmTime = additionalData?.autoConfirmTime || '3:00 AM tomorrow';

      return `Hi ${firstName}, this is a friendly reminder to confirm your move-in at ${listingTitle}.

⏰ Important: If we don't hear from you by tonight, we'll assume your move-in was successful and automatically begin processing your first rent payment tomorrow morning at ${autoConfirmTime}.

If everything went smoothly, please click "Confirm Move-In Now" below.

If you experienced any issues, please report them now so we can help resolve them before processing payments.`;
    },
  },

  move_in_issue_reported_host: {
    subject: '', // Dynamic: "Move-In Issue Reported: {listingTitle}"
    headerText: 'Move-In Issue Reported',
    contentTitle: '',
    buttonText: 'View Booking Details',
    getContentText: (content, notification, user, additionalData) => {
      const firstName = user?.firstName || 'there';
      const renterName = additionalData?.renterName || 'Your renter';
      const listingTitle = additionalData?.listingTitle || 'your property';
      const issueNotes = additionalData?.issueNotes || 'No details provided';
      const reportedAt = additionalData?.reportedAt || 'recently';

      return `Hi ${firstName}, ${renterName} has reported an issue with their move-in at ${listingTitle}.

Issue reported: ${reportedAt}

Details from renter:
"${issueNotes}"

Their rent payments are currently on hold. Our support team has been notified and will work with both of you to resolve this issue. You may also receive direct contact from the renter.

Please review the booking details and be prepared to assist in resolving the issue.`;
    },
  },
};
```

### Building Email Data

**Function**: `buildNotificationEmailData()`
**Location**: `src/lib/notification-email-config.ts`

```typescript
// Usage in cron jobs
const emailData = buildNotificationEmailData(
  'move_in_confirmation_prompt',
  {
    content: `Confirm your move-in at ${listing.title}`,
    url: `/app/rent/bookings/${booking.id}/move-in`,
  },
  { firstName: user.firstName },
  {
    listingTitle: listing.title,
    bookingId: booking.id,
    listingAddress: `${listing.streetAddress1}, ${listing.city}, ${listing.state}`,
    moveInDate: formatDate(booking.startDate),
  }
);
```

### Dynamic Subject Lines

Set in `buildNotificationEmailData()`:

```typescript
if (actionType === 'move_in_confirmation_prompt' && additionalData?.listingTitle) {
  emailData.subject = `Confirm Your Move-In at ${additionalData.listingTitle}`;
}

if (actionType === 'move_in_confirmation_reminder' && additionalData?.listingTitle) {
  emailData.subject = `Reminder: Confirm Your Move-In at ${additionalData.listingTitle}`;
}

if (actionType === 'move_in_issue_reported_host' && additionalData?.listingTitle) {
  emailData.subject = `Move-In Issue Reported: ${additionalData.listingTitle}`;
}
```

---

## Database Schema

### Booking Model Fields

Add to `prisma/schema.prisma`:

```prisma
model Booking {
  // ... existing fields

  // Move-in status tracking
  moveInStatus              String?    // 'pending', 'confirmed', 'issue_reported'
  moveInCompletedAt         DateTime?  // When confirmed (manual or auto)
  moveInConfirmedAt         DateTime?  // When manually confirmed by renter
  moveInIssueReportedAt     DateTime?  // When issue reported
  moveInIssueNotes          String?    // Renter's issue description

  // Automated prompt tracking (NEW)
  moveInPromptSentAt        DateTime?  // When initial prompt sent (5 AM)
  moveInReminderSentAt      DateTime?  // When reminder sent (6 PM)
  moveInAutoConfirmedAt     DateTime?  // When auto-confirmed (3 AM next day)

  // ... relations
}
```

### UserPreferences Fields

Add to `prisma/schema.prisma`:

```prisma
model UserPreferences {
  // ... existing fields

  // Move-in notification preferences (NEW)
  emailMoveInConfirmationPromptNotifications Boolean @default(true)

  // ... existing preferences
}
```

**Note**: Both initial prompt and reminder use the same preference.

---

## Implementation Guide

### Step 1: Database Migration

Add new fields to Booking and UserPreferences models:

```bash
# After updating schema.prisma
npx prisma db push
npx prisma generate
```

### Step 2: Register Notification Types

Add configurations to `src/lib/notification-email-config.ts`:
- `move_in_confirmation_prompt`
- `move_in_confirmation_reminder`
- `move_in_issue_reported_host`

### Step 3: Add Preference Mapping

In `src/app/actions/notifications.ts`, add to preference mapping:

```typescript
const emailPreferenceMap: Record<string, string> = {
  // ... existing mappings
  'move_in_confirmation_prompt': 'emailMoveInConfirmationPromptNotifications',
  'move_in_confirmation_reminder': 'emailMoveInConfirmationPromptNotifications',
  'move_in_issue_reported_host': 'emailMoveInUpcomingNotifications', // Reuse existing
};
```

### Step 4: Implement Cron Jobs

Create three cron job endpoints:

1. `/api/cron/send-move-in-confirmation-prompt` - [Documentation](../cron/send-move-in-confirmation-prompt.md)
2. `/api/cron/send-move-in-reminder` - [Documentation](../cron/send-move-in-reminder.md)
3. `/api/cron/auto-confirm-move-ins` - [Documentation](../cron/auto-confirm-move-ins.md)

### Step 5: Update Move-In Actions

Modify `reportMoveInIssue()` in `src/app/app/rent/bookings/[bookingId]/move-in/_actions.ts`:

```typescript
// Add host notification when issue reported
if (result.success) {
  // Notify host
  await createNotification({
    userId: booking.listing.userId, // Host
    actionType: 'move_in_issue_reported_host',
    actionId: booking.id,
    content: `${booking.user.firstName} reported a move-in issue at ${booking.listing.title}`,
    url: `/app/host/${booking.listing.id}/bookings/${booking.id}`,
    emailData: buildNotificationEmailData('move_in_issue_reported_host', {
      renterName: `${booking.user.firstName} ${booking.user.lastName}`,
      listingTitle: booking.listing.title,
      bookingId: booking.id,
      issueNotes: reason,
      reportedAt: new Date().toLocaleDateString(),
    }),
  });
}
```

### Step 6: Schedule Cron Jobs

Set up external cron scheduling (NOT Vercel crons):
- 5:00 AM PT (12:00 PM UTC) - Initial prompt
- 6:00 PM PT (1:00 AM UTC next day) - Reminder
- 3:00 AM PT (10:00 AM UTC) - Auto-confirm

### Step 7: Testing

Test each cron job independently:
1. Create test bookings with appropriate dates
2. Trigger crons via admin interface
3. Verify notifications sent
4. Verify database fields updated
5. Test full flow end-to-end

---

## User Preferences

### Preference Control

Users can disable move-in confirmation emails in their notification settings:

**Field**: `emailMoveInConfirmationPromptNotifications`
**Default**: `true` (enabled)
**Applies To**:
- Initial confirmation prompt (5 AM)
- Reminder (6 PM)

**Does NOT Apply To**:
- Host issue notifications (uses separate preference)

### Settings UI Location

Users manage this in:
- `/app/settings/notifications`
- "Move-In Confirmation Emails" toggle

### Implementation

The `createNotification()` function automatically checks preferences:

```typescript
await createNotification({
  userId: user.id,
  actionType: 'move_in_confirmation_prompt',
  // ... other params
});

// createNotification internally:
// 1. Creates in-app notification (always)
// 2. Checks user preference
// 3. Sends email only if preference enabled
```

---

## Host Notifications

### When Hosts Are Notified

Hosts receive notifications **ONLY** when:
- ✅ Renter reports move-in issue

Hosts **DO NOT** receive notifications when:
- ❌ Renter confirms successful move-in
- ❌ System auto-confirms move-in
- ❌ Initial prompt sent to renter
- ❌ Reminder sent to renter

### Rationale

- **Reduce noise**: Most move-ins are successful
- **Focus on problems**: Hosts only need to know about issues
- **Renter privacy**: Move-in confirmation is between renter and platform
- **Automatic processing**: Successful move-ins require no host action

### Issue Notification Content

**To**: Host
**Subject**: "Move-In Issue Reported: [Listing Title]"
**Content**:
- Renter name
- Issue description from renter
- Timestamp of report
- Next steps (support will contact both parties)

**Actions**:
- View booking details
- Contact support (if needed)
- Await support team resolution

---

## Analytics and Monitoring

### Key Metrics to Track

#### Response Rates

```typescript
// What % of renters respond?
const totalPrompts = await prisma.booking.count({
  where: { moveInPromptSentAt: { not: null } }
});

const manualConfirms = await prisma.booking.count({
  where: {
    moveInConfirmedAt: { not: null },
    moveInAutoConfirmedAt: null,
  }
});

const responseRate = (manualConfirms / totalPrompts) * 100;
// Target: > 50%
```

#### Auto-Confirm Rate

```typescript
// What % are auto-confirmed?
const totalConfirmed = await prisma.booking.count({
  where: { moveInStatus: 'confirmed' }
});

const autoConfirmed = await prisma.booking.count({
  where: { moveInAutoConfirmedAt: { not: null } }
});

const autoConfirmRate = (autoConfirmed / totalConfirmed) * 100;
// Expected: 20-50%
```

#### Issue Report Rate

```typescript
// What % report issues?
const issuesReported = await prisma.booking.count({
  where: { moveInStatus: 'issue_reported' }
});

const issueRate = (issuesReported / totalPrompts) * 100;
// Expected: < 5%
```

#### Time-to-Response

```typescript
// How long until renters respond?
const bookings = await prisma.booking.findMany({
  where: {
    moveInPromptSentAt: { not: null },
    moveInConfirmedAt: { not: null },
  },
  select: {
    moveInPromptSentAt: true,
    moveInConfirmedAt: true,
  },
});

const responseTimes = bookings.map(b =>
  (b.moveInConfirmedAt.getTime() - b.moveInPromptSentAt.getTime()) / (1000 * 60 * 60) // hours
);

const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
// Interesting to track distribution
```

### Monitoring Dashboard

Create admin dashboard at `/app/admin/move-in-analytics`:

**Widgets**:
- Response rate (last 30 days)
- Auto-confirm rate (last 30 days)
- Issue report rate (last 30 days)
- Average time to response
- Daily prompt/reminder/auto-confirm counts
- Recent issues (last 10)

---

## Related Documentation

- [Move-In Flow Overview](../move-in-flow.md)
- [Send Move-In Confirmation Prompt Cron](../cron/send-move-in-confirmation-prompt.md)
- [Send Move-In Reminder Cron](../cron/send-move-in-reminder.md)
- [Auto-Confirm Move-Ins Cron](../cron/auto-confirm-move-ins.md)
- [Payment Processing](../payment-spec.md)
- [Notification System](../../src/app/actions/notifications.ts)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-XX | Initial system documentation created | Claude |
