# Matchbook Verification Flow

## Overview

The Matchbook verification system performs background checks on renters to help hosts evaluate applications. The system currently performs Accio Data background checks, with iSoftPull credit checks available as a separate integration.

## ⚠️ Recommended Cost-Optimization Strategy (Not Yet Implemented)

### Two-Tier Screening System (Proposed)

**CURRENT STATUS:** The verification flow currently goes directly to Accio Data. The two-tier approach below is **recommended for future implementation** to minimize costs.

The proposed flow would check **iSoftPull first**, which provides free rejections, before using **Accio Data**, which charges per request:

```
User Submission
    ↓
1. iSoftPull Credit Check (Free if rejected)
    ↓
    ├─→ FAIL → Stop (No Accio Data charge)
    │
    └─→ PASS → Continue to Accio Data
             ↓
2. Accio Data Background Check (Charged)
    - National Criminal Search
    - Eviction & Property Damage Check
```

### Why This Order Matters

**iSoftPull First:**
- ✅ Free if applicant doesn't meet credit criteria
- ✅ Fast response (typically seconds)
- ✅ Eliminates unqualified applicants early
- ✅ Saves ~$15-25 per rejection on Accio Data fees

**Accio Data Second:**
- 💰 Charges per request (~$15-25)
- ⏱️ Slower (minutes to hours via webhook)
- 🎯 Only run on credit-qualified applicants
- 📋 Comprehensive criminal and eviction records

## Detailed Verification Flow

### Step 1: User Initiates Verification

**Entry Points:**
- `/app/rent/verification` - Direct verification page
- Application-triggered verification

**User Actions:**
1. Reviews verification information and pricing ($25 one-time fee)
2. Clicks "Start Screening"
3. Fills out personal information form:
   - First Name, Last Name
   - Social Security Number (SSN)
   - Date of Birth
   - Current Address (Street, City, State, ZIP)

**Authorization:**
- User must check consent box
- Agrees to Credit Report and Background Check Authorization
- Authorizes sharing of credit range with hosts

### Step 2: Payment Processing

**Flow:**
1. User submits form → Form data saved to `localStorage`
2. Redirects to Stripe Checkout
3. Payment: $25.00 (one-time fee)
4. Stripe webhook creates `Purchase` record:
   ```typescript
   {
     type: "matchbookVerification",
     amount: 25.00,
     status: "completed",
     isRedeemed: false,
     userId: user.id
   }
   ```

**Session Management:**
- `verificationFormData` stored in localStorage
- `verificationSessionId` stored for webhook verification
- User redirected to `/app/rent/verification/review?session_id=...`

### Step 3: Background Check Submission

**Current Implementation:**

The verification currently goes **directly to Accio Data** via:

**Endpoint:** `POST /api/background-check`

**Proposed Two-Tier Implementation:**

To minimize costs, the flow should be updated to:

1. **First:** Call iSoftPull Credit Check
   - **Endpoint:** `POST /api/background-check/credit-score/isoftpull`
   - **Process:** User data sent to iSoftPull API for soft credit pull
   - **Response:**
     ```json
     {
       "intelligence": {
         "name": "excellent" | "good" | "fair" | "poor",
         "result": "passed" | "failed"
       }
     }
     ```
   - **Database Update:**
     ```typescript
     CreditReport.upsert({
       userId: user.id,
       creditBucket: "excellent" | "good" | "fair" | "poor",
       creditUpdatedAt: new Date()
     })
     ```
   - **Decision Point:**
     - ✅ **PASS** → Continue to Accio Data
     - ❌ **FAIL** → Stop verification, inform user, **no Accio charge**

2. **Second (only if iSoftPull passes):** Call Accio Data Background Check

### Step 4: Accio Data Background Check

**Current Status:** Runs immediately upon verification submission
**Proposed:** Only runs if iSoftPull passes

**Endpoint:** `POST /api/background-check`

**XML Order Submission:**
```xml
<New_Order>
  <login>
    <account>${ACCIO_ACCOUNT}</account>
    <username>${ACCIO_USERNAME}</username>
    <password>${ACCIO_PASSWORD}</password>
  </login>
  <postURL>https://matchbookrentals.com/api/background-check-webhook</postURL>
  <placeOrder>
    <order orderID="MBWEB-{timestamp}-{random}">
      <subject>
        <name_first>{firstName}</name_first>
        <name_last>{lastName}</name_last>
        <ssn>{ssn}</ssn>
        <dob>{dob}</dob>
        <address>
          <street>{address}</street>
          <city>{city}</city>
          <state>{state}</state>
          <zip>{zip}</zip>
        </address>
      </subject>
      <product>
        <component>National Criminal Search</component>
        <component>Eviction Search</component>
      </product>
    </order>
  </placeOrder>
</New_Order>
```

