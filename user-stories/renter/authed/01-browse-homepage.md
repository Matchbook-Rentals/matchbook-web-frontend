# Story: Browse Homepage (Authenticated)

## Description
An authenticated renter can visit the home route and browse listings. The experience is similar to the guest homepage but the user is signed in, so they have access to like listings and navigate into authenticated flows.

## Acceptance Criteria
- [ ] Authenticated renter can navigate to `/` and see the homepage
- [ ] Popular listings are displayed
- [ ] Listing cards reflect authenticated state (heart icon works, status badges shown)
- [ ] Renter can initiate a search from the homepage

## Relevant Files
- `src/app/page.tsx`
- `src/components/home-page-wrapper.tsx`
- `src/components/home-components/homepage-listing-card.tsx`
- `src/components/home-components/popular-listings-section.tsx`
- `src/components/home-components/popular-listings-section-wrapper.tsx`
- `src/components/home-components/hero.tsx`
- `src/components/home-components/SearchDialog.tsx`
- `src/components/newnew/search-navbar.tsx`
- `src/app/actions/homepage-user-state.ts`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/renter-authed.spec.ts` → "Story 01: Browse Homepage"
- **Test Coverage Notes:** Tests authed renter sees listings on homepage with user menu visible.
