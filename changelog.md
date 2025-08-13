# Changelog

## Improve photo selection UI and mobile layout for property creation
- Replaced plus icons with image icons for better visual clarity in photo placeholders
- Updated cover photo placeholder text to "Select 4 photos from below in the order they should appear"
- Removed text labels from smaller photo placeholders for cleaner interface
- Repositioned "Watch Upload Tutorial" button below title on mobile screens for better accessibility
- Maintained original button position on medium+ screens for desktop consistency

## Add unapprove functionality to application details dropdown menu
- Added functional dropdown menu to replace static "..." button in application header
- Implemented unapprove action for approved applications with proper loading states
- Added booking restriction logic to prevent unapproving applications with active bookings
- Used existing `undoApprovalHousingRequest` API function with proper error handling
- Added toast error feedback when attempting to unapprove applications with bookings

## Implement mobile responsive design for application details page
- Added responsive container wrapper with proper max-width constraints
- Converted all card sections to use responsive flex layouts with `flex-col sm:flex-row`
- Replaced fixed widths with responsive classes `min-w-0 flex-1 sm:w-auto sm:min-w-[200px]`
- Implemented CSS Grid layout for consistent column alignment in residential history
- Added text wrapping support for long addresses using `break-words max-w-xs`
- Enhanced Income section with proper column structure matching income sources below
- Ensured buttons are full-width on mobile for better touch experience

## Redesign application details page with new card-based layout and centralized styling
- Completely redesigned application-details.tsx with modern card-based UI components from unzipped project template
- Implemented centralized styling system with STYLES constant for consistent headerText, labelText, and valueText formatting
- Converted all sections from hardcoded data to live application data integration (earnings, dates, summary, renters, income, residential history, questionnaire)
- Enhanced accordion functionality with defaultOpen behavior for better user experience
- Removed dynamic borders and simplified visual design for cleaner presentation
- Added comprehensive helper functions for data calculations, currency formatting, and date handling
- Maintained modal functionality for viewing ID documents and income proof
- Preserved existing approval workflow and lease management functionality
- Created backup of original implementation for reference

## Auto-close sidebar on lease creation route navigation
- Added SidebarController component to automatically close sidebar when navigating to lease creation page
- Implemented one-time close behavior on route change (non-persistent, allows manual reopening)
- Restricted auto-close to desktop/tablet screens only, preserving mobile sidebar behavior

## Add comprehensive lease management system with PDF document signing workflow
- Added new lease management pages with creation and listing functionality for host dashboard
- Implemented complete PDF template system with document upload, field placement, and validation
- Built asynchronous multi-signer workflow where signers complete fields independently in sequence
- Added comprehensive field validation checking both data integrity and visual rendering status
- Created test pages for component validation and workflow testing in development
- Enhanced PDF editor with template creation, document selection, and signature field management
- Implemented lease signing workflow with step-by-step progress tracking and state management
- Added proper type definitions for documents, templates, and signing workflow components
- Built utility functions for document handling, template management, and signing operations
- Integrated lease management into host dashboard navigation with proper routing

## Fix New York address validation issues in listing creation
- Enhanced address parsing logic to properly extract borough names (Brooklyn, Manhattan, etc.) from Google Geocoding API
- Added fallback parsing for sublocality_level_1 and administrative_area_level_3 address components
- Moved location validation from Step 1 (location input) to Step 2 (address confirmation) to prevent blocking users
- Resolves "City is required" errors for NYC addresses during listing upload

## Fix React linting errors in PDF editor components
- Fixed conditional hook usage in FieldItem component by moving useRecipientColors call outside conditional logic
- Added missing dependencies to useEffect and useCallback hooks in PDFEditor component
- Escaped HTML entity in text content to prevent React warnings

## Enhanced PDF editor with dual interaction modes and improved field system
- Implemented dual interaction modes: click-to-place and drag-and-drop field placement with smart detection
- Added movement threshold detection (10px) to automatically determine user interaction intent
- Enhanced recipient system with 10 distinct colors and proper Host/Primary Renter labeling
- Updated field labels with recipient-specific naming (e.g., "Host Signature", "3rd Rec. Name")
- Synchronized recipient circle colors with field border colors for visual consistency
- Streamlined field types by removing radio and checkbox options from UI
- Enhanced required field buttons to support both interaction modes consistently
- Improved visual feedback with different ghost cursor styles for each interaction mode
- Added comprehensive state management for interaction modes with proper cleanup

