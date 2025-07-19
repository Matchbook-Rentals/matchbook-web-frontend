# Changelog

## Auth Utility Improvements
- Enhanced checkAuth function with retry logic for Clerk timing issues
- Added 200ms delay and retry when userId is not immediately available
- Added console logging to track auth flow in test vs production environments

## Number Validation System Implementation
- Implemented comprehensive number validation system to prevent database overflow errors
- Added client-side validation with configurable maximum values (default: 10,000,000)  
- Added server-side validation in all listing creation and update operations
- Updated forms in summary tab, deposit, rooms, and pricing components
- Created shared auth utility for test environment compatibility
- Added comprehensive unit and integration test coverage
- Fixed database schema mismatches in test fixtures (listingPhotos → listingImages)

## Cache Invalidation for Listing Updates
- Added `revalidateListingCache()` function to invalidate host dashboard, listing details, applications, and bookings pages
- Integrated cache invalidation in summary-tab.tsx after all listing update operations (location, pricing, photos, general updates)
- Ensures users see latest listing data immediately after updates across all relevant pages

## Listing Creation Flow Simplification and Cache Management
- Simplified add-property-client.tsx submission logic to use unified flow for both draft and non-draft listings
- Removed complex branching logic that handled draft vs new listing submissions differently
- Added comprehensive cache revalidation for all Listing In Creation (LIC) operations
- Cache invalidation now occurs for LIC creation, updates, and deletions across add-property and dashboard pages
- Ensures draft state changes are immediately reflected in the UI

## Comprehensive Cache Invalidation for Listing Deletions
- Added cache revalidation to listing deletion operations for both user and admin deletion flows
- Invalidates host dashboard pages, overview, listings pages, and specific listing detail pages
- Ensures immediate UI updates when listings are deleted through host interface or admin actions
- Prevents stale cached data on listing detail pages after deletion