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