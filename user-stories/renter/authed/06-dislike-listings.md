# Story: Dislike Listings

## Description
An authenticated renter can dislike (dismiss) listings within a trip. Disliked listings are hidden from main results but can be reviewed in a disliked tab.

## Acceptance Criteria
- [ ] Renter can dislike a listing to dismiss it from results
- [ ] Dislike is persisted to the database linked to the trip
- [ ] Disliked listings are hidden from the main search grid
- [ ] Disliked listings appear in a dedicated disliked tab
- [ ] Renter can undo a dislike to restore the listing

## Relevant Files
- `src/app/actions/dislikes.ts`
- `src/app/app/rent/searches/[tripId]/(tabs)/disliked-properties.tsx`
- `src/app/app/rent/searches/[tripId]/dislikes/dislike-listing-grid.tsx`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
