# Accio Curl Tests - Webhook Debugging

Record of curl requests sent to Accio to diagnose webhook postback issues.

## Test 1: MBWEB-STAGING-TEST (Wrong postBackInfo format)

**Date**: 2024-12-10
**Order ID**: 24687
**Order Number**: MBWEB-STAGING-TEST
**Subject**: Dante Blackwood (WRONG ADDRESS DATA)
**Webhook URL**: https://matchbook-web-frontend.vercel.app/api/background-check-webhook
**postBackInfo Format**: Missing `<authentication>` block
**Webhook Received**: ❓ Pending

```bash
curl -X POST https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>matchbook</account>
    <username>Tyler.Bennett@matchbookrentals.com</username>
    <password>Cd@QrP5gRVqFyBH</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="MBWEB-STAGING-TEST">
    <subject>
      <name_first>Dante</name_first>
      <name_last>Blackwood</name_last>
      <ssn>666603955</ssn>
      <dob>19850115</dob>
      <address>123 Test Street</address>
      <city>Denver</city>
      <state>CO</state>
      <zip>80202</zip>
    </subject>
    <package>Criminal and Evictions</package>
    <subOrder type="National Criminal"/>
    <subOrder type="evictions_check">
      <state>CO</state>
    </subOrder>
    <postBackInfo>
      <URL>https://matchbook-web-frontend.vercel.app/api/background-check-webhook</URL>
      <guID>MBWEB-STAGING-TEST</guID>
    </postBackInfo>
  </placeOrder>
</New_Order>'
```

**Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="24687" number="MBWEB-STAGING-TEST">
    <subOrder type="National Criminal" suborderID="722884"/>
    <subOrder type="evictions_check" suborderID="722885"/>
  </order>
</XML>
```

---

## Test 2: MBWEB-STAGING-TEST2 (Correct data, missing auth)

**Date**: 2024-12-10
**Order ID**: 24688
**Order Number**: MBWEB-STAGING-TEST2
**Subject**: Dante Blackwood (CORRECT ADDRESS DATA)
**Webhook URL**: https://matchbook-web-frontend.vercel.app/api/background-check-webhook
**postBackInfo Format**: Missing `<authentication>` block
**Webhook Received**: ❓ Pending

```bash
curl -X POST https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>matchbook</account>
    <username>Tyler.Bennett@matchbookrentals.com</username>
    <password>Cd@QrP5gRVqFyBH</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="MBWEB-STAGING-TEST2">
    <subject>
      <name_first>Dante</name_first>
      <name_last>Blackwood</name_last>
      <ssn>118829724</ssn>
      <dob>19940513</dob>
      <address>751 N Indian Creek DR</address>
      <city>Clarkston</city>
      <state>GA</state>
      <zip>30021</zip>
    </subject>
    <package>Criminal and Evictions</package>
    <subOrder type="National Criminal"/>
    <subOrder type="evictions_check">
      <state>GA</state>
    </subOrder>
    <postBackInfo>
      <URL>https://matchbook-web-frontend.vercel.app/api/background-check-webhook</URL>
      <guID>MBWEB-STAGING-TEST2</guID>
    </postBackInfo>
  </placeOrder>
</New_Order>'
```

**Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="24688" number="MBWEB-STAGING-TEST2">
    <subOrder type="National Criminal" suborderID="722886"/>
    <subOrder type="evictions_check" suborderID="722887"/>
  </order>
</XML>
```

---

## Test 3: MBWEB-STAGING-TEST3 (With authentication block)

**Date**: 2024-12-10
**Order ID**: 24689
**Order Number**: MBWEB-STAGING-TEST3
**Subject**: John Doe
**Webhook URL**: https://matchbook-web-frontend.vercel.app/api/background-check-webhook
**postBackInfo Format**: Full `<authentication>` block with Basic auth
**Webhook Received**: ❓ Pending

