# Story: Manage Trips

## Description
An authenticated renter can view and manage their trips. A trip represents a saved search with associated favorites, dislikes, and applications.

## Acceptance Criteria
- [ ] Renter can view a list of their trips at `/app/rent/searches`
- [ ] Each trip card shows search criteria and status
- [ ] Renter can navigate into a trip to see its listings
- [ ] Trip view includes tabs for search results, favorites, matches, and dislikes

## Relevant Files
- `src/app/app/rent/searches/page.tsx`
- `src/app/app/rent/searches/(trips-components)/trips-content.tsx`
- `src/app/app/rent/searches/(trips-components)/trip-card.tsx`
- `src/app/app/rent/searches/(trips-components)/trip-grid.tsx`
- `src/app/app/rent/searches/(trips-components)/SearchContainerSection.tsx`
- `src/contexts/trip-context-provider.tsx`
- `src/app/actions/trips.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
