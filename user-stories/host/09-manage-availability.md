# Story: Manage Pricing and Availability

## Description
A host can manage their listing's pricing and availability calendar, including blocking dates and setting monthly pricing.

## Acceptance Criteria
- [ ] Host can view the availability calendar at `/app/host/[listingId]/calendar`
- [ ] Host can block date ranges to mark as unavailable
- [ ] Host can edit/remove unavailability periods
- [ ] Host can update monthly pricing from the summary page

## Relevant Files
- `src/app/app/host/[listingId]/calendar/page.tsx`
- `src/app/app/host/[listingId]/calendar/calendar-client.tsx`
- `src/app/app/host/[listingId]/calendar/block-dates-form.tsx`
- `src/app/app/host/[listingId]/(tabs)/listing-tab.tsx`
- `src/app/app/host/[listingId]/(tabs)/summary-sections/listing-summary-pricing.tsx`
- `src/app/actions/listings.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
