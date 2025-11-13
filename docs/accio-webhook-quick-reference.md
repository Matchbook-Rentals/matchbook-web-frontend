# Accio Data Webhook - Quick Reference

Quick reference for configuring and testing the background check webhook endpoint.

## Webhook URL Configuration

Your webhook URL is **automatically included in each order XML** via the `<postURL>` element:

```
https://your-production-domain.com/api/background-check-webhook
```

The URL is constructed from the `NEXT_PUBLIC_BASE_URL` environment variable.

**No dashboard configuration needed!** Each order tells Accio Data where to send results.

## Environment Variables

Add to `.env` (production) or `.env.local` (development):

```bash
ACCIO_ACCOUNT=your_account_id
ACCIO_USERNAME=your_api_username
ACCIO_PASSWORD=your_api_password
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

**Important:** `NEXT_PUBLIC_BASE_URL` is used to build the webhook URL in each order XML.

## Testing Tools

### Admin Webhook Tester
```
/admin/test/background-check-webhook
```

Features:
- Send sample XML payloads
- Simulate Accio Data POST requests
- Check database records
- View real-time responses

### API Check Endpoint
```
GET /api/admin/check-bgs-report?orderId=MBWEB-12345678
```

Returns BGSReport details, status, and report data.

## Expected Webhook Flow

**Current Implementation:**

1. **User submits verification form** → Payment processed
2. **Accio Data order submitted** → Creates BGSReport with `status: 'pending'`
3. **Accio Data processes** → Background check performed (minutes to hours)
4. **Accio Data POSTs results** → XML sent to webhook endpoint
5. **Webhook updates database** → BGSReport status changed to `'completed'`

**Proposed Two-Tier Approach (Not Yet Implemented):**

1. **User submits verification form** → Payment processed
2. **iSoftPull credit check (FIRST)** → Soft pull, instant results
   - ❌ FAIL → Stop, no Accio charge (saves ~$15-25)
   - ✅ PASS → Continue to step 3
3. **Accio Data order submitted** → Creates BGSReport with `status: 'pending'`
4. **Accio Data processes** → Background check performed (minutes to hours)
5. **Accio Data POSTs results** → XML sent to webhook endpoint
6. **Webhook updates database** → BGSReport status changed to `'completed'`

See [Verification Flow Documentation](./verification-flow.md) for implementation details.

## Sample XML Structure

### Clean Record (No Criminal/Eviction)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <completeOrder>
    <order orderID="MBWEB-12345678">
      <subject>
        <name_first>John</name_first>
        <name_last>Doe</name_last>
      </subject>
      <components>
        <component>
          <type>National Criminal Search</type>
          <status>Complete</status>
          <results>
            <record>
              <offense>No Records Found</offense>
              <status>Clear</status>
            </record>
          </results>
        </component>
        <component>
          <type>Eviction Search</type>
          <status>Complete</status>
          <results>
            <record>
              <type>No Records Found</type>
              <status>Clear</status>
            </record>
          </results>
        </component>
      </components>
    </order>
  </completeOrder>
</XML>
```

## Database Tables

### BGSReport
```typescript
{
  id: string          // Primary key
  orderId: string     // "MBWEB-12345678" (unique)
  status: string      // "pending" | "completed"
  reportData: JSON    // Full XML/JSON from Accio Data
  receivedAt: Date    // When webhook was received
  purchaseId: string  // Link to Purchase
  userId: string      // Link to User
}
```

### Purchase
```typescript
{
  id: string          // Primary key
  type: string        // "matchbookVerification"
  amount: number      // 25.00
  status: string      // "completed"
  redeemed: boolean   // false → true when verification submitted
  orderId: string     // Order ID from Accio Data
}
```

## Response Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | BGSReport updated, data stored |
| 400 | Bad Request | XML malformed or order ID missing |
| 404 | Not Found | No BGSReport exists with that order ID |
| 500 | Server Error | Database or parsing error |

## Webhook Response Format

**Success (200):**
```json
{
  "success": true,
  "message": "Background check results received and processed",
  "orderId": "MBWEB-12345678",
  "requestId": "webhook-1234567890-abc123",
  "processingTimeMs": 142
}
```

**Error (400/404/500):**
```json
{
  "error": "Error description",
  "details": "Detailed error message",
  "orderId": "MBWEB-12345678",
  "requestId": "webhook-1234567890-abc123"
}
```

## Checking Webhook Logs

All webhook requests generate detailed logs with unique request IDs:

```
🔔 [Background Check Webhook] [webhook-xxx] Received webhook request
📦 [Background Check Webhook] [webhook-xxx] Raw XML payload: ...
🔑 [Background Check Webhook] [webhook-xxx] Extracted order ID: MBWEB-12345678
✅ [Background Check Webhook] [webhook-xxx] Found BGS report: {...}
💾 [Background Check Webhook] [webhook-xxx] Updating BGS report...
✅ [Background Check Webhook] [webhook-xxx] Webhook processed successfully
⏱️ [Background Check Webhook] [webhook-xxx] Processing time: 142 ms
```

Use the request ID to trace specific webhook calls through your logs.

## Testing Checklist

- [ ] Environment variables set
- [ ] Webhook URL configured in Accio Data
- [ ] Test order created (BGSReport with status='pending')
- [ ] Sample XML sent via admin tool
- [ ] Database updated (status='completed')
- [ ] reportData field populated
- [ ] receivedAt timestamp set
- [ ] Logs show successful processing

## Common Issues

### "No BGS report found for this order ID"
- Create a BGSReport with matching order ID first
- Ensure order ID in XML matches database exactly
- Check Prisma Studio to verify record exists

### "Order ID not found in XML response"
- Verify XML structure matches expected format
- Check for typos in orderID attribute
- Review webhook logs for parsed XML structure

### Webhook not receiving requests
- Verify URL is publicly accessible (not localhost)
- Check HTTPS is properly configured
- Test with curl from external server
- Review Accio Data dashboard for delivery logs

## File Locations

| File | Purpose |
|------|---------|
| `/src/app/api/background-check-webhook/route.ts` | Webhook endpoint |
| `/src/app/api/admin/check-bgs-report/route.ts` | Admin check endpoint |
| `/src/app/admin/test/background-check-webhook/page.tsx` | Testing tool UI |
| `/docs/accio-data-webhook-setup.md` | Full setup guide |
| `/docs/verification.md` | Complete verification system docs |

## Quick Commands

### Check database directly
```bash
npx prisma studio
# Navigate to BGSReport table
# Filter by orderId or status
```

### Test webhook from command line
```bash
curl -X POST https://your-domain.com/api/background-check-webhook \
  -H "Content-Type: text/xml" \
  -d @sample-webhook.xml
```

### Check specific order
```bash
curl "https://your-domain.com/api/admin/check-bgs-report?orderId=MBWEB-12345678"
```

## Support

**Need help?**
1. Check webhook logs for request ID
2. Use admin testing tool to simulate requests
3. Review full setup guide: `/docs/accio-data-webhook-setup.md`
4. Contact Accio Data support for webhook configuration

---

**Last Updated:** 2025-11-04
