# Story: Guest Cannot Apply to Listings (Prompted to Sign In)

## Description
A guest cannot submit an application to a listing. When they attempt to do so, they are prompted to sign in via an auth modal.

## Acceptance Criteria
- [ ] Apply/application flow is gated behind authentication
- [ ] Attempting to apply as a guest triggers a sign-in prompt
- [ ] The auth modal is displayed (not a redirect)
- [ ] No application is created until the guest authenticates

## Relevant Files
- `src/app/search/listing/[listingId]/(components)/application-wizard.tsx`
- `src/app/actions/applications.ts`
- `src/app/actions/housing-requests.ts`
- `src/stores/application-store.ts`
- `src/components/guest-auth-modal.tsx`
- `src/contexts/guest-trip-context-provider.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/guest-restrictions.spec.ts` → "Story 06: Cannot Apply to Listings"
- **Test Coverage Notes:** Tests apply button is either hidden for guests or triggers auth prompt.