```bash
curl -X POST https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>matchbook</account>
    <username>Tyler.Bennett@matchbookrentals.com</username>
    <password>Cd@QrP5gRVqFyBH</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="MBWEB-STAGING-TEST3">
    <subject>
      <name_first>John</name_first>
      <name_last>Doe</name_last>
      <ssn>000000001</ssn>
      <dob>19900101</dob>
      <address>123 Test Street</address>
      <city>Atlanta</city>
      <state>GA</state>
      <zip>30301</zip>
    </subject>
    <package>Criminal and Evictions</package>
    <subOrder type="National Criminal"/>
    <subOrder type="evictions_check">
      <state>GA</state>
    </subOrder>
    <postBackInfo>
      <authentication>
        <type>Basic</type>
        <username>Tyler.Bennett@matchbookrentals.com</username>
        <password>Cd@QrP5gRVqFyBH</password>
      </authentication>
      <URL>https://matchbook-web-frontend.vercel.app/api/background-check-webhook</URL>
      <guID>MBWEB-STAGING-TEST3</guID>
    </postBackInfo>
  </placeOrder>
</New_Order>'
```

**Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="24689" number="MBWEB-STAGING-TEST3">
    <subOrder type="National Criminal" suborderID="722928"/>
    <subOrder type="evictions_check" suborderID="722929"/>
  </order>
</XML>
```

---

## Test 4: MBWEB-JOHNDOE-TEST1 (Fixed XML order + postback_types)

**Date**: 2024-12-12
**Order ID**: 24754
**Order Number**: MBWEB-JOHNDOE-TEST1
**Subject**: John Doe
**Webhook URL**: https://matchbook-web-frontend.vercel.app/api/background-check-webhook
**postBackInfo Format**: Full `<authentication>` block + `<postback_types>ICR::OCR</postback_types>`
**XML Order**: Fixed - `postBackInfo` now BEFORE `subject` (per Accio docs)
**Webhook Received**: ✅ YES - ICR received for evictions_check (filledCode: clear)

```bash
curl -X POST https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>matchbook</account>
    <username>Tyler.Bennett@matchbookrentals.com</username>
    <password>Cd@QrP5gRVqFyBH</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="MBWEB-JOHNDOE-TEST1">
    <postBackInfo>
      <authentication>
        <type>Basic</type>
        <username>Tyler.Bennett@matchbookrentals.com</username>
        <password>Cd@QrP5gRVqFyBH</password>
      </authentication>
      <URL>https://matchbook-web-frontend.vercel.app/api/background-check-webhook</URL>
      <guID>MBWEB-JOHNDOE-TEST1</guID>
      <postback_types>ICR::OCR</postback_types>
    </postBackInfo>
    <subject>
      <name_first>John</name_first>
      <name_last>Doe</name_last>
      <ssn>000000001</ssn>
      <dob>19900101</dob>
      <address>123 Test Street</address>
      <city>Atlanta</city>
      <state>GA</state>
      <zip>30301</zip>
      <email>verification@matchbookrentals.com</email>
      <phone>555-123-4567</phone>
    </subject>
    <package>Criminal and Evictions</package>
    <subOrder type="National Criminal"/>
    <subOrder type="evictions_check">
      <state>GA</state>
    </subOrder>
  </placeOrder>
</New_Order>'
```

**Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="24754" number="MBWEB-JOHNDOE-TEST1">
    <subOrder type="National Criminal" suborderID="723967"/>
    <subOrder type="evictions_check" suborderID="723968"/>
  </order>
</XML>
```

**Webhook Received** (2024-12-12 19:24:46 UTC):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ScreeningResults>
  <login>
    <account>MBWEB-JOHNDOE-TEST1</account>
    <username>MBWEB-JOHNDOE-TEST1</username>
    <password>MBWEB-JOHNDOE-TEST1</password>
  </login>
  <postResults order="MBWEB-JOHNDOE-TEST1" subOrder="" remote_order="24754" remote_subOrder="723968"
    held_for_review="N" held_for_release_form="N" filledStatus="filled" filledCode="clear"
    type="evictions_check" reference_number="">
    <time_ordered>2025-12-12 14:24:35</time_ordered>
    <time_filled>2025-12-12 14:24:43</time_filled>
    <fees>
      <addon>0.00</addon>
      <adjustments>0.00</adjustments>
      <adjustmentReason> Included in package.</adjustmentReason>
      <thirdparty>0.00</thirdparty>
      <taxes>0.00</taxes>
    </fees>
  </postResults>
  <orderInfo>
    <packagename>Criminal and Evictions</packagename>
  </orderInfo>
