# Matchbook Cron Jobs

This document provides an index of all cron jobs in the Matchbook system. For detailed documentation on each job, follow the links below.

## Overview

All cron jobs are implemented as API routes under `/api/cron/` and require authorization using the `CRON_SECRET` environment variable. Jobs can be triggered manually through the admin interface at `/app/admin/cron-jobs` or via external scheduling services.

## Available Cron Jobs

| Job | Schedule | Purpose | Documentation |
|-----|----------|---------|---------------|
| **Check Unread Messages** | Daily at midnight UTC | Creates notifications for unread messages older than 2 minutes | [Details](./docs/cron/check-unread-messages.md) |
| **Process Rent Payments** | Daily at 1:00 AM PT (8:00 AM UTC) | Processes all rent payments due today and transfers funds to hosts | [Details](./docs/cron/process-rent-payments.md) |
| **Preview Rent Payments** | Daily at 1:00 AM PT (8:00 AM UTC) | Emails preview of tomorrow's rent payments to admin | [Details](./docs/cron/preview-rent-payments.md) |
| **Roll Search Dates** | Daily (recommended early morning) | Expires outdated items and rolls search dates forward | [Details](./docs/cron/roll-search-dates.md) |
| **Send Move-In Reminders** | Daily at 9:00 AM PT (4:00 PM UTC) | Sends move-in reminders to renters and hosts 3 days before move-in | [Details](./docs/cron/send-move-in-reminders.md) |
| **Preview Move-In Reminders** | On-demand or before main job | Previews how many move-in notifications will be sent without sending them | [Details](./docs/cron/preview-move-in-reminders.md) |

## Quick Start

### Manual Triggering via Admin Interface

1. Navigate to `/app/admin/cron-jobs`
2. Select the job to trigger
3. Click "Trigger Now"
4. Monitor execution results

### Manual Triggering via API

All cron jobs use GET requests with bearer token authentication:

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/[job-name]
```

**Examples:**
```bash
# Check unread messages
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/check-unread-messages

# Process rent payments
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/process-rent-payments

# Preview rent payments
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/preview-rent-payments

# Roll search dates
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/roll-search-dates

# Send move-in reminders
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/send-move-in-reminders

# Preview move-in reminders
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/preview-move-in-reminders
```

## External Scheduling

Since Vercel cron scheduling is not used, set up external scheduling:

### Option 1: GitHub Actions

Create `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs
on:
  schedule:
    - cron: '0 8 * * *'  # Payment jobs at 1 AM PT
    - cron: '0 0 * * *'  # Message checks at midnight UTC
    - cron: '0 2 * * *'  # Search date rolling at 2 AM UTC
    - cron: '0 16 * * *'  # Move-in reminders at 9 AM PT (4 PM UTC)

jobs:
  run-crons:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron Jobs
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/check-unread-messages
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/process-rent-payments
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/preview-rent-payments
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/roll-search-dates
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/send-move-in-reminders
```

### Option 2: External Cron Services

- **cron-job.org**: Free web-based cron service
- **EasyCron**: Paid service with advanced features
- **Cronhooks**: Simple webhook-based cron service

### Option 3: Server-Side Cron

Add to your server's crontab:

```bash
# Process rent payments daily at 1 AM Pacific (8 AM UTC)
0 8 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/process-rent-payments

# Preview rent payments daily at 1 AM Pacific (8 AM UTC)
0 8 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/preview-rent-payments

# Check unread messages daily at midnight UTC
0 0 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/check-unread-messages

# Roll search dates daily at 2 AM UTC
0 2 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/roll-search-dates

# Send move-in reminders daily at 9 AM Pacific (4 PM UTC)
0 16 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/send-move-in-reminders
```

## Monitoring & Logging

All cron jobs include comprehensive logging:
- Execution start/end times
- Number of items processed
- Success/failure counts
- Error messages and stack traces
- Performance metrics

**Monitor through:**
- Application logs
- Admin cron jobs interface (`/app/admin/cron-jobs`)
- Email notifications (for payment jobs)
- Stripe dashboard (for payment processing)

## Error Handling

Each cron job implements robust error handling:
- **Graceful degradation**: Partial failures don't stop entire job
- **Retry logic**: Automatic retries for transient failures
- **Error notifications**: Admin alerts for critical failures
- **Detailed logging**: Full context for debugging

## Environment Variables

Required environment variables:
- `CRON_SECRET`: Authorization secret for cron job endpoints
- `RESEND_API_KEY`: Email service API key for notifications
- `STRIPE_SECRET_KEY`: Stripe API key for payment processing
- `DATABASE_URL`: Database connection string

## Security

- All endpoints require bearer token authorization
- Secrets are never logged or exposed
- Payment processing uses Stripe's secure APIs
- Idempotency keys prevent duplicate operations
- Rate limiting protects against abuse

## Testing

**Always test in development environment first!**

1. Navigate to `/app/admin/cron-jobs`
2. Select the job to test
3. Click "Trigger Now"
4. Monitor execution results
5. Check logs for detailed output

**For payment jobs**: Only use test Stripe keys and test payment methods.

## Related Documentation

- [Payment System Overview](./docs/payment-spec.md)
- [Stripe Webhooks](./docs/webhooks/stripe.md)
- [Notification System](./docs/notifications.md)
- [Admin Interface](./docs/admin.md)
