# Changelog

## Modernized Listing Details Sections with Card-Based Design
- Updated highlights, amenities, description, and location sections to use consistent card styling
- Applied neutral-50 background with rounded corners and proper spacing across all detail sections
- Standardized typography: Poppins 20px semibold headers, 16px normal body text
- Implemented responsive grid layout (single column on mobile, two columns on medium+ screens)
- Reorganized section order: highlights → amenities → host info → description → location
- Enhanced "Show all amenities" button with matching design system styling
- Commented out Matchbook Verified section and updated icon positioning for better visual hierarchy

## Modernized Listing Details Title and Property Information Layout
- Replaced old title/details layout with modern card-based design matching Frame component structure
- Implemented responsive desktop/mobile split at lg breakpoint (1024px)
- Desktop: Fixed 32px title with horizontal property details layout including location, beds, baths, and square footage
- Mobile: Responsive title (20px-24px) with stacked pricing section and wrapped property details
- Added proper Lucide React icons (MapPin, Bed, Bath, Square) with consistent styling
- Maintained existing ShareButton functionality and removed deprecated layout sections

## Fixed Filter Display and Mobile Filter Button Visibility
- Fixed filter display to show individual amenities as separate badges instead of grouped
- Updated amenity labels to match existing amenities-list.ts codes (airConditioner, fridge, etc.)
- Added individual amenity removal functionality - clicking X removes only that specific amenity
- Added duplicate prevention logic to avoid showing the same amenity twice
- Limited filter button display in All Listings tab to mobile devices only (sub-medium screens)
- Filter button remains visible at all screen sizes for Recommended tab

## Updated Mobile Action Buttons to Match Design System
- Modernized mobile action buttons in search match tab to use UI components
- Replaced custom gradient circular buttons with rectangular Button and BrandButton components
- Updated icons from custom SVGs to Lucide React icons (X and Heart)
- Added black border to dislike button for better visual contrast
- Removed undo button and improved button spacing and positioning

## Improved Tab Selector Responsive Design and Filter Integration
- Made SearchTabSelector responsive at all screen sizes (removed mobile-specific tab selector)
- Added responsive text sizing using clamp() for consistent scaling across devices
- Unified filter system across Recommended and All Listings tabs for consistent UX
- Fixed filter button positioning and sizing to match tab styling on mobile
- Added FilterDisplay className prop support for responsive visibility control
- Optimized spacing between tabs and filter button on mobile (gap-2) vs desktop (gap-4)

## Hide Host Dashboard Settings
- Commented out Settings navigation link in host dashboard sidebar menus
- Removed "Other" category section from sidebar that contained Settings link
- Disabled Hospitable integration functionality in settings page while keeping UI structure intact

## Fixed Social Media Link Preview Images
- Changed OpenGraph image URL from relative to absolute path to fix black/blank preview images
- Added Twitter card metadata for proper link previews on Twitter/X
- Preview images now display correctly across all platforms (Facebook, Twitter, LinkedIn, SMS/RCS)

## Enhanced Number Input Formatting for Pricing Section
- Added comma formatting to all pricing inputs (security deposit, rent due at booking, pet deposit, pet rent, monthly rent, square footage)
- Numbers display with commas for better readability (e.g., "1,500" instead of "1500")
- Commas are automatically stripped before database storage and parsing to maintain data integrity
- Added onBlur auto-formatting to ensure consistent display when users finish editing
- Extracted pricing section into reusable PricingSection component for better code organization
- Added comprehensive test coverage for comma formatting functionality with 15 new test cases

## Disable Verification Start Screening Buttons
- Disabled all "Start Screening" buttons on the /verification marketing page
- Added disabled prop and cursor-not-allowed styling to buttons in three components
- Removed link functionality from buttons to prevent navigation

## Admin Dashboard Sidebar Modernization
- Replaced legacy AdminSidebar with modern HostSidebar component using shadcn/ui sidebar system
- Added SidebarProvider, SidebarInset, and SidebarTrigger for responsive sidebar behavior
- Organized admin navigation into logical groups: Admin Dashboard, Integrations, and System
- Added breadcrumb navigation and integrated UserMenu in header
- Removed RenterNavbar in favor of unified sidebar layout pattern

## Admin Listing Approval Field Cleanup
- Removed redundant utilitiesIncluded and requireBackgroundCheck boolean flags from listing approval display
- Kept utilities included display in monthly pricing table where it belongs
- Added text overflow protection for description field with break-words and overflow-wrap CSS

## Add Open Graph Meta Tags for Text Message Previews
- Added Open Graph meta tags to layout.tsx for proper social media and text message link previews
- Configured og:image with 1200x630 preview-logo.png for optimal aspect ratio display
- Added og:title, og:description, and og:type meta properties for complete Open Graph implementation

## Fix Square Footage and Pricing Field Persistence Issues
- Fixed comma-formatted numeric values not persisting when saved (e.g., "1,234" became null)
- Added comma removal before Number() conversion for all pricing fields
- Applied fix to square footage, deposits, pet fees, rent amounts, and monthly pricing
- Maintains comma formatting in UI while ensuring proper server submission

## Dynamic "Switch to Hosting" Button Based on User Listings
- Modified "Switch to Hosting" button to show "List your property" when users have no listings
- Updated button to route to /app/host/add-property for users without listings  
- Renamed PlatformNavbar to RenterNavbar for better semantic clarity
- Added listing count fetching to MatchbookHeader and RenterNavbar components
- Added explanatory comments for hasListings prop usage in host-side components

## Onboarding Popup Persistence & Mobile Responsiveness
- Added 2-hour localStorage persistence to prevent onboarding popup from showing repeatedly
- Implemented Safari private browsing compatibility with proper error handling
- Updated popup width for mobile responsiveness (95vw with 609px max-width)
- Changed button layout to use flex-wrap for better mobile display

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

## Search Tab Selector UI Redesign
- Created new SearchTabSelector component with modern card-based design and teal accent styling
- Replaced TabSelector with SearchTabSelector in desktop search views and loading states
- Updated search-listing-details-box with card layout, rectangular action buttons, and proper host image display
- Fixed host image URL reference to use correct Prisma schema field (imageUrl instead of profilePicture)
- Added Lucide icons for better consistency and replaced custom CheckCircleIcon with CheckCircle
- Updated verification badge to use verifiedAt field for proper verification status display
- Improved message host dialog styling with consistent teal color scheme and hover effects

## Search UI Improvements: Undo Button and Layout Fixes
- Added SearchUndoButton component for undoing like/dislike actions in recommended tab
- Undo button appears next to filters button with responsive text sizing and disabled state handling
- Fixed mobile dislike buttons to use pink background (#F65C6D) with white icons and no border
- Removed hardcoded min-height from listing-info mobile layout and replaced absolute positioning with flexbox
- Improved mobile layout responsiveness and eliminated rigid height constraints