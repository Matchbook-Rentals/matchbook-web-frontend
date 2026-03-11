# Story: Search Listings (Authenticated)

## Description
An authenticated renter can search for listings at `/search`. The experience is similar to guest search but with full access to like, dislike, apply, and message features. Searching creates or uses an existing trip to track state.

## Acceptance Criteria
- [ ] Renter can navigate to `/search` and see results
- [ ] Search results display in grid and map views
- [ ] Renter can apply filters (price, property type, etc.)
- [ ] Listing cards show status badges (liked, applied, matched)
- [ ] Search is associated with a trip for state tracking
- [ ] Like/dislike/apply actions are available directly from search

## Relevant Files
- `src/app/search/page.tsx`
- `src/app/search/search-page-client.tsx`
- `src/app/search/search-filters-modal.tsx`
- `src/components/newnew/search-results-navbar.tsx`
- `src/contexts/trip-context-provider.tsx`
- `src/app/actions/listings.ts`
- `src/lib/listing-filters.ts`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/renter-authed.spec.ts` → "Story 02: Search Listings"
- **Test Coverage Notes:** Tests authed renter can view search results at /search.