## Modernize search listing card snapshot component
- Updated search-listing-card-snapshot.tsx to match the design of search-listing-card.tsx
- Replaced image carousel with single image display for consistency
- Added structured card layout with CardContent and CardFooter sections
- Implemented modern property features display with bedroom/bathroom/sqft icons and separators
- Updated action buttons to use BrandButton with consistent styling
- Enhanced location and rating display with reviews count
- Fixed responsive width from hardcoded 361.5px to w-full max-w-[361.5px] for proper grid layout
- Maintained customSnapshot functionality for state management compatibility

## Enhanced filter functionality and removed duplicate filter dialogs
- Made filter dialog always visible on both recommended and all listings tabs (removed mobile-only restriction)
- Removed filter dialog trigger from filter-display component to eliminate duplicate filter buttons
- Streamlined filter display to focus on showing active filters and results count

## Refactored listing-info.tsx into modular components with unified styling
- Broke down monolithic ListingDescription component into 7 smaller, focused components:
  - ListingHeader: title and share functionality
  - PropertyDetails: bedroom, bathroom, square footage info
  - PricingInfo: monthly price and deposit display
  - HighlightsSection: property category, furnished status, utilities, pets
  - AmenitiesSection: amenities grid with expandable modal
  - HostInformation: host profile, ratings, message button
  - DescriptionSection: property description text
- Applied consistent #FAFAFA background styling across all sections
- Removed borders and shadows for cleaner visual design
- Maintained responsive desktop/mobile layouts
- Improved component reusability and maintainability

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

## Host Section Style Update and Mobile Share Button Enhancement  
- Updated host information section in listing-info to match search-listing-details-box card design
- Replaced basic host display with card layout featuring Avatar component and proper spacing
- Added conditional verified badge display using CheckCircle icon when host is verified
- Made share button mobile-responsive by showing only icon at sub-small screen sizes

## Image Carousel UI Improvements
- Increased desktop image carousel height from 50vh to 65vh for better visual prominence
- Enlarged modal popup height from 75vh to 90vh and scroll area to 80vh for improved viewing experience
- Removed image counter display (x/n) from all carousel views for cleaner interface

## Search Listing Card UI Redesign
- Redesigned search listing card with fixed width (361.5px) and modern card layout structure
- Replaced image carousel with single property image display (175px height)
- Updated action buttons to use BrandButton component with white background and rounded corners
- Restructured content into organized rows: title, location/rating, property features, availability
- Added property features section with bed/bath/sqft icons using Lucide React components
- Implemented consistent text styling with variablized styles (headerTextStyle, bodyTextStyle)
- Added visual separators between property features using border dividers
- Updated price display format to show "$/month" and moved to dedicated footer section
- Enhanced category display with proper names (Private Room, Single Family, etc.)
- Integrated trip date context for availability display instead of generic "Available now"

## Image Carousel Desktop Sizing Revert
- Reverted desktop image carousel height from 65vh back to 50vh
- Reverted carousel items height from 65vh to 50vh
- Reverted individual grid image height from 31vh to 24vh
- Kept modal popup sizing improvements (90vh modal, 80vh scroll area)

## Global Error Boundary Brand Styling Update
- Updated global error boundary to use brand-consistent UI components (Card, BrandButton)
- Replaced inline styles with proper Tailwind classes and design system colors
- Added refresh icon and homepage navigation option
- Improved countdown timer (5 seconds, 1-second intervals)
- Added error boundary preview page to admin test suite at /admin/test/error-boundary

## Search Tab Empty States UI Improvements
- Added empty-listings.png image to all search tab empty states for visual consistency
- Updated empty state buttons to use BrandButton component with proper variants
- Enhanced search-match-tab, search-map-tab, search-favorites-tab, and search-matchbook-tab
- Applied consistent styling with outline variant for filter buttons and default variant for navigation buttons

## Admin User Name Display Fix
- Updated listing approval interface to display user firstName + lastName instead of fullName
- Modified data fetching in getPendingListings and getListingDetails to select firstName and lastName fields
- Ensures better success rate for displaying user names in admin approval workflow

