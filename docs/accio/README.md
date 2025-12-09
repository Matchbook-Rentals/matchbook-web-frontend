# Accio Data Integration

Accio Data (Global Background Screening) provides criminal and eviction background checks.

## API Endpoint

- **Production:** `https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml`
- **Method:** POST
- **Content-Type:** `text/xml`

## Environment Variables

```bash
ACCIO_ACCOUNT=matchbook
ACCIO_USERNAME=your_username
ACCIO_PASSWORD=your_password
NEXT_PUBLIC_BASE_URL=https://your-domain.com  # for webhook callback
```

## Available Packages

Query with `<getPackages/>`:
- A La Carte
- Criminal and Evictions
- Canada Screen
- International

## Package: Criminal and Evictions

Allowable product types and quantities:
- `National Criminal`: 1
- `evictions_check`: 1
- `County_criminal`: 5

**Important:** The package name alone does NOT auto-include products. You must either:
1. Use `<IncludeDefaultProducts/>` (only adds National Criminal)
2. Use explicit `<subOrder>` elements (recommended)

## Correct XML Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>matchbook</account>
    <username>your_username</username>
    <password>your_password</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="MBWEB-12345678">
    <subject>
      <name_first>John</name_first>
      <name_last>Doe</name_last>
      <ssn>123456789</ssn>
      <dob>19900115</dob>
      <address>123 Main St</address>
      <city>Atlanta</city>
      <state>GA</state>
      <zip>30021</zip>
      <email>test@example.com</email>
      <phone>555-123-4567</phone>
    </subject>
    <package>Criminal and Evictions</package>
    <subOrder type="National Criminal"/>
    <subOrder type="evictions_check">
      <state>GA</state>
    </subOrder>
    <postURL>https://your-domain.com/api/background-check-webhook</postURL>
  </placeOrder>
</New_Order>
```

## Common Errors

### Error 31: No subOrder elements
- **Cause:** Used `<package>` without any `<subOrder>` elements
- **Fix:** Add explicit `<subOrder>` elements or use `<IncludeDefaultProducts/>`

### Error 77: Product type not in package
- **Cause:** Wrong product type name (e.g., `evictions check` instead of `evictions_check`)
- **Fix:** Use exact product type names with underscores

## Test Clients

| Name | SSN | Expected Result |
|------|-----|-----------------|
| Dante Blackwood | 118829724 | Eviction Records |
| Marcus Snell | 123456789 | Criminal Records |

## Response Examples

See `response-examples/` directory:

| File | Description |
|------|-------------|
| `order-success-criminal-and-evictions.xml` | Successful order with both checks |
| `order-success-national-criminal-only.xml` | IncludeDefaultProducts (no evictions) |
| `error-no-suborders.xml` | Error 31 - missing subOrders |
| `error-wrong-product-type.xml` | Error 77 - wrong product type name |
| `get-packages.xml` | Available packages response |

## Webhook

Results are POSTed to `<postURL>` when processing completes.

- **Clear results:** Nearly instant
- **Possible records:** Routed to QA queue (hours/days)
- **County searches:** Triggered automatically if records found ($6.99/county)

## Files

| File | Purpose |
|------|---------|
| `/src/app/api/background-check/route.ts` | Submit orders |
| `/src/app/api/background-check-webhook/route.ts` | Receive results |
| `/src/app/app/rent/verification/utils.ts` | XML generation |
| `/docs/accio/response-examples/` | Sample responses |
| `/docs/verificaiton/xml_order_entry.txt` | Full API documentation |