**Database Record Created:**
```typescript
BGSReport.create({
  orderId: "MBWEB-{timestamp}-{random}",
  status: "pending",
  userId: user.id,
  purchaseId: purchase.id
})
```

**Accio Data Processing:**
- Receives order via XML POST
- Processes background check (minutes to hours)
- Sends results to webhook when complete

### Step 5: Webhook Result Reception

**Endpoint:** `POST /api/background-check-webhook`

**Accio Data Posts Results:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <completeOrder>
    <order orderID="MBWEB-12345678">
      <subject>...</subject>
      <components>
        <component>
          <type>National Criminal Search</type>
          <status>Complete</status>
          <results>...</results>
        </component>
        <component>
          <type>Eviction Search</type>
          <status>Complete</status>
          <results>...</results>
        </component>
      </components>
    </order>
  </completeOrder>
</XML>
```

**Database Update:**
```typescript
BGSReport.update({
  where: { orderId: "MBWEB-12345678" },
  data: {
    status: "completed",
    reportData: parsedXML, // Full XML as JSON
    receivedAt: new Date()
  }
})
```

**Purchase Redemption:**
```typescript
Purchase.update({
  where: { id: purchase.id },
  data: { isRedeemed: true }
})
```

### Step 6: Result Display

**Host View:**
- Credit range: "Excellent", "Good", "Fair", "Poor"
- Verification status: "Verified" badge
- Background check summary (clean/flagged)
- **NOT shared:** Exact credit score, full SSN, detailed reports

**Renter View:**
- Verification completion confirmation
- Order number for reference
- 90-day validity period
- Can be used for multiple applications

## Integration Details

### iSoftPull Integration

**API Endpoint:** `https://app.isoftpull.com/api/v2/reports`

**Environment Variables:**
```bash
ISOFTPULL_API_ID=your_api_id
ISOFTPULL_API_TOKEN=your_api_token
```

**Request Format:**
```typescript
// URL-encoded form data
{
  first_name: string,
  last_name: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  ssn: string
}
```

**Response Format:**
```json
{
  "intelligence": {
    "name": "excellent" | "good" | "fair" | "poor",
    "result": "passed" | "failed"
  }
}
```

