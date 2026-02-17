# Story: Edit a Listing

## Description
A host can edit an existing listing's details including description, location, pricing, amenities, property details, and highlights from a summary view.

## Acceptance Criteria
- [ ] Host can navigate to `/app/host/[listingId]/summary`
- [ ] Each section (highlights, location, pricing, amenities, property details, description) is editable
- [ ] Changes are saved to the database
- [ ] Updated info is reflected on the public listing

## Relevant Files
- `src/app/app/host/[listingId]/summary/page.tsx`
- `src/app/app/host/[listingId]/listing/page.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-tab.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-sections/listing-summary-highlights.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-sections/listing-summary-location.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-sections/listing-summary-pricing.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-sections/listing-summary-amenities.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-sections/listing-summary-property-details.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-sections/listing-summary-description.tsx`
- `src/app/actions/listings.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
