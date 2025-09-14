# Changelog

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