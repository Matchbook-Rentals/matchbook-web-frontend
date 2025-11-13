# Accio Data Webhook Setup Guide

This guide walks you through configuring the webhook endpoint for receiving background check results from Accio Data (Global Background Screening).

## Overview

The Matchbook verification system uses Accio Data to perform comprehensive background checks (National Criminal Search and Eviction Search). This webhook receives asynchronous results from Accio Data.

When Accio Data finishes processing a background check, they will POST the results as XML to your configured webhook endpoint.

**Cost Optimization Opportunity:**
- Current: Accio Data is called immediately for all verifications (~$15-25 per request)
- Proposed: Check iSoftPull credit first (free rejections), then only call Accio Data for qualified applicants
- See [Verification Flow Documentation](./verification-flow.md) for details on the proposed two-tier approach

## Prerequisites

Before configuring the webhook, ensure you have:

1. ✅ Active Accio Data account
2. ✅ Account credentials (account ID, username, password)
3. ✅ Production domain with SSL/HTTPS enabled
4. ✅ Webhook endpoint deployed and accessible
5. ✅ Database tables created (BGSReport, Purchase)

## Step 1: Configure Environment Variables

Add these variables to your production environment (`.env` file):

```bash
# Accio Data API Credentials
ACCIO_ACCOUNT=your_account_id_here
ACCIO_USERNAME=your_api_username_here
ACCIO_PASSWORD=your_api_password_here

# Base URL for webhook callbacks (must be HTTPS production URL)
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

**How to get credentials:**
- Contact your Accio Data account representative
- Or find them in the Accio Data dashboard under "API Settings" or "Integration Settings"

**IMPORTANT: `NEXT_PUBLIC_BASE_URL`**
- This is used to construct the webhook URL in each order
- Must be your production HTTPS URL (e.g., `https://matchbookrentals.com`)
- Do NOT include trailing slash
- Do NOT use localhost or development URLs in production

**Security Notes:**
- Never commit these credentials to git
- Use different credentials for staging/production
- Store securely in your deployment platform (Vercel, AWS, etc.)

## Step 2: Determine Your Webhook URL

Your webhook endpoint is already implemented at:

```
POST /api/background-check-webhook
```

**Production URL format:**
```
https://your-production-domain.com/api/background-check-webhook
```

**Examples:**
- `https://matchbookrentals.com/api/background-check-webhook`
- `https://app.matchbookrentals.com/api/background-check-webhook`
- `https://www.matchbookrentals.com/api/background-check-webhook`

**Important:**
- Must use HTTPS (not HTTP)
- Must be publicly accessible (not localhost or behind firewall)
- Should point to your production environment

## Step 3: Configure Webhook Delivery

There are **two ways** to configure where Accio Data sends completed results:

### Option A: Per-Order URL (Recommended - Already Implemented!)

Your system already includes the webhook URL in each order XML via the `<postURL>` element. This means **each order automatically tells Accio Data where to send results**.

**Benefits:**
- No dashboard configuration needed
- Works immediately
- More flexible (can use different URLs per environment)
- Already implemented in your code

**How it works:**
```xml
<New_Order>
  <login>...</login>
  <postURL>https://your-domain.com/api/background-check-webhook</postURL>
  <placeOrder>...</placeOrder>
</New_Order>
```

The URL is automatically constructed from `NEXT_PUBLIC_BASE_URL` environment variable.

### Option B: Global Dashboard Configuration (Optional Backup)

You can also configure a global webhook URL in the Accio Data dashboard as a fallback.

**To configure:**
1. Log into your Accio Data account
2. Navigate to "XML Post Results Credentials" or "Webhook Settings"
3. Enter the Post URL:
   ```
   https://your-production-domain.com/api/background-check-webhook
   ```
4. Set Content Type: `text/xml`
5. Set HTTP Method: `POST`
6. Configure triggers: Send when order is complete
7. Save configuration

**Note:** The per-order URL (Option A) takes precedence over the global configuration.

## Step 4: Test the Webhook

### A. Verify Endpoint Accessibility

Test that your webhook endpoint is publicly accessible:

```bash
# Test GET request (should return endpoint info)
curl https://your-domain.com/api/background-check-webhook

# Expected response:
{
  "message": "Background check webhook endpoint is active",
  "endpoint": "/api/background-check-webhook",
  "method": "POST",
  "contentType": "text/xml"
}
```

