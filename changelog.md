# Changelog

## MatchBook Renter Verification App Page
- Created new /app/verification authenticated page with form-based verification flow
- Added MatchbookHeader with full Clerk authentication integration and user menu
- Implemented PersonalInformationSection and VerificationFormSection components
- Added comprehensive form with personal info (name, SSN, DOB) and address fields
- Updated all marketing page CTA buttons to link to /app/verification
- Replaced HomeIcon with logo-small.svg in breadcrumb for consistency
- Added proper authentication redirect flow for unauthenticated users

## MatchBook Renter Verification Stand Out Section
- Added VerificationStandOut component with card layout inside light teal background
- Features four verification benefits: Criminal History Check, Credit Report, Eviction History, Reusable Report
- Includes custom SVG icons for each verification feature (1.svg through 4.svg)
- Implemented centered card design with proper spacing and typography
- Applied consistent styling with other verification page sections

## MatchBook Renter Verification Why It Matters Section
- Added VerificationWhyItMatters component with feature cards layout
- Includes three benefit cards: Save Money, Stay in Control, Stand Out to Hosts
- Features responsive card layout with custom SVG icons and proper typography
- Integrated hero image section explaining verification benefits
- Applied Poppins font styling with proper color scheme matching design specs

## MatchBook Renter Verification Page
- Created new /verification page with MatchBook header, footer, and Clerk authentication
- Added verification-how-it-works component with simplified image-based flow diagram
- Integrated marketing page layout consistent with existing pages like /contact

## Admin Location Change Review Integration
- Integrated location change history directly into listing approval workflow
- Added LocationChangesSection component to show before/after address comparison
- Created approve/reject functionality with required rejection reason text input
- Added location change history to both pending and decided listing review pages
- Hidden latitude/longitude coordinates from admin interface display
- Conditional rendering only shows when location changes exist for the listing

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

## Host Listing Card Dialog Fix
- Fixed delete confirmation dialog in host listing card to use base dialog components instead of BrandDialog wrapper
- Eliminates unwanted header progress bar that was appearing in delete dialog
- Maintains all functionality while providing cleaner dialog appearance

## Host Onboarding Popup Implementation
- Added onboarding popup to homepage and hosts page promoting host registration
- Created OnboardingPopup component using brandDialog imports with native slide-in animations
- Implemented 1000ms delay to allow page load before popup appears
- Added wrapper components (HomePageWrapper, HostsPageWrapper) for popup state management
- Popup includes "Continue To Site" and "List Your Property" action buttons with proper navigation

## Number Input Comma Formatting
- Enhanced number validation utilities to support comma-separated thousands formatting
- Updated pricing inputs in listing creation flow to display commas (e.g., "1,500" instead of "1500")
- Added comma formatting to square footage input in room configuration
- Updated all deposit/rent inputs to use comma formatting while maintaining mobile numpad functionality
- Raw integer values stored in state without commas, formatted display only for better UX