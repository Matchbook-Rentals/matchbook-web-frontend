# Story: View Listing Details

## Description
A guest can click on a listing card to view its full details, including photos, description, pricing, amenities, and host info.

## Acceptance Criteria
- [ ] Clicking a listing card navigates to the listing detail page
- [ ] Guest sees the public listing detail view (not the application wizard)
- [ ] Photos, description, pricing, and amenities are displayed
- [ ] Guest can navigate back to search results

## Relevant Files
- `src/app/guest/listing/[listingId]/page.tsx`
- `src/app/guest/listing/[listingId]/(components)/public-listing-details-view.tsx`
- `src/app/guest/listing/[listingId]/(components)/public-listing-details-box.tsx`
- `src/app/search/listing/[listingId]/page.tsx`
- `src/app/search/listing/[listingId]/(components)/listing-detail-with-wizard.tsx`
- `src/components/listing-detail-navbar.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/guest-browse.spec.ts` → "Story 03: View Listing Details"
- **Test Coverage Notes:** Tests clicking a listing navigates to detail page with images and content.
