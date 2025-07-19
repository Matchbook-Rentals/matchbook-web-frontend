# Changelog

## Number Validation System
- Added comprehensive number validation utilities in `src/lib/number-validation.ts`
- Implemented client-side input validation with configurable maximum values (default: 10,000,000)
- Updated listing creation forms (deposit, rooms, pricing) to use validation handlers
- Prevents database overflow errors from large numeric inputs
- Supports both integer-only and decimal validation modes

## Cache Invalidation for Listing Updates
- Added `revalidateListingCache()` function to invalidate host dashboard, listing details, applications, and bookings pages
- Integrated cache invalidation in summary-tab.tsx after all listing update operations (location, pricing, photos, general updates)
- Ensures users see latest listing data immediately after updates across all relevant pages