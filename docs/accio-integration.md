# Accio Data Integration Guide

This document covers the Accio Data (Global Background Screening) integration for criminal and eviction background checks.

## Overview

Accio Data provides:
- **National Criminal Database Search** - Criminal history check
- **Eviction Search** - Eviction records lookup

## Our Package

We use the **"Criminal and Evictions"** package which includes:
- National Criminal Database search
- Nationwide Eviction search

**Important:** We do NOT order county-level searches a la carte. County searches are only triggered automatically by Accio when their QA team finds reportable records in the National Criminal Database that require county-level verification.

## How It Works

### Flow

```
1. Submit Order → Accio starts processing
2. Initial Response → Order ID returned, status: "pending"
3. Wait for Webhook → Results arrive asynchronously
4. Webhook Received → BGSReport updated to "completed"
```

### Important Notes

- **Clear results**: Return almost instantly
- **Possible records**: Routed to QA queue for FCRA compliance review (can take hours/days)
- **National Criminal Database**: Always returns "Clear" in final results (FCRA compliance)
- **County searches**: We do NOT order these directly. They are triggered automatically by Accio when records are found and require verification ($6.99/county, billed by Accio)

### Criminal Check Process

1. **National Criminal DB** → Quick scan, returns "Clear" or routes to QA
2. **County-Level Search** → Only triggered by Accio if records found (we don't order these)

## Test Clients

Use these test individuals to verify the integration:

### Eviction Records Test

| Field | Value |
|-------|-------|
| **Name** | Dante Blackwood |
| **SSN** | 118829724 |
| **DOB** | 1994-05-13 |
| **Address** | 751 N Indian Creek DR |
| **City** | Clarkston |
| **State** | GA |
| **Zip** | 30021 |
| **Expected Result** | Eviction records found |

### Criminal Records Test

| Field | Value |
|-------|-------|
| **Name** | Marcus Anthony Snell |
| **SSN** | Any (use placeholder) |
| **DOB** | 1983-03-24 |
| **Address** | Any |
| **City** | Any |
| **State** | GA |
| **Zip** | 30021 |
| **Expected Result** | Criminal records found |

## Environment Variables

```bash
# Accio Data API Credentials
ACCIO_ACCOUNT=your_account_id
ACCIO_USERNAME=your_api_username
ACCIO_PASSWORD=your_api_password

# Base URL for webhook callbacks (must be HTTPS production URL)
NEXT_PUBLIC_BASE_URL=https://matchbookrentals.com
```

## API Endpoints

### Submit Background Check Order

```
POST /api/test-background-check
POST /api/background-check
```

**Request Body:**
```json
{
  "firstName": "Dante",
  "lastName": "Blackwood",
  "ssn": "118829724",
  "dob": "1994-05-13",
  "address": "751 N Indian Creek DR",
  "city": "Clarkston",
  "state": "GA",
  "zip": "30021"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "MBWEB-12345678",
  "status": "pending"
}
```

### Webhook Endpoint (Receives Results)

```
POST /api/background-check-webhook
Content-Type: text/xml
```

Accio Data POSTs XML results to this endpoint when processing completes.

### Manual Result Retrieval

```
POST /api/retrieve-order-results
```

**Request Body:**
```json
{
  "orderId": "MBWEB-12345678"
}
```

Use this to manually poll for results if webhook hasn't arrived.

### Check BGS Reports

```
GET /api/bgs-reports
```

Returns all BGSReport records with status and report data.

## XML Order Structure

Orders are submitted to Accio in this format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>YOUR_ACCOUNT</account>
    <username>YOUR_USERNAME</username>
    <password>YOUR_PASSWORD</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="MBWEB-12345678">
    <subject>
      <name_first>Dante</name_first>
      <name_last>Blackwood</name_last>
      <ssn>118829724</ssn>
      <dob>19940513</dob>
      <address>751 N Indian Creek DR</address>
      <city>Clarkston</city>
      <state>GA</state>
      <zip>30021</zip>
      <email>verification@matchbookrentals.com</email>
      <phone>555-123-4567</phone>
    </subject>
    <package>Criminal and Evictions</package>
    <postURL>https://matchbookrentals.com/api/background-check-webhook</postURL>
  </placeOrder>
</New_Order>
```

## Database Models

### BGSReport

```typescript
{
  id: string           // Primary key
  orderId: string      // "MBWEB-12345678" (unique)
  status: string       // "pending" | "completed"
  reportData: JSON     // Full XML/JSON from Accio Data
  receivedAt: Date     // When webhook was received
  purchaseId: string   // Link to Purchase
  userId: string       // Link to User
  createdAt: Date
  updatedAt: Date
}
```

### Verification

Updated when webhook received:
```typescript
{
  status: 'COMPLETED'
  evictionStatus: string      // "No Records Found" | "Records Found"
  evictionCount: number
  criminalStatus: string      // "No Records Found" | "Records Found"
  criminalRecordCount: number
  screeningDate: Date
  validUntil: Date            // 90 days from screening
  backgroundCheckedAt: Date
}
```

## Testing

### Admin Test Page

```
/test-background-check
```

Features:
- Submit test orders with pre-configured test clients
- View all BGS reports (pending/completed)
- Manually retrieve results for pending orders
- View full XML response data

### Webhook Tester

```
/admin/test/webhook-tester
```

Generic webhook testing tool for sending POST requests.

### Verify Webhook Endpoint

```bash
# Check endpoint is active
curl https://your-domain.com/api/background-check-webhook

# Expected response:
{
  "message": "Background check webhook endpoint is active",
  "endpoint": "/api/background-check-webhook",
  "method": "POST",
  "contentType": "text/xml"
}
```

## Offense Type Filtering

Accio can filter which offenses trigger county searches. Configure with your account rep:

- Felonies only
- Violent, sexual, or drug-related misdemeanors
- All felonies and select misdemeanors
- No minor traffic offenses

This reduces unnecessary record reviews and county search fees.

## File Locations

| File | Purpose |
|------|---------|
| `/src/app/api/background-check-webhook/route.ts` | Webhook endpoint |
| `/src/app/api/test-background-check/route.ts` | Test order submission |
| `/src/app/api/retrieve-order-results/route.ts` | Manual result retrieval |
| `/src/app/api/bgs-reports/route.ts` | List BGS reports |
| `/src/app/test-background-check/page.tsx` | Admin test UI |
| `/src/app/app/rent/verification/utils.ts` | XML generation helper |
| `/docs/accio-data-webhook-setup.md` | Webhook setup guide |
| `/docs/accio-webhook-quick-reference.md` | Quick reference |

## Troubleshooting

### Order stuck in "pending"

1. Check if webhook was received (look for logs)
2. Use "Retrieve" button on test page to manually poll
3. Verify webhook URL is correct in order XML
4. Check Accio dashboard for delivery status

### Webhook not receiving requests

1. Verify HTTPS is properly configured
2. Check firewall allows incoming POST requests
3. Test endpoint accessibility with curl
4. Contact Accio support to check webhook delivery logs

### XML parsing errors

1. Check webhook logs for raw XML payload
2. Verify XML structure matches expected format
3. Test with sample XML from Accio documentation

## Support

**Accio Data Support:**
- Email: support@acciodata.com
- Dashboard: Check for webhook delivery logs and order status

**Internal:**
- Check application logs for `[Background Check Webhook]` entries
- Use Prisma Studio to inspect BGSReport records: `npx prisma studio`

---

**Last Updated:** 2025-12-08
