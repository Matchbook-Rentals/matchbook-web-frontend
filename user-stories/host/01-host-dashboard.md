# Story: View Host Dashboard

## Description
A host can view their dashboard with an overview of their listings, incoming applications, matches, and key statistics.

## Acceptance Criteria
- [ ] Host can navigate to `/app/host/dashboard/overview`
- [ ] Dashboard displays statistics (listings count, applications, etc.)
- [ ] Dashboard provides navigation to listings, applications, messages, and settings

## Relevant Files
- `src/app/app/host/page.tsx`
- `src/app/app/host/dashboard/page.tsx`
- `src/app/app/host/dashboard/overview/page.tsx`
- `src/app/app/host/dashboard/overview/overview-client.tsx`
- `src/app/app/host/dashboard/overview/statistics-card.tsx`
- `src/app/app/host/dashboard/layout.tsx`
- `src/app/app/host/host-dashboard-client.tsx`
- `src/app/app/host/host-dashboard-header.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/host-basics.spec.ts` → "Story 01: Host Dashboard"
- **Test Coverage Notes:** Tests host can access dashboard overview page.