</ScreeningResults>
```

**Key Findings**:
- Moving `postBackInfo` BEFORE `subject` fixed the webhook delivery
- `guID` is echoed back in login block (account/username/password all set to guID value)
- `postResults` format used for ICR (individual suborder results)
- Awaiting `completeOrder` format for OCR (full order results)

---

## Test 5: MBWEB-SNELL-TEST1 (OCR only - no ICR)

**Date**: 2024-12-12
**Order ID**: 24772
**Order Number**: MBWEB-SNELL-TEST1
**Subject**: Marcus Snell (Criminal Records test subject)
**Webhook URL**: https://matchbook-web-frontend.vercel.app/api/background-check-webhook
**postBackInfo Format**: Full `<authentication>` block + `<postback_types>OCR</postback_types>`
**XML Order**: Fixed - `postBackInfo` BEFORE `subject`
**Webhook Received**: ❓ Pending (expecting completeOrder format)

```bash
curl -X POST https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>matchbook</account>
    <username>Tyler.Bennett@matchbookrentals.com</username>
    <password>Cd@QrP5gRVqFyBH</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="MBWEB-SNELL-TEST1">
    <postBackInfo>
      <authentication>
        <type>Basic</type>
        <username>Tyler.Bennett@matchbookrentals.com</username>
        <password>Cd@QrP5gRVqFyBH</password>
      </authentication>
      <URL>https://matchbook-web-frontend.vercel.app/api/background-check-webhook</URL>
      <guID>MBWEB-SNELL-TEST1</guID>
      <postback_types>OCR</postback_types>
    </postBackInfo>
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
  </placeOrder>
</New_Order>'
```

**Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="24772" number="MBWEB-SNELL-TEST1">
    <subOrder type="National Criminal" suborderID="724744"/>
    <subOrder type="evictions_check" suborderID="724745"/>
  </order>
</XML>
```

**Purpose**: Test OCR-only postback to see if we get `completeOrder` format instead of `postResults` format.

---

## Summary Table

| Order Number | Order ID | Subject | Auth Block | postback_types | XML Order | Webhook Hit |
|--------------|----------|---------|------------|----------------|-----------|-------------|
| MBWEB-STAGING-TEST | 24687 | Dante Blackwood (wrong addr) | No | None | Wrong | ❓ |
| MBWEB-STAGING-TEST2 | 24688 | Dante Blackwood (correct) | No | None | Wrong | ❓ |
| MBWEB-STAGING-TEST3 | 24689 | John Doe | Yes | None | Wrong | ❓ |
| MBWEB-JOHNDOE-TEST1 | 24754 | John Doe | Yes | ICR::OCR | **Fixed** | ✅ ICR |
| MBWEB-SNELL-TEST1 | 24772 | Marcus Snell | Yes | OCR | **Fixed** | ❓ |

---

## Potential Issues to Check

1. **"Ignore Postback Info Block" setting** - Accio can be configured at site/account level to ignore postBackInfo entirely. Contact support to verify this is set to "No".

2. **Webhook URL accessibility** - Verified via curl GET:
   ```bash
   curl https://matchbook-web-frontend.vercel.app/api/background-check-webhook
   # Returns: {"message":"Background check webhook endpoint is active",...}
   ```

3. **Processing time** - Background checks may take minutes to hours before results are posted back.

4. **postback_types** - Not specified, should default to all types per docs.

---

## Test Subjects Reference

| Name | SSN | DOB | Address |
|------|-----|-----|---------|
| John Doe | 000000001 | 01/01/1990 | 123 Test Street, Atlanta, GA 30301 |
| Dante Blackwood | 118829724 | 05/13/1994 | 751 N Indian Creek DR, Clarkston, GA 30021 |
| Marcus Snell | 123456789 | 03/24/1983 | 123 Any Street, Anytown, GA 30021 |

---

**Last Updated**: 2024-12-12