## Admin Listing Approval Field Updates
- Added rentDueAtBooking, petRent, and petDeposit fields to listing approval interface
- Applied comma formatting to all numeric fields (bedrooms, bathrooms, square footage, lease lengths, prices)
- Enhanced number display readability with toLocaleString() formatting throughout admin interface

## Disable Onboarding Popup Auto-Focus
- Disabled automatic focus behavior in onboarding popup using onOpenAutoFocus preventDefault
- Prevents dialog from automatically focusing on the "Continue to Site" button when opened

## Image Carousel View More Dialog Enhancements
- Increased main image carousel height from 60vh to 70vh for improved viewing experience in desktop dialog
- Changed thumbnail highlight color from blue to yellow for better visual contrast
- Enhanced thumbnail navigation arrows with dark theme (black background, white text)
- Added hover effects to thumbnail arrows: 10% scale increase with smooth transitions
- Configured thumbnail carousel to scroll 5 images at a time for better pagination
- Fixed thumbnail synchronization to properly highlight the currently displayed main image
- Resolved runtime error by removing non-existent containerSize() method and implementing smart scrolling logic

## Updated Search Listing Details Verified Badge
- Replaced CheckCircle icon with custom verified-badge.svg for better visual consistency  
- Updated Badge component styling to remove border and padding
- Removed conditional rendering - verified badge now displays for all hosts

## Updated Map Pin Hover Color to Teal
- Changed map pin hover color from green (#4caf50) to teal (#0B6E6E) in search map component
- Updated both simple marker and price bubble marker hover states for consistency
- Fixed comment describing hover color from "Pink" to "Teal" for accuracy

## Enhanced Mobile Action Button Sizing in Search Match Tab
- Increased mobile action button size by 25% (from 80×45px to 100×56px)
- Enlarged button icons from h-4 w-4 to h-5 w-5 for better touch targets
- Increased spacing between buttons from gap-2 to gap-3
- Repositioned buttons slightly lower (5-10px) for improved mobile ergonomics

## Updated Map Marker Colors and Listing Layout
- Changed default map marker color from charcoal to teal (#0B6E6E) for better brand consistency
- Updated hover marker color from teal to orange (#fb8c00) for improved visual feedback
- Reordered listing description to appear after highlights section instead of at the bottom

## Documenso Integration Test Interface
- Created comprehensive test interface for Documenso lease signing integration at /admin/test/documenso-integration
- Implemented 3-step workflow: presign token creation, PDF upload, embedded template editor
- Added secure CORS proxy for Documenso API calls using server-side environment variables
- Fixed iframe embedding configuration from hash-based to query parameter format
- Enhanced debugging with token validation, detailed logging, and iframe URL inspection
- Switched from TRPC to REST API endpoints to resolve method compatibility issues
- Added comprehensive error handling and fallback mechanisms for API calls

## PDF Template System with Document Workflow
- Implemented comprehensive PDF template creation and document generation system
- Added selection-based workflow starting with main menu instead of linear progression
- Created DocumentTemplateSelector for template selection and TemplateBrowser for template management
- Added role-based recipient system (HOST/RENTER) with automatic field pre-filling
- Fixed field value display to show actual data (names, rent amounts, dates) instead of labels
- Implemented proper PDF file fetching from template URLs to resolve empty PDF errors
- Added alternating logic for consistent pre-filling: HOST/RENTER names, start/end dates
- Enhanced FieldContent component to display values based on workflow state (template vs document mode)

## PDF Document Signing Workflow Enhancements
- Fixed signer1 to signer2 transition bug that was sending users back to selection screen
- Corrected recipient index mapping in workflow progression (0-based indexing issue)
- Added DocumentSelector component for choosing documents ready for signing
- Implemented automatic signature filling with cursive font styling using recipient names
- Enhanced SignableField component with auto-sign functionality for signature fields
- Added proper workflow state management for signer transitions
- Improved document creation workflow to set status and currentStep at creation time

## Navigation and Route Updates
- Updated user menu: made verification available to all users and changed route to /verification
- Added Overview and All Listings menu items to host dashboard navigation
- Converted legacy host routes (/applications, /listings, /bookings, /payouts) to redirects pointing to dashboard equivalents

## Video Tutorial Feature
- Added "Watch Upload Tutorial" button to add-property page header
- Implemented responsive video dialog with autoplay functionality
- Configured mobile-optimized sizing with max height constraints
- Added tutorial video for listing upload process