### B. Submit Test Order

1. Navigate to your verification page: `/app/rent/verification`
2. Complete the form with test data (use test SSN from Accio Data)
3. Submit the background check
4. Note the Order ID returned

**Check Database:**
```sql
-- Verify BGSReport was created with 'pending' status
SELECT id, orderId, status, createdAt
FROM BGSReport
WHERE orderId = 'MBWEB-12345678';
```

### C. Monitor Webhook Logs

Check your application logs for webhook activity:

**Successful Webhook Receipt:**
```
🔔 [Background Check Webhook] Received webhook request
📦 [Background Check Webhook] Raw XML payload: <?xml version...
📏 [Background Check Webhook] XML length: 2847 characters
🔍 [Background Check Webhook] Parsing XML...
✅ [Background Check Webhook] XML parsed successfully
🔑 [Background Check Webhook] Extracted order ID: MBWEB-12345678
🔍 [Background Check Webhook] Looking up BGS report for order: MBWEB-12345678
✅ [Background Check Webhook] Found BGS report: {...}
💾 [Background Check Webhook] Updating BGS report status to completed...
✅ [Background Check Webhook] Updated BGS report for order MBWEB-12345678
✅ [Background Check Webhook] Webhook processed successfully
⏱️ [Background Check Webhook] Processing time: 142 ms
```

**Check Database Again:**
```sql
-- Verify BGSReport was updated to 'completed'
SELECT id, orderId, status, receivedAt, reportData
FROM BGSReport
WHERE orderId = 'MBWEB-12345678';
```

### D. Use Admin Testing Tool

Use the built-in testing tool at:
```
/admin/test/webhook
```

This allows you to:
- Submit sample XML payloads
- Simulate Accio Data webhook calls
- Test database updates
- View response handling

## Step 5: Verify Response Format

Accio Data expects a specific response format after posting results.

**Your Webhook Must Respond With:**
```xml
<XML>Accepted</XML>
```

**This is already implemented** in `route.ts:119-123`:
```typescript
return NextResponse.json({
  success: true,
  message: "Background check results received and processed",
  orderId: orderId
});
```

**Important:**
- If Accio Data receives too many error responses, they may stop sending webhooks
- Always respond with success after processing (even if there are minor issues)
- Log errors internally but respond with success to Accio Data

## Expected XML Structure from Accio Data

Your webhook endpoint expects XML in this general structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <login>
    <account>YOUR_ACCOUNT</account>
    <username>YOUR_USERNAME</username>
    <password>YOUR_PASSWORD</password>
  </login>
  <completeOrder>
    <order orderID="MBWEB-12345678">
      <subject>
        <name_first>John</name_first>
        <name_last>Doe</name_last>
        <ssn>123456789</ssn>
        <dob>19900515</dob>
      </subject>
      <components>
        <component>
          <type>National Criminal Search</type>
          <status>Complete</status>
          <results>
            <!-- Criminal records data -->
          </results>
        </component>
        <component>
          <type>Eviction Search</type>
          <status>Complete</status>
          <results>
            <!-- Eviction records data -->
          </results>
        </component>
      </components>
    </order>
  </completeOrder>
</XML>
```

**Key Fields Extracted:**
- `orderID` - Used to match BGSReport in database
- Full XML structure - Stored in `reportData` JSON field

## Troubleshooting

### Problem: Webhook Not Receiving Requests

**Check:**
1. Is the webhook URL correctly configured in Accio Data dashboard?
2. Is your production server running and accessible?
3. Is HTTPS properly configured with valid SSL certificate?
4. Are there firewall rules blocking incoming requests?

**Test:**
```bash
# Test from external server (not localhost)
curl -X POST https://your-domain.com/api/background-check-webhook \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?><XML><test>data</test></XML>'
```

### Problem: Order ID Not Found in Database

**Check:**
1. Was the order successfully submitted to Accio Data?
2. Was BGSReport created when order was placed?
3. Does the order ID in webhook match database exactly?

**Debug:**
```sql
-- List all pending reports
SELECT orderId, status, createdAt
FROM BGSReport
WHERE status = 'pending'
ORDER BY createdAt DESC;
```

### Problem: XML Parsing Errors

**Check:**
1. Is the XML well-formed (no syntax errors)?
2. Does the structure match expected format?
3. Are there unexpected namespaces or attributes?

**Debug:**
- Review webhook logs for raw XML payload
- Copy XML to validator: https://www.xmlvalidation.com/
- Test with sample XML from Accio Data documentation

### Problem: Database Update Fails

**Check:**
1. Are database credentials correct?
2. Does the BGSReport exist with matching order ID?
3. Are there database connection issues?

**Debug:**
```bash
# Check Prisma connection
npx prisma db push

