# Criminal and Evictions Package Test - Success

**Date:** 2024-12-09

## Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>matchbook</account>
    <username>Tyler.Bennett@matchbookrentals.com</username>
    <password>Cd@QrP5gRVqFyBH</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="TEST-12347">
    <subject>
      <name_first>Marcus</name_first>
      <name_last>Snell</name_last>
      <ssn>123456789</ssn>
      <dob>19830324</dob>
      <address>123 Any Street</address>
      <city>Anytown</city>
      <state>GA</state>
      <zip>30021</zip>
      <email>verification@matchbookrentals.com</email>
      <phone>555-123-4567</phone>
    </subject>
    <package>Criminal and Evictions</package>
    <subOrder type="National Criminal"/>
    <subOrder type="evictions_check">
      <state>GA</state>
    </subOrder>
    <postURL>https://matchbook-web-frontend.vercel.app/api/background-check-webhook</postURL>
  </placeOrder>
</New_Order>
```

## Response

```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="24672" number="TEST-12347">
    <subOrder type="National Criminal" suborderID="722127"/>
    <subOrder type="evictions_check" suborderID="722128"/>
  </order>
</XML>
```

## Key Findings

1. **Package alone is not enough** - Must include explicit `<subOrder>` elements
2. **Correct subOrder types:**
   - `National Criminal` (with space) - for criminal database search
   - `evictions_check` (with underscore) - for eviction search
3. **Evictions requires state** - Must include `<state>` element inside the subOrder
4. **Package limits:** `evictions_check:1`, `County_criminal:5`, `National Criminal:1`

## Test Client: Marcus Snell (Criminal Records)

| Field | Value |
|-------|-------|
| Name | Marcus Snell |
| SSN | 123456789 |
| DOB | 1983-03-24 |
| Address | 123 Any Street |
| City | Anytown |
| State | GA |
| Zip | 30021 |
| Expected Result | Criminal records found |
