# Send Move-In Reminders Cron Job

## Overview

**Purpose:** Sends automated move-in reminder notifications to both renters and hosts 3 days before the scheduled move-in date.

**Schedule:** Daily at 9:00 AM Pacific Time (4:00 PM UTC)

**Endpoint:** `GET /api/cron/send-move-in-reminders`

**Authentication:** Requires `CRON_SECRET` bearer token

## What It Does

This cron job:

1. **Identifies upcoming move-ins** - Finds all bookings with a move-in date exactly 3 days from today
2. **Filters active bookings** - Only processes bookings with status 'confirmed' or 'reserved' (excludes cancelled/failed)
3. **Sends renter notifications** - Creates in-app notification and email with link to move-in instructions
4. **Sends host notifications** - Creates in-app notification and email with link to booking details
5. **Logs results** - Reports number of notifications sent and any errors

## Business Logic

### Date Calculation

- Uses Pacific timezone for consistency with business operations
- Calculates "3 days from now" as:
  - Today at midnight PT → Add 3 days → Compare against booking `startDate`
- Example: If today is March 1st, finds bookings with `startDate` = March 4th

### Booking Criteria

Bookings are included if they meet ALL criteria:
- `startDate` is exactly 3 days from today (midnight to midnight window)
- `status` is either 'confirmed' or 'reserved'
- Booking has valid renter and host relationships

### Notifications Sent

**For Renters:**
- **Type:** `move_in_upcoming`
- **Subject:** "Upcoming booking at [Listing Title]"
- **Message:** "Hi [First Name], your booking at [Listing Title] starts in 3 days. Move-in is on [Date]. See move-in instructions below."
- **Button:** "Booking details" → `/app/rent/bookings/[bookingId]/move-in/instructions`
- **Email preference:** Controlled by `UserPreferences.emailMoveInUpcomingNotifications` (default: true)

**For Hosts:**
- **Type:** `move_in_upcoming_host`
- **Subject:** "Upcoming booking for [Listing Title]"
- **Message:** "Hi [First Name], [Renter Name] is scheduled to move-in in 3 days. Move-in is on [Date]."
- **Button:** "Booking details" → `/app/host/[listingId]/bookings/[bookingId]`
- **Email preference:** Controlled by `UserPreferences.emailMoveInUpcomingNotifications` (default: true)

## Database Queries

### Main Query

```typescript
const bookings = await prisma.booking.findMany({
  where: {
    startDate: {
      gte: threeDaysFromNow,    // Start of target day
      lt: fourDaysFromNow        // End of target day
    },
    status: {
      in: ['confirmed', 'reserved']
    }
  },
  include: {
    user: {                      // Renter
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    },
    listing: {
      select: {
        id: true,
        title: true,
        user: {                  // Host
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }
  }
});
```

### Performance Notes

- Query uses index on `startDate` and `status` columns
- Typical expected volume: 0-20 bookings per day
- Query execution time: < 100ms
- Total job execution time: < 5 seconds for typical volume

## Error Handling

### Per-Booking Error Handling

The job uses graceful error handling to prevent one failure from blocking others:

```typescript
for (const booking of bookings) {
  try {
    await sendRenterNotification(booking);
    await sendHostNotification(booking);
  } catch (error) {
    // Log error but continue processing other bookings
    console.error(`Failed to process booking ${booking.id}:`, error);
    errors.push(error.message);
  }
}
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing user or listing data | Deleted user/listing | Logged but skipped; consider data integrity cleanup |
| Notification creation failed | Database connection issue | Logged; check database connectivity |
| Email send failed | Resend API issue | Logged; notification still created in-app |

## Response Format

### Success Response

```json
{
  "success": true,
  "timestamp": "2024-03-20T16:00:00.000Z",
  "bookingsProcessed": 5,
  "renterNotificationsSent": 5,
  "hostNotificationsSent": 5,
  "errors": []
}
```

### Partial Success (Some Errors)

```json
{
  "success": true,
  "timestamp": "2024-03-20T16:00:00.000Z",
  "bookingsProcessed": 5,
  "renterNotificationsSent": 4,
  "hostNotificationsSent": 4,
  "errors": [
    "Failed to process booking abc-123: User not found"
  ]
}
```

### Complete Failure

```json
{
  "success": false,
  "error": "Database connection failed",
  "timestamp": "2024-03-20T16:00:00.000Z"
}
```

## Testing

### Manual Testing via Admin Interface

1. Navigate to `/app/admin/cron-jobs`
2. Find "Send Move-In Reminders" in the list
3. Click "Trigger Now"
4. Monitor the execution results

### Manual Testing via API

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/send-move-in-reminders
```

### Setting Up Test Data

To test the job, create a booking with move-in in exactly 3 days:

```typescript
// In Prisma Studio or via script
const testBooking = await prisma.booking.create({
  data: {
    userId: 'test-renter-id',
    listingId: 'test-listing-id',
    matchId: 'test-match-id',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),  // 33 days from now
    status: 'confirmed',
    monthlyRent: 2000,
    totalPrice: 2000
  }
});
```

### Verification Checklist

After running the test:

