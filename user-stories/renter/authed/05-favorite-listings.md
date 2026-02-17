# Story: Favorite Listings

## Description
An authenticated renter can favorite (like) listings within a trip. Favorites are trip-scoped and viewable in a dedicated favorites tab.

## Acceptance Criteria
- [ ] Renter can click the heart icon on a listing card to favorite it
- [ ] Favorite is persisted to the database linked to the trip
- [ ] Favorited listings appear in the favorites tab/grid
- [ ] Renter can remove a favorite by clicking the heart icon again
- [ ] Favorites are reflected on the dashboard

## Relevant Files
- `src/app/actions/favorites.ts`
- `src/app/app/rent/searches/[tripId]/favorites/page.tsx`
- `src/app/rent/dashboard/components/favorites-section.tsx`
- `src/components/home-components/homepage-listing-card.tsx`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/renter-authed.spec.ts` → "Story 05: Favorite Listings"
- **Test Coverage Notes:** Tests authed renter can click heart without auth prompt and no guest cookie is set.
