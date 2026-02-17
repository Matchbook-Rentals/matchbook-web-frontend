# Story: View Matches

## Description
An authenticated renter can view their matches (approved applications) on the dashboard and within trips. Matches lead to the lease signing and payment flow.

## Acceptance Criteria
- [ ] Matches appear on the renter dashboard
- [ ] Matches appear in the trip's match tab/bar
- [ ] Renter can click a match to view details at `/app/rent/match/[matchId]`
- [ ] Match detail shows next steps (lease signing, payment)

## Relevant Files
- `src/app/rent/dashboard/components/matches-section.tsx`
- `src/app/app/rent/searches/[tripId]/matchBar.tsx`
- `src/app/app/rent/match/[matchId]/page.tsx`
- `src/app/app/rent/match/[matchId]/lease-signing/page.tsx`
- `src/app/app/rent/match/[matchId]/payment/page.tsx`
- `src/app/app/rent/match/[matchId]/complete/page.tsx`
- `src/app/actions/matches.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