- [ ] Check logs for successful execution
- [ ] Verify renter received in-app notification
- [ ] Verify renter received email (check spam folder)
- [ ] Verify email links to move-in instructions page
- [ ] Verify host received in-app notification
- [ ] Verify host received email
- [ ] Verify email links to booking details page
- [ ] Check that move-in date is correctly formatted
- [ ] Verify no errors in logs

## Monitoring

### What to Monitor

1. **Execution frequency** - Should run once daily at 9:00 AM PT
2. **Success rate** - Should be near 100% under normal conditions
3. **Volume trends** - Track number of bookings processed over time
4. **Error patterns** - Watch for recurring error types
5. **Email delivery** - Monitor Resend dashboard for bounces/failures

### Key Metrics

| Metric | Expected Value | Alert Threshold |
|--------|---------------|-----------------|
| Success rate | 100% | < 95% |
| Execution time | < 5 seconds | > 30 seconds |
| Bookings processed | 0-20/day | > 50/day (investigate) |
| Notifications sent | 2x bookings | < bookings (missing notifications) |

### Alert Conditions

Set up alerts for:
- Job doesn't run for 24+ hours
- Success rate drops below 95%
- Execution time exceeds 30 seconds
- More than 3 errors in a single run

## Logging

### Log Output Examples

**Successful execution:**
```
🏠 Starting send-move-in-reminders cron job...
📅 Looking for bookings with move-in date: 2024-03-23T00:00:00.000Z
📦 Found 3 bookings with move-in in 3 days
📧 Sending renter notification for booking abc-123 to renter@example.com
📧 Sending host notification for booking abc-123 to host@example.com
📧 Sending renter notification for booking def-456 to renter2@example.com
📧 Sending host notification for booking def-456 to host2@example.com
📧 Sending renter notification for booking ghi-789 to renter3@example.com
📧 Sending host notification for booking ghi-789 to host3@example.com
✅ Move-in reminders cron job completed successfully {
  bookingsProcessed: 3,
  renterNotificationsSent: 3,
  hostNotificationsSent: 3,
  errors: []
}
```

**With errors:**
```
🏠 Starting send-move-in-reminders cron job...
📅 Looking for bookings with move-in date: 2024-03-23T00:00:00.000Z
📦 Found 2 bookings with move-in in 3 days
📧 Sending renter notification for booking abc-123 to renter@example.com
📧 Sending host notification for booking abc-123 to host@example.com
❌ Failed to send host notification for booking def-456: User not found
✅ Move-in reminders cron job completed successfully {
  bookingsProcessed: 2,
  renterNotificationsSent: 2,
  hostNotificationsSent: 1,
  errors: ['Failed to process booking def-456: Host user not found']
}
```

## Scheduling

### Recommended Schedule

**Time:** Daily at 9:00 AM Pacific Time (4:00 PM UTC)

**Reasoning:**
- Morning notification gives users full day to prepare
- Not too early (avoid disturbing sleep)
- Aligns with typical business hours
- Before typical end-of-day activities

### Setting Up Schedule

#### GitHub Actions

Add to `.github/workflows/cron.yml`:

```yaml
- cron: '0 16 * * *'  # 9 AM PT (4 PM UTC)
```

Then add to job steps:

```yaml
- name: Send Move-In Reminders
  run: |
    curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
      https://your-domain.com/api/cron/send-move-in-reminders
```

#### cron-job.org

1. Go to cron-job.org
2. Create new job
3. URL: `https://your-domain.com/api/cron/send-move-in-reminders`
4. Schedule: Daily at 16:00 UTC
5. Add header: `Authorization: Bearer [CRON_SECRET]`

#### Server Crontab

```bash
# Send move-in reminders daily at 9 AM Pacific (4 PM UTC)
0 16 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/send-move-in-reminders
```

## Related Documentation

- [Notification System](../notifications.md)
- [Email Templates](../email-templates.md)
- [Booking Flow](../booking-flow.md)
- [Cron Jobs Overview](../../cron.md)
- [Admin Cron Interface](../admin/cron-jobs.md)

## Troubleshooting

### No Notifications Sent

**Possible causes:**
1. No bookings with move-in exactly 3 days away
2. All bookings are cancelled or failed status
3. Database query not finding records

**Solutions:**
- Check database for bookings with startDate = today + 3 days
- Verify booking status values
- Check logs for query execution details

### Notifications Sent But Emails Not Received

**Possible causes:**
1. User disabled email notifications in preferences
2. Resend API issue or rate limit
3. Email bounced or marked as spam

**Solutions:**
- Check UserPreferences.emailMoveInUpcomingNotifications
- Check Resend dashboard for delivery status
- Verify email addresses are valid

### Partial Failures

**Possible causes:**
1. Missing or deleted user/listing data
2. Database connection intermittent
3. Notification service temporary issue

**Solutions:**
- Review error logs for specific failures
- Check data integrity for affected bookings
- Retry failed bookings manually if needed

## Future Enhancements

Potential improvements to consider:

1. **Configurable timing** - Allow admins to change from 3 days to N days
2. **Retry logic** - Automatically retry failed notifications
3. **Idempotency** - Track which bookings already received reminders to prevent duplicates
4. **SMS notifications** - Add optional SMS for critical move-in reminders
5. **Localization** - Support multiple languages for international users
6. **Time zone handling** - Send at 9 AM in user's local timezone (not just Pacific)

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-XX | 1.0.0 | Initial implementation |