**Key Features:**
- Soft pull (doesn't affect credit score)
- Free rejections (cost savings!)
- Instant results
- Stores only credit bucket, not full report

### Accio Data Integration

**API Endpoint:** `https://www.globalbackgroundscreening.com/xmlui.asp`

**Environment Variables:**
```bash
ACCIO_ACCOUNT=your_account_id
ACCIO_USERNAME=your_api_username
ACCIO_PASSWORD=your_api_password
NEXT_PUBLIC_BASE_URL=https://matchbookrentals.com
```

**Components:**
- National Criminal Search
- Eviction Search
- Property Damage Check

**Webhook URL:**
```
POST https://matchbookrentals.com/api/background-check-webhook
```

**Async Processing:**
- Order submitted → Immediate order ID returned
- Processing time: Minutes to hours
- Results posted to webhook when complete

## Cost Breakdown

### Per Verification (Successful)

**User Pays:** $25.00 (one-time fee)

**Platform Costs:**
- iSoftPull: ~$2-5 per successful pull
- Accio Data: ~$15-25 per background check
- Stripe fees: ~$0.73 (2.9% + $0.30)

**Total Cost:** ~$18-31 per verification
**Potential Profit/Loss:** -$6 to +$7 per verification

### Cost Savings with Two-Tier System

**Without iSoftPull (Old Approach):**
- 100 applicants × $25 Accio = $2,500
- 30% fail credit → wasted $750

**With iSoftPull First (New Approach):**
- 100 applicants × $2 iSoftPull = $200
- 30 fail credit (free rejections) = $0
- 70 pass × $25 Accio = $1,750
- **Total:** $1,950
- **Savings:** $550 (22% reduction!)

## Verification Validity

**Duration:** 90 days from completion

**Reusability:**
- Single verification can be used for unlimited applications
- Credit report valid for 90 days
- Background check valid for 90 days
- After expiration, user must purchase new verification

**Database Tracking:**
```typescript
{
  creditUpdatedAt: Date,    // Track credit report age
  BGSReport.receivedAt: Date // Track background check age
}
```

## User Experience Flow

### Happy Path (Current Implementation)
```
1. User clicks "Get Verified" → Landing page
2. Reviews info, clicks "Start Screening" → Form
3. Fills personal info, agrees to terms → Payment
4. Completes $25 payment → Review page
5. Submits for processing → Accio Data submitted (async)
6. Receives confirmation → "Processing" status
7. (Minutes to hours later) → Webhook updates status
8. Verification complete → "Verified" badge
9. Applies to properties → Hosts see verification
```

### Happy Path (Proposed with iSoftPull First)
```
1. User clicks "Get Verified" → Landing page
2. Reviews info, clicks "Start Screening" → Form
3. Fills personal info, agrees to terms → Payment
4. Completes $25 payment → Review page
5. Submits for processing → iSoftPull check (seconds)
6. Passes credit → Accio Data submitted (async)
7. Receives confirmation → "Processing" status
8. (Minutes to hours later) → Webhook updates status
9. Verification complete → "Verified" badge
10. Applies to properties → Hosts see verification
```

### Failure Scenarios

**Credit Check Fails:**
```
1. iSoftPull returns "failed"
2. Stop processing (no Accio charge)
3. Inform user of credit requirements
4. Option to contact support or try again
```

**Payment Fails:**
```
1. Stripe checkout fails
2. No Purchase created
3. Form data preserved in localStorage
4. User can retry payment
```

**Background Check Issues:**
```
1. Accio Data order submitted
2. Processing error or timeout
3. Manual retrieval via /api/retrieve-order-results
4. Customer support intervention
```

## Testing

### Local Testing Tools

**Admin Credit Check Tool:**
```
/app/rent/background-check
```
Features:
- Test iSoftPull integration
- View credit bucket results
- Check database updates

**Admin Webhook Tester:**
```
/admin/test/background-check-webhook
```
Features:
- Submit sample Accio XML
- Simulate webhook POST
- Verify database updates
- Test error handling

**BGS Report Checker:**
```
GET /api/admin/check-bgs-report?orderId=MBWEB-12345678
```
Returns full report status and data.

### Test Data

**iSoftPull Test SSN:**
- Contact iSoftPull for test credentials
- Use sandbox environment if available

**Accio Data Test SSN:**
- Refer to `/docs/verificaiton/` PDFs for test data
- Use provided test SSNs for clean/flagged records

## Security & Compliance

### Data Protection

**Sensitive Data:**
- SSN: Never stored in database
- Full credit report: Not stored
- Only credit bucket stored: "excellent", "good", "fair", "poor"

**Transmission:**
- All API calls over HTTPS
- Environment variables for credentials
- No credentials in code or logs

### FCRA Compliance

**User Rights:**
- Copy of credit report from agency
- Dispute inaccurate information
- Know which agency provided report

**Authorization:**
- Explicit consent required
- Purpose clearly stated
- Limited data sharing specified

### Data Retention

**Stored:**
- Credit bucket (90 days validity)
- Background check results (90 days validity)
- Order IDs for reference

**Not Stored:**
- Social Security Numbers
- Full credit reports
- Exact credit scores

## Monitoring & Alerts

### Key Metrics

**Success Rates:**
- iSoftPull pass/fail ratio
- Accio Data completion rate
- Webhook delivery success rate

**Processing Times:**
- iSoftPull response time (should be <5s)
- Accio Data processing time (track outliers)
- Webhook processing time (should be <1s)

**Cost Tracking:**
- Total verifications per month
- iSoftPull-only costs
- Accio Data costs
- Revenue from $25 fees

### Alert Conditions

🚨 **Critical:**
- Webhook delivery failure rate >5%
- iSoftPull API errors
- Accio Data submission failures

⚠️ **Warning:**
- BGSReport stuck in "pending" >48 hours
- Unusual fail rate changes
- Processing time spikes

## Related Documentation

- [Accio Data Webhook Setup](./accio-data-webhook-setup.md)
- [Accio Webhook Quick Reference](./accio-webhook-quick-reference.md)
- Accio Data PDFs: `/docs/verificaiton/*.pdf`

## Support Contacts

**iSoftPull:**
- Website: https://isoftpull.com
- Support: Contact through dashboard

**Accio Data (Global Background Screening):**
- Email: support@acciodata.com
- Documentation: See `/docs/verificaiton/` folder

---

**Last Updated:** 2025-11-10
**Version:** 2.0 - Documents current implementation + proposed two-tier strategy

**Implementation Status:**
- ✅ Accio Data background check integration (active)
- ✅ iSoftPull credit check API endpoint (available)
- ❌ Two-tier flow (iSoftPull → Accio) (proposed, not yet implemented in verification flow)

**To Implement Two-Tier Approach:**
1. Update `src/app/app/rent/verification/verification-client.tsx`
2. Call `/api/background-check/credit-score/isoftpull` first in `onSubmit()`
3. Only call `/api/background-check` if iSoftPull returns `result: "passed"`
4. Handle failure case with appropriate user messaging
