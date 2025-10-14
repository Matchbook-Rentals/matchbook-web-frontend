# Check Unread Messages

**Endpoint:** `/api/cron/check-unread-messages`
**Schedule:** Daily at midnight UTC
**Purpose:** Creates notifications for unread messages older than 2 minutes

## Description

This job finds messages that are unread and haven't had notifications sent yet. It creates both in-app notifications and sends email alerts to recipients.

## Business Logic

1. Finds messages older than 2 minutes that are unread
2. Creates notifications for each recipient (excluding the sender)
3. Sends email notifications using the configured email service
4. Marks messages as having notifications sent

## Why 2 Minutes?

The 2-minute delay prevents notification spam when users are actively messaging back and forth. If a recipient sees and responds to a message within 2 minutes, no notification is sent.

## Notification Behavior

- **In-App Notifications**: Created immediately for all recipients
- **Email Notifications**: Respects user preferences (`emailNewMessageNotifications`)
- **Sender Excluded**: The message sender never receives notifications about their own messages

## Implementation Details

**File:** `src/app/api/cron/check-unread-messages/route.ts`

### Key Functions
- Queries for messages older than 2 minutes where `notificationSentAt` is null
- Filters to only include unread messages
- Creates one notification per recipient per message
- Updates message record with `notificationSentAt` timestamp

## Testing

Test this cron job using the admin interface:
1. Navigate to `/app/admin/cron-jobs`
2. Find "Check Unread Messages"
3. Click "Trigger Now"
4. Monitor execution results

## Manual Trigger

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/check-unread-messages
```

## Related Documentation

- [Notification System](/docs/notifications.md)
- [Message System](/docs/messages.md)
