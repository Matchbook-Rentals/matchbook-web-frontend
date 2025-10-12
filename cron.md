# Matchbook Cron Jobs Documentation

This document outlines all cron jobs available in the Matchbook system. These jobs are designed to run at specific intervals to automate various platform operations.

## Overview

All cron jobs are implemented as API routes under `/api/cron/` and require authorization using the `CRON_SECRET` environment variable. Jobs can be triggered manually through the admin interface or via external scheduling services.

## Available Cron Jobs

### 1. Check Unread Messages

**Endpoint:** `/api/cron/check-unread-messages`
**Schedule:** Daily at midnight UTC
**Purpose:** Creates notifications for unread messages older than 2 minutes

#### Description
This job finds messages that are unread and haven't had notifications sent yet. It creates both in-app notifications and sends email alerts to recipients.

#### Business Logic
- Finds messages older than 2 minutes that are unread
- Creates notifications for each recipient (excluding the sender)
- Sends email notifications using the configured email service
- Marks messages as having notifications sent

---

### 2. Process Rent Payments

**Endpoint:** `/api/cron/process-rent-payments`
**Schedule:** Daily at 1:00 AM Pacific Time (8:00 AM UTC)
**Purpose:** Processes all rent payments due today

#### Description
Automatically charges renters and transfers funds to hosts for rent payments due today. This is the core payment processing system for recurring rent payments.

#### Business Logic
1. **Find Due Payments**: Identifies rent payments where `dueDate` is today (UTC calendar date)
2. **Payment Processing**: Creates Stripe PaymentIntents with automatic capture
3. **Fund Transfer**: Transfers full amount to host's Stripe Connect account
4. **Record Keeping**: Updates payment status and creates transaction records
5. **Notifications**: Sends email notifications for success/failure
6. **Error Handling**: Implements retry logic (max 3 attempts)

#### Fee Structure
- **Service fees** (3% for trips ≤6 months, 1.5% for trips >6 months) are already included in the payment amount
- **Full amount** including service fee is transferred to host
- Stripe processing fees are automatically deducted by Stripe
- Platform revenue comes from the $7 deposit transfer fee collected at booking time

#### Safety Features
- Idempotency checks to prevent duplicate processing
- Maximum retry attempts to handle temporary failures
- Comprehensive logging for audit and debugging
- Graceful handling of invalid payment methods

---

### 3. Preview Rent Payments

**Endpoint:** `/api/cron/preview-rent-payments`
**Schedule:** Daily at 1:00 AM Pacific Time (8:00 AM UTC)
**Purpose:** Emails preview of tomorrow's rent payments to tyler.bennett52@gmail.com

#### Description
Sends a detailed preview email showing all rent payments that will be processed the next day. Provides advance visibility for cash flow planning and issue identification.

#### Report Contents
- Count of payments to be processed
- Total dollar amount across all payments
- Breakdown by payment method type (ACH vs Card)
- Individual payment details (renter, host, property, amount)
- Fee calculations and net proceeds
- Potential issues (missing payment methods, disabled accounts)

#### Email Format
- Rich HTML formatting with tables and summaries
- Color-coded status indicators
- Actionable insights and next steps
- Issue highlighting for items requiring attention

---

## Authorization

All cron jobs require proper authorization using the `CRON_SECRET` environment variable:

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/job-name
```

## Manual Triggering

### Admin Interface
Navigate to `/app/admin/cron-jobs` to manually trigger any cron job. This interface is restricted to admin users and provides:
- List of all available cron jobs
- Manual trigger buttons
- Execution status and results
- Execution time tracking

### Direct API Calls
You can trigger cron jobs directly via HTTP GET requests:

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
```

## External Scheduling Options

Since Vercel cron scheduling is not used, you can set up external scheduling services:

### 1. GitHub Actions
Create a workflow file (`.github/workflows/cron.yml`):

```yaml
name: Cron Jobs
on:
  schedule:
    # Run payment jobs at 1 AM Pacific (8 AM UTC)
    - cron: '0 8 * * *'
    # Run message check at midnight UTC
    - cron: '0 0 * * *'

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
```

### 2. External Cron Services
- **cron-job.org**: Free web-based cron service
- **EasyCron**: Paid service with advanced features
- **Cronhooks**: Simple webhook-based cron service

### 3. Server-Side Cron
If you have your own server, add to crontab:

```bash
# Process rent payments daily at 1 AM Pacific
0 8 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/process-rent-payments

# Preview rent payments daily at 1 AM Pacific
0 8 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/preview-rent-payments

# Check unread messages daily at midnight UTC
0 0 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/check-unread-messages
```

## Monitoring and Logging

All cron jobs include comprehensive logging:
- Execution start/end times
- Number of items processed
- Success/failure counts
- Error messages and stack traces
- Performance metrics

Monitor execution through:
- Application logs
- Admin cron jobs interface
- Email notifications (for payment jobs)
- Stripe dashboard (for payment processing)

## Error Handling

Each cron job implements robust error handling:
- **Graceful degradation**: Partial failures don't stop entire job execution
- **Retry logic**: Automatic retries for transient failures
- **Error notifications**: Admin alerts for critical failures
- **Detailed logging**: Full context for debugging

## Environment Variables

Required environment variables:
- `CRON_SECRET`: Authorization secret for cron job endpoints
- `RESEND_API_KEY`: Email service API key for notifications
- `STRIPE_SECRET_KEY`: Stripe API key for payment processing
- `DATABASE_URL`: Database connection string

## Security Considerations

- All endpoints require proper authorization
- Secrets are never logged or exposed
- Payment processing uses Stripe's secure APIs
- Idempotency keys prevent duplicate operations
- Rate limiting protects against abuse

## Testing

Test cron jobs safely using the admin interface:
1. Navigate to `/app/admin/cron-jobs`
2. Select the job to test
3. Click "Trigger Now"
4. Monitor execution results
5. Check logs for detailed output

Always test in a development environment before deploying to production.