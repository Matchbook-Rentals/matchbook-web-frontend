# Story: Host Settings

## Description
A host can manage their settings including Stripe account for payments and Hospitable integration for property management.

## Acceptance Criteria
- [ ] Host can access settings at `/app/host/dashboard/settings`
- [ ] Host can connect/manage their Stripe account
- [ ] Host can connect Hospitable integration

## Relevant Files
- `src/app/app/host/dashboard/settings/page.tsx`
- `src/app/app/host/dashboard/settings/hospitable-connect.tsx`
- `src/app/app/host/settings/stripe-account/page.tsx`
- `src/app/app/host/[listingId]/(components)/hospitable-connect-button.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/host-basics.spec.ts` → "Story 10: Settings"
- **Test Coverage Notes:** Tests host can access settings page.
