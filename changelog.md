# Changelog

## Amenities Display Improvements
- Fixed keyless entry not appearing as badge in summary tab by adding it to iconAmenities array
- Implemented category-based sorting for amenity badges with priority: laundry, accessibility, basics, then others
- Enhanced amenity display logic to show amenities in consistent, meaningful order

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

## Admin Listing Approval Interface Updates
- Updated listing approval interface to use new monthly pricing model instead of legacy price ranges
- Added monthlyPricing relation to listing approval data fetching with proper sorting
- Implemented detailed pricing table showing 1-12 month lease terms with individual prices and utilities inclusion
- Restructured UI layout: property info and amenities in top row, description below, pricing table spans full width
- Added "Marked Active by User" field and removed "Background Check Required" from approval screen
- Removed bedrooms tab to streamline approval workflow
- Enhanced pricing display with clear "Included"/"Not included" utilities status and proper month formatting

## Dialog Positioning Fix
- Adjusted positioning for location update brand dialog to improve mobile/desktop display
- Applied temporary positioning fix for dialog centering issues

## Public Guest Listing Pages Implementation
- Added public listing page at `/guest/listing/[listingId]` with SEO metadata generation
- Created public-specific listing detail components separate from authenticated user components
- Implemented dynamic pricing display supporting both price ranges and single prices
- Added call-to-action sections directing visitors to sign up for contact/booking features
- Enhanced sitemap with dynamic listing URLs for improved SEO coverage
- Restricted public access to approved and active listings only
- Increased sitemap listing limit from 1,000 to 10,000 for better SEO coverage