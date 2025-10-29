# Preview Move-In Reminders Cron Job

## Overview

**Purpose:** Previews how many move-in reminder notifications will be sent by the actual `send-move-in-reminders` cron job, without sending any actual notifications.

**Schedule:** On-demand (manual trigger) or optionally before the main job runs

**Endpoint:** `GET /api/cron/preview-move-in-reminders`

**Authentication:** Requires `CRON_SECRET` bearer token

## What It Does

This preview job:

1. **Identifies upcoming move-ins** - Finds all bookings with a move-in date exactly 3 days from today (same query as the live job)
2. **Filters active bookings** - Only counts bookings with status 'confirmed' or 'reserved'
3. **Returns preview data** - Shows count of notifications that WOULD be sent, with full booking details
4. **Does NOT send anything** - No actual notifications or emails are created

## Use Cases

### 1. Pre-Flight Check
Run this before the actual job to verify:
- How many notifications will be sent
- Which specific bookings are affected
- Renter and host details are correct
- No unexpected volume spikes

### 2. Manual Testing
Use to test the date calculation logic and database query without affecting users.

### 3. Monitoring & Alerts
Schedule this to run and alert if:
- Expected notification count is 0 (potential issue)
- Count is unusually high (investigate data)
- Unexpected bookings appear

## Response Format

### Success Response

```json
{
  "success": true,
  "timestamp": "2024-10-29T16:00:00.000Z",
  "targetMoveInDate": "Friday, November 1, 2024",
  "summary": {
    "bookingsFound": 3,
    "renterNotificationsToSend": 3,
    "hostNotificationsToSend": 3,
    "totalNotificationsToSend": 6
  },
  "bookings": [
    {
      "bookingId": "abc-123-def-456",
      "listingTitle": "Cozy Downtown Apartment",
      "listingId": "listing-789",
      "moveInDate": "Friday, November 1, 2024",
      "status": "confirmed",
      "renter": {
        "id": "user-123",
        "name": "John Smith",
        "email": "john@example.com"
      },
      "host": {
        "id": "user-456",
        "name": "Sarah Johnson",
        "email": "sarah@example.com"
      }
    },
    {
      "bookingId": "ghi-789-jkl-012",
      "listingTitle": "Beachfront Condo",
      "listingId": "listing-456",
      "moveInDate": "Friday, November 1, 2024",
      "status": "reserved",
      "renter": {
        "id": "user-789",
        "name": "Emily Davis",
        "email": "emily@example.com"
      },
      "host": {
        "id": "user-012",
        "name": "Michael Chen",
        "email": "michael@example.com"
      }
    }
  ]
}
```

### Zero Bookings Response

```json
{
  "success": true,
  "timestamp": "2024-10-29T16:00:00.000Z",
  "targetMoveInDate": "Friday, November 1, 2024",
  "summary": {
    "bookingsFound": 0,
    "renterNotificationsToSend": 0,
    "hostNotificationsToSend": 0,
    "totalNotificationsToSend": 0
  },
  "bookings": []
}
```

### Error Response

```json
{
  "success": false,
  "error": "Database connection failed",
  "timestamp": "2024-10-29T16:00:00.000Z"
}
```

## How to Use

### Manual Trigger via Admin Interface

1. Navigate to `/app/admin/cron-jobs`
2. Find "Preview Move-In Reminders" in the list
3. Click "Trigger Now"
4. Review the preview data returned

### Manual Trigger via API

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/preview-move-in-reminders
```

### Automated Pre-Flight Check

Schedule this to run 5-10 minutes before the actual job:

```bash
# In crontab: Run at 8:50 AM PT (3:50 PM UTC), 10 minutes before main job
50 15 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/preview-move-in-reminders

