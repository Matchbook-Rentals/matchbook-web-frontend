# iSoftPull Integration

iSoftPull provides soft credit pull functionality for tenant verification.

## API Endpoint

- **Production:** `https://app.isoftpull.com/api/v2/reports`
- **Method:** POST
- **Content-Type:** `application/x-www-form-urlencoded`
- **Auth Headers:** `api-key`, `api-secret`

## Environment Variables

```bash
ISOFTPULL_API_ID=your_api_key
ISOFTPULL_API_TOKEN=your_api_secret
```

## Test Clients

| Name | SSN | Expected Result |
|------|-----|-----------------|
| Steve Johnson | 111111111 | Good (~700) |
| John Dough | 222222222 | Fair (~600) |
| Susie Que | 333333333 | Poor (~500) |
| Chris Iceman | 444444444 | Frozen |
| Jeff Nascore | 555555555 | No Score |
| Invalid SSN | 000000000 | Invalid SSN |

## Response Examples

See `response-examples/` directory for sample API responses:

| File | Description | Refund Eligible? |
|------|-------------|------------------|
| `success-good.json` | Good credit (~700) | No |
| `success-fair.json` | Fair credit (~600) | No |
| `success-poor.json` | Poor credit (~500) | No |
| `frozen.json` | Credit file frozen | Yes |
| `no-score.json` | No credit score available | Yes |
| `no-hit.json` | No credit file found | Yes |
| `invalid-ssn.json` | Invalid SSN | Yes |

## Response Structure

```typescript
interface ISoftPullResponse {
  applicant: {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    ssn: string;
    // ...
  };
  intelligence: {
    name: string;      // "good", "fair", "poor", "frozen", "no score", etc.
    result: string;    // "passed", "No offers matched", "Credit file is frozen", etc.
    credit_score: string; // "720", "failed", "frozen", "no score", etc.
  };
  reports: {
    link: string;      // URL to view full report
    equifax: {
      status: string;  // "success" or "failed"
      message: string;
      failure_type?: string; // "no-hit", "frozen", etc.
      // ...
    };
  };
}
```

## Error Detection

### No Credit File (No-Hit)
```javascript
const hasNoHit =
  equifaxReport?.failure_type === "no-hit" ||
  creditData.intelligence?.result === "Failed" ||
  creditData.intelligence?.credit_score === "failed";
```

### Invalid SSN
```javascript
const hasInvalidSSN =
  identityScan?.message?.includes("INVALID") ||
  fraudShield?.Indicators?.includes("INVALID");
```

### Frozen Credit
```javascript
const isFrozen =
  equifaxReport?.failure_type === "frozen" ||
  creditData.intelligence?.name === "frozen";
```

## Files

| File | Purpose |
|------|---------|
| `/src/app/api/verification/isoftpull/route.ts` | API endpoint |
| `/src/types/isoftpull.ts` | TypeScript types |
| `/docs/isoftpull/response-examples/` | Sample responses |
