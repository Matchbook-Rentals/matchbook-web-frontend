# Criminal and Evictions Package Test - No Evictions

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
  <placeOrder number="TEST-12345">
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
    <IncludeDefaultProducts/>
    <postURL>https://matchbook-web-frontend.vercel.app/api/background-check-webhook</postURL>
  </placeOrder>
</New_Order>
```

## Response

```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="24670" number="TEST-12345">
    <subOrder type="National Criminal" comments="added by IncludeDefaultProducts" suborderID="722081"/>
  </order>
</XML>
```

## Notes

- Order was successfully placed (orderID: 24670)
- `<IncludeDefaultProducts/>` tag automatically added National Criminal search
- **Evictions check was NOT included** - even though package is named "Criminal and Evictions"
- Evictions likely requires explicit `<subOrder type="evictions check">` with `<state>` element
- The package only has National Criminal as a default product
