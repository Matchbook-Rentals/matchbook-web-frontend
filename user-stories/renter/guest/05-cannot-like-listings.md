# Story: Guest Cannot Like Listings (Prompted to Sign In)

## Description
A guest cannot like/favorite listings. When they attempt to do so, they are prompted to sign in via an auth modal.

## Acceptance Criteria
- [ ] Heart/like button is visible on listing cards
- [ ] Clicking the like button as a guest triggers a sign-in prompt
- [ ] The auth modal is displayed (not a redirect)
- [ ] No favorite is persisted until the guest authenticates

## Relevant Files
- `src/components/home-components/homepage-listing-card.tsx`
- `src/app/guest/rent/searches/components/guest-search-listing-card.tsx`
- `src/app/actions/guest-favorites.ts`
- `src/app/actions/favorites.ts`
- `src/components/guest-auth-modal.tsx`
- `src/contexts/guest-trip-context-provider.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/guest-restrictions.spec.ts` → "Story 05: Cannot Like Listings"
- **Test Coverage Notes:** Tests clicking heart as guest triggers auth modal or sign-in redirect.
