# Changelog

## Replace message host button with apply now in listing detail view
- Replaced SearchMessageHostDialog component with Apply Now button in listing-details-box-with-state component
- Added optimisticApply action from trip context to enable direct applications from listing detail page
- Apply Now button uses consistent teal styling matching other search views
- Enforces same server-side validation as all other application flows (limits, completion check, own listing check)

## Enforce application limits with server-side validation
- Added server-side application limit validation in checkApplicationLimits function (5 per trip, 10 total)
- Created search-constants.ts with MAX_APPLICATIONS_PER_TRIP and MAX_APPLICATIONS_TOTAL constants
- Centralized all application submissions through optimisticApply context function to enforce consistent validation
- Removed duplicate handleApply functions bypassing limits in search-favorites-tab and properties-you-love tabs
- Added success toast notification when applications are successfully sent to hosts for review
- Added error toast notifications for limit exceeded, application incomplete, and own listing scenarios
- Fixed limit bypass bug where favorite grid cards called createDbHousingRequest directly
- All application flows now validate: completion status, own listing check, trip limits, and total limits

## Implement Stripe Identity verification with inline modal flow
- Added Stripe Identity verification as alternative to Medallion for identity verification
- Implemented dual verification system accepting both Medallion (legacy) and Stripe Identity (new) as valid
- Created inline modal-based verification flow opening directly from onboarding checklist without separate page
- Added database fields for Stripe verification tracking (sessionId, status, reportId, lastCheck, payload)
- Built server actions for creating, checking, and canceling Stripe Identity verification sessions
- Extended webhook handler to process 5 Stripe Identity events (created, processing, verified, requires_input, canceled)
- Created verification utility functions to check identity status across both systems
- Updated admin panel to display verification source badges (Stripe blue, Medallion purple)
- Added admin test endpoint to force Stripe verification status for development testing
- Updated onboarding checklist to trigger modal inline with loading states and error handling
- All new verifications use Stripe Identity while maintaining backward compatibility with Medallion
- Updated Stripe Connect onboarding to require identity documents upfront using currently_due collection option

## Implement payment failure tracking with status enum and audit trail
- Added RentPaymentStatus enum (PENDING, PROCESSING, AUTHORIZED, SUCCEEDED, FAILED, CANCELLED, REFUNDED)
- Created RentPaymentFailure model to track all failure attempts with structured data (code, message, type, attempt number)
- Enhanced RentPayment model with status field replacing boolean isPaid while maintaining backward compatibility
- Updated Stripe webhook handlers to create failure records and set proper payment status for processing/succeeded/failed events
- Implemented notification builders for rent payment failures, successes, and processing states
- Added failure type detection based on payment method (ACH return, card decline, processing error)
- Deprecated isPaid and failureReason fields with clear migration comments while keeping them functional
- Added database indexes on failure code, rentPaymentId, and failedAt for efficient querying

## Add payment type detection for security deposits
- Added getPaymentType helper function to distinguish security deposit payments from monthly rent
- Updated host and renter booking detail pages to display correct payment type based on charge category
- Query now includes charges relation to enable security deposit detection
- Security deposits now properly labeled instead of incorrectly showing "Monthly Rent"

## Implement itemized payment charge system with deposit tracking
- Added RentPaymentCharge model for itemized breakdown of all payment components (rent, deposits, fees)
- Created charge builder utilities for BASE_RENT, SECURITY_DEPOSIT, PET_RENT, PET_DEPOSIT, PLATFORM_FEE, CREDIT_CARD_FEE, TRANSFER_FEE
- Implemented dual-write pattern storing both legacy amount field and new totalAmount/baseAmount with charges for backward compatibility
- Added deposit payment tracking as RentPayment record (isPaid=true) with itemized charges for security deposits, transfer fees, and card fees
- Created payment constants library eliminating all magic numbers (CENTS_PER_DOLLAR, MAX_PAYMENT_RETRIES, MS_PER_DAY, etc.)
- Updated payment-calculations to generate payment schedules with itemized charge arrays
- Enhanced payment display helpers for backward-compatible reading of both legacy and new payment models
- Updated confirm-payment-and-book route to create deposit payment with charges before monthly rent schedule
- Modified cron jobs (process-rent-payments, preview-rent-payments) to read from charges with fallback to legacy fields
- Removed unused admin test routes (documenso-integration, rent-payments) and added Stripe webhooks link
- All monetary amounts now stored in cents as integers to avoid floating-point errors

