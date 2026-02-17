# Story: View Listing Details (Authenticated)

## Description
An authenticated renter can view the full listing detail page with the option to apply. The view includes an integrated application wizard that can be triggered from the listing page.

## Acceptance Criteria
- [ ] Renter can click a listing to navigate to `/search/listing/[listingId]`
- [ ] Listing detail shows photos, description, pricing, amenities, host info
- [ ] An "Apply" button is visible (if not already applied)
- [ ] If already applied, an "Already Applied" badge is shown
- [ ] If matched, a "Matched" badge is shown
- [ ] Renter can message the host from the listing detail

## Relevant Files
- `src/app/search/listing/[listingId]/page.tsx`
- `src/app/search/listing/[listingId]/(components)/listing-detail-with-wizard.tsx`
- `src/app/guest/listing/[listingId]/(components)/public-listing-details-view.tsx`
- `src/components/listing-detail-navbar.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/renter-authed.spec.ts` → "Story 03: View Listing Details"
- **Test Coverage Notes:** Tests authed renter can click listing and view detail page with images.
