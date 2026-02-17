# Story: View Renter Dashboard

## Description
An authenticated renter can view their dashboard which summarizes their recent searches, active bookings, matches, pending applications, and favorited listings.

## Acceptance Criteria
- [ ] Renter can navigate to `/rent/dashboard`
- [ ] Dashboard displays recent searches/trips
- [ ] Dashboard displays active bookings
- [ ] Dashboard displays matches awaiting action
- [ ] Dashboard displays pending applications
- [ ] Dashboard displays favorited listings

## Relevant Files
- `src/app/rent/dashboard/page.tsx`
- `src/app/rent/dashboard/renter-dashboard-client.tsx`
- `src/app/rent/dashboard/components/dashboard-header.tsx`
- `src/app/rent/dashboard/components/recent-searches-section.tsx`
- `src/app/rent/dashboard/components/bookings-section.tsx`
- `src/app/rent/dashboard/components/matches-section.tsx`
- `src/app/rent/dashboard/components/applications-section.tsx`
- `src/app/rent/dashboard/components/favorites-section.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/renter-authed.spec.ts` → "Story 11: Renter Dashboard"
- **Test Coverage Notes:** Tests authed renter can access dashboard and unauthenticated users are redirected.
