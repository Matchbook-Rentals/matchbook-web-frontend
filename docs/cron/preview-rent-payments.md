# Preview Rent Payments

**Endpoint:** `/api/cron/preview-rent-payments`
**Schedule:** Daily at 1:00 AM Pacific Time (8:00 AM UTC)
**Purpose:** Emails preview of tomorrow's rent payments to tyler.bennett52@gmail.com

## Description

Sends a detailed preview email showing all rent payments that will be processed the next day. Provides advance visibility for cash flow planning and issue identification.

## Business Logic

1. Query for rent payments due tomorrow
2. Gather payment details for each booking:
   - Renter information (name, email)
   - Host information (name, email)
   - Property title
   - Payment amount
   - Payment method type and last 4 digits
   - Stripe Connect account status
3. Calculate totals and breakdowns
4. Identify potential issues
5. Format and send HTML email report

## Report Contents

### Summary Section
- **Count** of payments to be processed
- **Total dollar amount** across all payments
- **Breakdown by payment method** (ACH vs Card percentages)

### Individual Payment Details
For each payment:
- Renter name and email
- Host name and email
- Property title and city
- Payment amount (formatted in USD)
- Payment method (type and last 4 digits)
- Due date

### Fee Calculations
- Service fee amount (included in payment)
- Estimated Stripe processing fees
- Net proceeds to host (after fees)

### Potential Issues
Highlights problems that need attention:
- Missing payment methods
- Disabled Stripe accounts
- Failed previous payments (high retry count)
- Unverified bank accounts

## Email Format

### HTML Styling
- **Rich formatting** with tables and summaries
- **Color-coded indicators**:
  - Green: Successful/ready to process
  - Yellow: Warnings (needs attention)
  - Red: Critical issues (will fail)
- **Responsive design** for mobile viewing

### Sections
1. **Executive Summary**: Key metrics at a glance
2. **Payments Table**: Detailed list of all due payments
3. **Issues & Actions**: Problems requiring intervention
4. **Next Steps**: Actionable items for admin

## Why This Matters

### Cash Flow Planning
- Visibility into tomorrow's incoming revenue
- Early warning for potential shortfalls
- Helps with financial forecasting

### Issue Prevention
- Identify problems before payment processing
- Time to contact users about payment method issues
- Reduce failed payment rates

### Operational Excellence
- Daily check-in on payment health
- Track payment method distribution
- Monitor host account status

## Implementation Details

**File:** `src/app/api/cron/preview-rent-payments/route.ts`

### Key Functions
- `findTomorrowPayments()`: Queries payments due tomorrow
- `gatherPaymentDetails()`: Enriches payment data with user/listing info
- `calculateSummary()`: Computes totals and breakdowns
- `identifyIssues()`: Detects potential problems
- `formatEmailReport()`: Builds HTML email
- `sendPreviewEmail()`: Sends via Resend

## Email Recipients

Currently configured to send to: `tyler.bennett52@gmail.com`

To add additional recipients, update the `to` field in the email configuration.

## Testing

Test this cron job using the admin interface:
1. Create test bookings with payments due tomorrow
2. Navigate to `/app/admin/cron-jobs`
3. Find "Preview Rent Payments"
4. Click "Trigger Now"
5. Check inbox for preview email

## Manual Trigger

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/preview-rent-payments
```

## Monitoring

- Check email inbox daily for preview
- Review identified issues before process-rent-payments runs
- Compare preview totals with actual processed amounts

## Example Email

```
Subject: Rent Payments Preview - 5 payments totaling $12,450 due tomorrow

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━
Total Payments: 5
Total Amount: $12,450
ACH Payments: 3 (60%)
Card Payments: 2 (40%)

PAYMENTS DUE TOMORROW
━━━━━━━━━━━━━━━━━━━━
[Detailed table of payments]

ISSUES & ACTIONS
━━━━━━━━━━━━━━━━━━━━
⚠️ 1 payment method missing
❌ 1 Stripe account disabled

[Detailed issue descriptions]
```

## Configuration

### Environment Variables
- `RESEND_API_KEY`: Email service API key
- `ADMIN_EMAIL`: Recipient email address (default: tyler.bennett52@gmail.com)

### Scheduling
Runs 1 hour before process-rent-payments cron to provide advance notice.

## Related Documentation

- [Process Rent Payments Cron](./process-rent-payments.md)
- [Payment System Overview](/docs/payment-spec.md)
- [Email Notifications](/docs/notifications.md)