# Main job runs at 9:00 AM PT (4:00 PM UTC)
0 16 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/send-move-in-reminders
```

## Comparison with Live Job

### What's the Same
- ✅ Same date calculation logic (3 days from today)
- ✅ Same database query (bookings with move-in in 3 days)
- ✅ Same booking filters (confirmed/reserved status)
- ✅ Same data retrieval (renter, host, listing details)

### What's Different
- ❌ Does NOT create notifications
- ❌ Does NOT send emails
- ❌ Does NOT update database
- ✅ Returns full booking details (live job only logs summaries)
- ✅ Includes formatted move-in dates in response
- ✅ Faster execution (no notification creation overhead)

## Interpretation Guide

### Normal Response
```json
{
  "bookingsFound": 2-10,
  "totalNotificationsToSend": 4-20
}
```
**Interpretation:** Expected daily volume. No action needed.

### Zero Bookings
```json
{
  "bookingsFound": 0,
  "totalNotificationsToSend": 0
}
```
**Interpretation:** No move-ins scheduled for 3 days from now. This is normal on some days.

### High Volume
```json
{
  "bookingsFound": 50+,
  "totalNotificationsToSend": 100+
}
```
**Interpretation:** Unusual spike. Review booking details to verify data integrity.

### Mismatched Counts
If `renterNotificationsToSend` ≠ `hostNotificationsToSend`:
**Interpretation:** Potential data issue. Check if any bookings have missing renter or host data.

## Testing

### Verify Preview Matches Reality

1. Run preview job and note the count
2. Immediately run the actual job
3. Compare preview count vs. actual notifications sent
4. Counts should match exactly

### Create Test Booking

```typescript
// Create a booking with move-in in 3 days
const testBooking = await prisma.booking.create({
  data: {
    userId: 'test-renter-id',
    listingId: 'test-listing-id',
    matchId: 'test-match-id',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    monthlyRent: 2000,
    totalPrice: 2000
  }
});

// Run preview - should show 1 booking
// Clean up after testing
await prisma.booking.delete({ where: { id: testBooking.id } });
```

## Monitoring & Alerts

### Set Up Alerts For:

1. **Preview count significantly different from historical average**
   - Alert if > 2x or < 0.5x of 7-day moving average

2. **Preview shows zero for multiple consecutive days**
   - May indicate booking pipeline issue

3. **Preview returns errors**
   - Database connectivity or query issues

4. **Mismatch between preview and actual send counts**
   - Run both jobs, compare results, alert if difference > 10%

## Log Output Examples

### Successful Preview
```
👀 Starting preview-move-in-reminders cron job...
📅 Preview: Looking for bookings with move-in date: 2024-11-01T00:00:00.000Z
📦 Preview: Found 3 bookings with move-in in 3 days
✅ Preview move-in reminders completed { bookingsFound: 3, totalNotifications: 6 }
```

### Zero Bookings
```
👀 Starting preview-move-in-reminders cron job...
📅 Preview: Looking for bookings with move-in date: 2024-11-01T00:00:00.000Z
📦 Preview: Found 0 bookings with move-in in 3 days
✅ Preview move-in reminders completed { bookingsFound: 0, totalNotifications: 0 }
```

## Performance

- **Query time:** < 50ms (same as live job)
- **Total execution time:** < 200ms (no notification creation)
- **Database impact:** Read-only, minimal
- **Can run frequently:** Safe to run multiple times per day

## Benefits

### 1. Risk Mitigation
- Catch data issues before sending emails
- Verify expected volume matches reality
- Test date calculation without impact

### 2. Debugging
- Inspect exact bookings that will be affected
- Verify renter/host data is correct
- Check move-in date formatting

### 3. Confidence
- Know exactly what will happen before it happens
- Validate business logic changes
- Document expected behavior

## Related Documentation

- [Send Move-In Reminders (Live Job)](./send-move-in-reminders.md)
- [Cron Jobs Overview](../../cron.md)
- [Notification System](../notifications.md)

## Troubleshooting

### Preview Shows Different Count Than Expected

**Check:**
1. Are bookings in correct status? (confirmed/reserved only)
2. Is startDate exactly 3 days from today?
3. Are bookings being created/modified between preview and live run?

### Preview Returns Empty But You Expect Bookings

**Check:**
1. Run `SELECT * FROM Booking WHERE startDate = 'target-date' AND status IN ('confirmed', 'reserved')`
2. Verify date calculation is using Pacific timezone correctly
3. Check if bookings exist but have different status values

### Response Data Seems Incorrect

**Verify:**
1. Renter user record exists and has email
2. Host user record exists and has email
3. Listing record exists and has title
4. All foreign key relationships are valid

## Best Practices

1. **Run before deploying changes** to notification logic
2. **Compare results** between preview and actual job execution
3. **Document anomalies** when counts are unusual
4. **Use for capacity planning** to understand peak notification days
5. **Include in monitoring dashboards** to track trends

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-XX | 1.0.0 | Initial implementation |