## Improve search UI responsive layout and viewport handling
- Hide filter display completely when no filters are active to save screen space
- Show filter badges at all screen sizes when filters are active for better mobile UX
- Fix listings grid scrolling by providing explicit height to ScrollArea component
- Implement dynamic height calculation system using ResizeObserver for map and grid synchronization
- Pass viewport-calculated height from parent page to search components for consistent sizing
- Add responsive card wrapping with flex-wrap for property features on small screens
- Hide property feature dividers on very small screens (< 360px) to prevent layout breaking
- Adjust grid breakpoints from 640px/1100px to 1000px/1400px for better spacing
- Remove manual height calculation in favor of flex-based layout with proper overflow handling
- Ensure map and listings grid resize together on window/zoom changes with shared height value

## Add extensive logging to all active webhooks
- Enhanced logging for all 7 active webhooks with entry/exit timestamps and detailed status tracking
- Added comprehensive logging to Stripe webhook with signature verification and event payload details
- Enhanced Clerk webhook with detailed user data logging for create/update/delete events
- Improved Medallion webhook with full payload logging and processing step tracking
- Added extensive XML parsing and database operation logging to background check webhook
- Enhanced BoldSign webhook with detailed signer status tracking and notification result logging
- Improved lease template webhook with full event data and processing status logging
- Added comprehensive logging to Hospitable webhook with signature verification details
- All webhooks now log processing time, error types, and full error context for debugging
- Temporary verbose logging to ensure webhooks are properly configured and functioning

## Fix Stripe Connect transfers capability and payment receipt display
- Added transfers capability request to both Stripe Connect account creation endpoints to enable ACH transfers
- Updated admin Stripe integration page to display transfers capability status (active/pending/inactive)
- Fixed payment receipt to show correct processing fee by fetching actual payment method type from Stripe
- Resolved "destination account needs transfers capability" error for ACH payments

## Align guest navbar styles with platform navbar
- Update guest search navbar to match platform navbar structure and animations
- Replace header element with motion.nav for consistent framer-motion animations
- Use APP_PAGE_MARGIN constant instead of hardcoded px-6 for responsive margins
- Restructure layout from 2-column to 3-column design (logo, center empty, user menu)
- Remove duplicate py-1 padding causing excessive vertical spacing
- Reduce content gap from pt-4 to pt-0 to match authenticated layout spacing
- Ensure consistent mobile and desktop visual density across guest and authenticated flows

## Replace uScore with real review data across listing components
- Remove algorithmic uScore displays and replace with actual user review data (averageRating/numberOfStays)
- Fix hardcoded review values (4.9 rating, 127 reviews) in all listing card components with dynamic data
- Add proper "No reviews yet" fallback messaging for listings without reviews
- Update 8 components across authenticated and guest flows for consistent review display
- Enhance mobile review display with conditional rendering based on review availability

## Remove message host buttons from mobile search views
- Remove "Message Host" button from mobile host information component
- Clean up commented-out message host button code from authenticated and guest detail boxes
- Streamlines mobile search experience by focusing on core like/dislike actions only

## Add mobile like/dislike buttons to guest search
- Add fixed bottom action bar for mobile users in guest match tab
- Include reject (X) and like (heart) buttons matching authenticated experience
- Buttons only show on mobile/tablet screens, hidden on desktop
- Provides essential interaction functionality missing on mobile guest searches

## Migrate guest sessions to database storage
- Replace client-side localStorage/cookie storage with database-backed GuestSession model
- Add GuestSession table with search parameters, guest counts, and expiration tracking
- Update guest session creation to use database with lightweight cookie ID storage
- Implement session conversion tracking when users sign up
- Add automatic session cleanup and expiration handling
- Fixes mobile production issues with cookie size limits and browser storage restrictions

## Auto-enable pets filter when trips include pets
- Automatically set petsAllowed filter to true when creating trips with numPets > 0
- Applied to both authenticated and guest trip creation flows
- Updated editTrip to auto-enable petsAllowed when numPets is changed to > 0
- Ensures users with pets automatically see pet-friendly properties without manual filter selection