# View database directly
npx prisma studio
```

### Problem: Accio Data Stops Sending Webhooks

**Possible Causes:**
- Too many failed webhook attempts (returning errors)
- Timeout issues (webhook taking too long to respond)
- SSL certificate expired or invalid

**Solution:**
1. Check Accio Data dashboard for webhook delivery logs
2. Verify webhook responds within 30 seconds
3. Ensure webhook returns success status
4. Contact Accio Data support to re-enable webhook delivery

## Security Considerations

### 1. Validate Order IDs

The webhook validates that:
- Order ID exists in the database
- Order belongs to a legitimate user
- Order status is 'pending' (not already completed)

**Implementation:** `route.ts:56-75`

### 2. HTTPS Required

Always use HTTPS to ensure:
- Data encryption in transit
- Protection against man-in-the-middle attacks
- Compliance with data privacy regulations

### 3. Rate Limiting (Optional)

Consider adding rate limiting to prevent abuse:
```typescript
// Example: Limit to 100 requests per IP per hour
import rateLimit from 'express-rate-limit';
```

### 4. Webhook Signature Verification (Advanced)

If Accio Data supports webhook signatures:
1. Request signature secret from Accio Data
2. Verify HMAC signature on each request
3. Reject requests with invalid signatures

## Monitoring & Logging

### What to Monitor

1. **Webhook Success Rate**
   - Track successful vs. failed webhook receipts
   - Alert if failure rate exceeds 5%

2. **Processing Time**
   - Monitor webhook processing duration
   - Alert if processing exceeds 30 seconds

3. **Database Updates**
   - Track BGSReport status transitions
   - Alert on stuck 'pending' reports

### Log Retention

**Current Logging:**
- All webhook requests logged with full details
- XML payloads truncated to first 1000 characters
- Processing time tracked for each request

**Recommended:**
- Keep webhook logs for 90 days minimum
- Archive logs for compliance purposes
- Use structured logging for better analysis

## Alternative: Manual Result Retrieval

If webhook delivery fails, you can manually retrieve results:

**Endpoint:** `/api/retrieve-order-results`

**Usage:**
```bash
curl "https://your-domain.com/api/retrieve-order-results?orderId=MBWEB-12345678"
```

**When to Use:**
- Webhook delivery fails
- Testing/debugging purposes
- One-time result retrieval
- Webhook not yet configured

**Implementation:** `src/app/api/retrieve-order-results/route.ts`

## Production Checklist

Before going live, verify:

- [ ] Environment variables set in production
- [ ] Webhook URL configured in Accio Data dashboard
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database tables created and accessible
- [ ] Test order submitted successfully
- [ ] Webhook received and processed test results
- [ ] BGSReport updated from 'pending' to 'completed'
- [ ] Application logs show webhook activity
- [ ] Error handling tested with invalid XML
- [ ] Monitoring/alerting configured
- [ ] Documentation updated with production URLs

## Support Contacts

**Accio Data Support:**
- Email: support@acciodata.com
- Phone: [Find in Accio Data dashboard]
- Documentation: Refer to PDFs in `/docs/verificaiton/`

**Internal Team:**
- Check application logs first
- Review database state with Prisma Studio
- Use admin testing tool for debugging
- Escalate persistent issues to DevOps

## Related Documentation

- **Verification System Overview:** `/docs/verification.md`
- **Webhook Endpoint Code:** `/src/app/api/background-check-webhook/route.ts`
- **Order Submission Code:** `/src/app/api/background-check/route.ts`
- **Testing Tool:** `/src/app/admin/test/webhook/page.tsx`

## Changelog

**2025-11-04:**
- Initial webhook setup guide created
- Added troubleshooting section
- Included production checklist

---

**Need Help?** Review the logs, test with sample data, or contact Accio Data support for webhook configuration assistance.
