# Story: Search Listings

## Description
A guest can use the search functionality to find listings by location, dates, and filters. The active search route is `/search`.

## Acceptance Criteria
- [ ] Guest can navigate to `/search` and see search results
- [ ] Search results display in grid and map views
- [ ] Guest can apply filters (price, property type, etc.)
- [ ] Listing cards show relevant info (images, price, location)
- [ ] Map pins correspond to listings in the grid

## Relevant Files
- `src/app/search/page.tsx`
- `src/app/search/search-page-client.tsx`
- `src/app/search/search-filters-modal.tsx`
- `src/components/newnew/search-results-navbar.tsx`
- `src/components/newnew/desktop-search-popover.tsx`
- `src/components/newnew/mobile-search-overlay.tsx`
- `src/components/newnew/search-date-range.tsx`
- `src/app/actions/listings.ts`
- `src/lib/listing-filters.ts`

## Testing
- **Tested:** Yes
- **Test File:** `e2e/guest-browse.spec.ts` → "Story 02: Search Listings"
- **Test Coverage Notes:** Tests /search loads with listing cards and has grid/map views.
