# Story: Manage Listings

## Description
A host can view all their listings in a dashboard, toggle listings active/inactive, and delete listings.

## Acceptance Criteria
- [ ] Host can view all listings at `/app/host/dashboard/listings`
- [ ] Each listing shows a property card with key info
- [ ] Host can toggle a listing between active and inactive
- [ ] Host can delete a listing
- [ ] Host can navigate to individual listing management pages

## Relevant Files
- `src/app/app/host/dashboard/listings/page.tsx`
- `src/app/app/host/host-dashboard-listings-tab.tsx`
- `src/app/app/host/property-list.tsx`
- `src/app/app/host/property-card.tsx`
- `src/app/app/host/[listingId]/(components)/listing-active-switch.tsx`
- `src/app/actions/listings.ts`
- `src/app/app/host/_actions.ts`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/host-basics.spec.ts` → "Story 04: Manage Listings"
- **Test Coverage Notes:** Tests host can access listings dashboard page.