## Complete Guest Search Experience Implementation
- Added full guest (unauthenticated) search experience with feature parity to authenticated users
- Implemented guest session system with 24-hour persistence using sessionStorage and cookies for RSC compatibility
- Created complete guest UI replica including interactive map, property filters, and like/dislike functionality
- Added database persistence for guest actions with seamless migration to authenticated accounts upon sign-up
- Updated Prisma schema with optional foreign keys to support both guest and authenticated users
- Built server-side conversion system for instant guest-to-auth transition without loading spinners
- Implemented proper context isolation between guest and authenticated components to prevent conflicts
- Added comprehensive filtering system with real-time updates and map viewport synchronization
- Created guest-specific navbar with proper redirect URL handling for consistent sign-in flow
- Fixed all map interactions including mobile overlay, pin details, and listing cards for guest users

## WebSocket Debug Interface for Admin Users
- Added WebSocket status indicator component for admin_dev users to monitor real-time connection status
- Implemented comprehensive error logging with expandable log viewer showing connection events, errors, and circuit breaker status
- Enhanced useWebSocketManager hook with error log tracking (up to 50 entries) and log clearing functionality
- Refactored admin role checking to server-side computation in RSC for better security and performance
- Created proper component separation with messages-page-client wrapper for clean architecture
- Removed testing-only AdminTools component and bulk conversation deletion functionality
- Added dismissible UI with hide-until-refresh functionality for non-intrusive debugging

## Medallion Identity Verification Improvements
- Enhanced verification flow with comprehensive failure handling for rejected, failed, and expired states
- Added user-friendly error UI with specific guidance based on Medallion documentation (document quality, data mismatches, technical issues)
- Implemented verification retry system with rate limiting (3 retries per 10 minutes) and proper state reset
- Added middle name support throughout verification flow to improve ID matching accuracy
- Enhanced webhook user matching via Medallion /user/summary API for better LOW_CODE_SDK integration
- Updated database schema with authenticatedMiddleName field and proper middle name collection in forms
- Improved user guidance with tips for successful verification and clear retry options

## Authenticate.com Integration Security & Reliability Improvements
- Enhanced JWT generation with CSRF protection via session tokens in redirect URLs
- Added comprehensive rate limiting (3 JWT requests/5min, 20 status polls/min per user)
- Improved webhook signature verification supporting multiple formats with better error handling
- Simplified userAccessCode management removing complex fallback logic for better reliability
- Added proper error handling for verification failures (rejected, expired, timeout) with retry mechanisms
- Implemented secure redirect validation preventing CSRF attacks with session token verification
- Enhanced user experience with retry buttons, manual status checks, and clear error messaging
- Updated environment configuration documentation reflecting API-based approach
- Added database field for session token management and created session clearing endpoint
- Improved debug logging with sensitive data masking for better troubleshooting

## Host Dashboard Payment Display Enhancement
- Updated host dashboard booking cards to display largest rent payment amount instead of base monthly rent
- Added rentPayments data fetching to getHostBookings and getAllListingBookings functions
- Implemented currency formatting to properly display amounts as dollars (cents/100)
- Added helper functions to calculate and format the largest payment from rentPayments array
- Applied changes to both dashboard-wide and listing-specific booking pages

## Email Notification System Expansion
- Implemented comprehensive email notification templates for payment failures, booking changes, and user onboarding
- Added payment failure notifications for renters with retry information and dual CTAs for severe failures
- Created host-side payment failure notifications to alert hosts of renter payment issues
- Implemented move-in/move-out reminders for both renters and hosts with personalized dates
- Added booking change request, approval, and decline notifications with dynamic recipient names
- Created welcome email for new renters with CEO message and platform exploration CTA
- Added listing approval notification for hosts with calendar management reminder
- Organized admin notification test page with collapsible accordions grouped by category
- Added secondary button support in email templates for multi-action scenarios
- Enhanced notification preview system with dynamic subject lines based on listing titles

## Stripe Express Account Integration
- Switched from Standard to Express accounts for simpler, faster host onboarding
- Added automatic syncing of Stripe account status to database (charges_enabled, details_submitted, payouts_enabled)
- Fixed completion detection for Express accounts with appropriate criteria
- Simplified prefilling to only essential fields (business_type, MCC, product description)
- Removed problematic URL validation by making business URL optional
- Updated collection_options to 'currently_due' for minimum required fields
- Created API endpoint to update Stripe status from live data on callback
- Fixed Express account completion logic (charges_enabled && details_submitted)

