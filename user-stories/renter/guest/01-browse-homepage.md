# Story: Browse Homepage Listings

## Description
A guest (unauthenticated user) can visit the home route and browse available listings without signing in.

## Acceptance Criteria
- [ ] Guest can navigate to `/` and see the homepage
- [ ] Popular listings are displayed in a carousel/section
- [ ] Each listing card shows relevant info (images, price, location)
- [ ] Guest can interact with the search dialog to start a search

## Relevant Files
- `src/app/page.tsx`
- `src/components/home-page-wrapper.tsx`
- `src/components/home-components/homepage-listing-card.tsx`
- `src/components/home-components/popular-listings-section.tsx`
- `src/components/home-components/popular-listings-section-wrapper.tsx`
- `src/components/home-components/hero.tsx`
- `src/components/home-components/SearchDialog.tsx`
- `src/components/newnew/search-navbar.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/guest-browse.spec.ts` → "Story 01: Browse Homepage"
- **Test Coverage Notes:** Tests homepage loads with listing cards and has a search input/trigger.
