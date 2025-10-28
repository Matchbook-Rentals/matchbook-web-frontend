# Search Duration Calculation - Business Logic

## Overview

This document defines how Matchbook calculates trip duration in months for the purpose of **determining which listing pricing tier to use**. This is distinct from payment calculations.

## Purpose

The search duration calculation determines which `ListingMonthlyPricing` tier applies to a trip. For example:
- A listing may have different prices for 2-month vs 3-month stays
- A trip that is 2.9 calendar months should use the **2-month pricing tier**
- Even though this trip will generate **3 payments** (payment logic is separate)

## Why Separate from Payment Logic?

**Search/Pricing Logic** (this document):
- **Purpose**: Determine which pricing tier from `ListingMonthlyPricing` to apply
- **Method**: Full calendar months calculation
- **Used for**: Pricing lookups, utilities determination, matching pricing tiers

**Payment Logic** (separate system):
- **Purpose**: Determine payment schedule and count
- **Method**: Based on "first of the month" logic
- **Used for**: Payment processing, fee calculations, rent collection

These are **intentionally different** because:
- A 2.9 month trip uses 2-month pricing (pricing tier)
- But generates 3 payments (payment schedule)

## Calculation Method: Full Calendar Months

### Rule
Count the number of **full calendar months** that have passed, with a **minimum of 1 month**.

### How It Works

Start date to end date calculation:
- Count how many times the **same day of month** appears in the date range
- Minimum duration: **1 month** (no 0-month trips allowed)

### Examples

| Start Date | End Date | Calculation | Months |
|------------|----------|-------------|--------|
| Aug 15 | Sep 14 | Hasn't completed 1 full month yet | **1 month** (minimum) |
| Aug 15 | Sep 15 | Completed 1 full month | **1 month** |
| Aug 15 | Oct 11 | Hasn't completed 2 full months yet | **1 month** |
| Aug 15 | Oct 14 | Hasn't completed 2 full months yet | **1 month** |
| Aug 15 | Oct 15 | Completed 2 full months | **2 months** |
| Aug 15 | Oct 30 | Completed 2 full months | **2 months** |
| Aug 15 | Nov 14 | Hasn't completed 3 full months yet | **2 months** |
| Aug 15 | Nov 15 | Completed 3 full months | **3 months** |
| Jan 31 | Feb 28 | Less than 1 full month | **1 month** (minimum) |
| Jan 31 | Mar 31 | Completed 2 full months | **2 months** |

### Edge Cases

**Month Boundaries:**
- Start: Jan 31, End: Feb 28 → 1 month (Feb doesn't have 31 days)
- Start: Jan 31, End: Mar 30 → 1 month (hasn't completed 2 full months)
- Start: Jan 31, End: Mar 31 → 2 months (completed 2 full months)

**Minimum Rule:**
- Any trip less than 1 full calendar month = **1 month** (minimum)
- This ensures trips always match a pricing tier (no 0-month pricing exists)

## Implementation

### Current Implementation
The calendar iteration logic is found in:
- `/src/lib/calculate-payments.tsx` lines 152-183 (`calculateLengthOfStay`)
- This iterates through actual calendar months rather than dividing days by 30

### Correct Approach
```typescript
// Iterate through calendar months
// Count how many times we pass the same day of month
// Return max(1, monthCount)
```

### Incorrect Approaches
❌ `Math.floor(days / 30)` - Doesn't account for calendar months
❌ `Math.round(days / 30)` - Rounds incorrectly (2.9 months → 3)
❌ `Math.ceil(days / 30)` - Always rounds up

## Where This Applies

This calculation method should be used for:

1. **Pricing Tier Lookup**
   - Matching against `ListingMonthlyPricing.months` field
   - Determining which monthly price to apply
   - Function: `calculateRent()` in `/src/lib/calculate-rent.tsx`

2. **Utilities Determination**
   - Looking up `ListingMonthlyPricing.utilitiesIncluded` for the trip duration
   - Function: `getUtilitiesIncluded()` in `/src/lib/calculate-rent.tsx`

3. **Trip Duration Display**
   - Showing users how many months their trip is
   - Search result displays
   - Booking confirmations

4. **Search Filtering**
   - Matching trips to listings based on lease length requirements
   - Ensuring trips meet minimum/maximum lease durations

## When NOT to Use This

Do **NOT** use this calculation for:
- Payment scheduling (use payment-specific logic)
- Payment count determination (use "first of the month" logic)
- Service fee calculations (use payment month logic)
- Pro-rating calculations (use payment logic from `/docs/payment-rules.md`)

## Related Documentation

- `/docs/payment-rules.md` - Payment calculation rules (separate logic)
- `/docs/cron/roll-search-dates.md` - Search date rolling with calendar month logic
- `/docs/pullListingsFromDb-filter-requirements.md` - Search filtering requirements

## Last Updated
2025-10-28