## Host Onboarding and Stripe Connect Integration
- Added onboarding checklist card to host dashboard showing setup requirements (Stripe account, host terms)
- Implemented direct Stripe Connect integration with one-click setup from dashboard
- Converted from embedded to hosted Stripe onboarding for better user experience
- Added automatic prefilling of user data (name, email, business info) for Stripe account creation
- Created new database field `agreedToHostTerms` to track host-specific terms acceptance
- Implemented dynamic checklist text showing "Finish creating your Stripe Account" for incomplete accounts
- Added Stripe webhook handlers for account verification status tracking
- Removed intermediate onboarding page - users now go directly to Stripe from dashboard
- Updated Stripe Connect appearance settings to use brand colors (#3c8787) and Poppins font
- Added server actions with proper cache management (noStore, revalidatePath) for real-time updates

## Mobile-Responsive Rental Application Form
- Consolidated mobile and desktop views into single responsive component, removing separate MobileApplicationEdit
- Implemented single-column layout for all form fields on mobile devices (< 640px width)
- Added responsive flex direction switching (flex-col on mobile, flex-row on desktop) for all field pairs
- Removed fixed heights on mobile: Cards, upload areas, and inputs now use natural height with padding
- Created mobile-friendly upload buttons with horizontal layout (icon left, text right) and camera icon
- Added native mobile camera/gallery support with accept="image/*" and capture="environment" attributes
- Updated questionnaire to stack questions and radio buttons vertically on mobile
- Made rent/own radio buttons display in column layout on mobile for better touch targets

## Application Auto-Save and Completion Tracking
- Implemented auto-save functionality with 1-second debouncing for text fields across all application forms
- Added immediate save for file uploads (ID photos, income proofs) and radio/select field changes
- Created centralized application completion validation in `/utils/application-completion.ts`
- Added real-time completion status tracking with toast notifications when application becomes complete/incomplete
- Implemented secure file deletion from UploadThing storage when removing uploaded documents
- Added confirmation modals for deleting income sources and documents to prevent accidental data loss
- Fixed residential history data preservation when changing duration from <24 months to ≥24 months
- Added conditional landlord fields that only appear when housing status is "rent" (not "own")
- Created development troubleshooting section showing server vs client completion status comparison
- Updated server actions to return completion status directly in save responses
- Swapped delete icons between income section (trash) and photo removal (X) for better UX consistency
- Removed requirement for landlord phone/email from completion validation (only name required now)

## Date of Birth Handling and Calendar UI Improvements
- Fixed date storage to use MySQL DATE type instead of DATETIME to prevent timezone shifts
- Enhanced date picker with month/year dropdown selectors for easier navigation
- Added proper UTC date component extraction to prevent date shifting when displaying stored dates
- Implemented full-width calendar popover that matches input field width
- Changed calendar selected date color from blue to secondaryBrand (teal) for brand consistency
- Fixed calendar day/header alignment using justify-around for even spacing
- Added development logging for date selection and storage debugging
- Resolved issue where dates would shift one day left due to UTC conversion

## Secure Document Upload and Viewing Implementation
- Implemented secure file storage for ID photos and income documents using UploadThing signed URLs
- Added new database fields (fileKey, customId, fileName) to IDPhoto and Income models for secure file tracking
- Created SecureFileViewer component for displaying files with time-limited signed URLs that expire after 1 hour
- Updated application forms to store file keys instead of direct public URLs for new uploads
- Modified host application viewing page to use secure file viewing with BrandModal for document display
- Added API endpoint for generating signed URLs with authentication check
- Updated validation to support both legacy URL data and new secure file keys for backward compatibility
- Replaced Dialog components with BrandModal for consistent UI and added footer Close buttons
- Files are no longer accessible via permanent public URLs - all access requires authentication
- Added audit logging for file access tracking

## Remove SSN field and update questionnaire styling
- Removed Social Security Number field from rental application form for improved privacy and reduced PII exposure
- Removed SSN validation logic from application store and validation utilities
- Removed SSN column from Application model in Prisma schema
- Updated questionnaire radio buttons to use consistent green secondaryBrand styling matching rent/own property selection
- Applied uniform radio button styling with border-secondaryBrand and proper checked state colors

## Fix payment calculations and booking deletion functionality
- Fixed baseRent calculation when monthlyRentOverride returns error code (77777) by using ListingMonthlyPricing fallback
- Added pet rent breakdown to upcoming payments accordion with separate base rent and pet rent line items
- Fixed booking deletion to handle related RentPayment records in transaction to prevent foreign key constraint errors
- Added development-only delete button to booking card with environment check
- Centralized payment schedule generation to ensure consistency between review page and actual booking creation
- Updated confirm-payment-and-book route to use centralized payment calculations and include monthlyPricing relation
- Added payment schedule creation for existing bookings missing payment records (handles legacy bookings)
- Cleaned up excessive console logging while maintaining essential debugging information

## Fix lease document download with signatures and annotations
- Created `/api/documents/[id]/view` route to serve PDFs with field values and signatures applied
- Added support for download vs inline viewing with `?download=true` parameter
- Implemented PDF annotation merging using pdf-lib to include all signed fields
- Refactored confirmation page with new component structure and simplified download UI
- Removed payment receipt placeholder to focus on lease document download

## Fix Stripe payment method addition and remove modal nesting
- Fixed Prisma error by changing User model field from 'name' to 'fullName'

## Payment Modification System Implementation
- Added complete payment modification workflow allowing hosts to request changes to renter payments
- Created PaymentModification database model with full audit trail (requestor, recipient, status, timestamps)
- Implemented server actions for creating, approving, and rejecting payment modifications with proper authorization
- Built PaymentModificationReviewModal component using BrandModal for in-context approval/rejection
- Added notification system integration for modification requests and status updates
- Created responsive modal design with side-by-side current vs new value comparison
- Implemented red dot indicator on payment tables for pending modifications requiring action
- Added popover menu with "View Modification" option in rent booking payment tables
- Updated data fetching to include complete modification details for seamless user experience
- Used BrandButton components throughout for consistent brand styling and loading states
- All modifications require explicit approval/rejection - no automatic processing for security

## Payment Methods Management Integration
- Added "Manage Payment Methods" button to rent payments table using TabSelector secondaryButton prop
- Integrated PaymentMethodsSection component for viewing and managing existing payment methods
- Added "Add New Payment Method" functionality with teal-styled button and PlusIcon
- Implemented AddPaymentMethodInline component with proper success/cancel callbacks
- Fixed import issue for AddPaymentMethodInline component (named vs default export)
- Added smooth scrolling to bottom when payment form opens for better UX
- Set minimum height of 600px for payment form container to accommodate expanded Stripe PaymentElement
- Updated payment status terminology from "Pending" to "Scheduled" with brand teal colors

## Pre-fetch Payment Methods in RSC
- Added payment methods fetching to React Server Component to eliminate loading spinner
- Integrated Stripe API calls in booking page RSC for card and bank account methods
- Added proper error handling with graceful fallback to client-side fetching
- Updated component interfaces to support initialPaymentMethods prop
- Maintained existing authentication and authorization checks
- Improved UX by providing instant payment method access without client-side delays

## Identity Verification Flow Improvements
- Fixed name confirmation screen to always show before verification instead of auto-skipping for users with authenticated names
- Implemented authenticated name system separating display names (from Clerk) from legal verification names
- Added inline name editing form without external redirects for smoother UX
- Simplified verification completion handler to rely on Medallion webhook instead of client-side API calls
- Enhanced verification status handling with specific UI for rejected, expired, and processing states
- Added server actions for confirming existing names or updating authenticated names independently
- Improved webhook-based verification status checking with fresh data fetching on return from Medallion
- Added Clerk webhook integration for real-time user data synchronization

## Add Date of Birth Collection for Medallion Verification
- Added authenticatedDateOfBirth field to User model for storing DOB in DD-MM-YYYY format required by Medallion
- Updated identity verification form to include date of birth input field with native browser date picker
- Implemented date format conversion between HTML date input (YYYY-MM-DD) and Medallion format (DD-MM-YYYY)
- Enhanced server actions to accept and validate date of birth parameter alongside name updates
- Added DOB validation to ensure all required fields are provided before proceeding to verification
- Updated Medallion verification component to receive and pass DOB data to resolve "dob is required" error

## Fix Medallion Webhook UserAccessCode Race Condition - Enhanced Solution
- Moved Medallion user creation to detail confirmation step, eliminating race condition entirely
- Modified confirmAuthenticatedName server action to create Medallion user and store userAccessCode before verification begins
- Simplified medallion-verification component to focus solely on SDK integration
- Removed redundant create-user API endpoint and URL parameter capture logic
- Enhanced error handling with graceful fallbacks and detailed logging