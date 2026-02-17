# Story: Apply to a Listing

## Description
An authenticated renter can apply to a listing through a multi-step application wizard. The wizard collects personal info, identity verification, income, a questionnaire, and residential history. Application data persists and can be reused across listings.

## Acceptance Criteria
- [ ] Renter can initiate application from the listing detail page
- [ ] Application wizard guides through steps: personal info, identity, income, questionnaire, residential history
- [ ] Progress is auto-saved between steps
- [ ] Application data from previous applications is pre-filled
- [ ] Application limits are enforced (per-trip and total)
- [ ] Completed application creates a housing request to the host
- [ ] Renter can view their submitted applications

## Relevant Files
- `src/app/search/listing/[listingId]/(components)/application-wizard.tsx`
- `src/app/search/listing/[listingId]/(components)/listing-detail-with-wizard.tsx`
- `src/app/app/rent/searches/(trips-components)/application-personal-info.tsx`
- `src/app/app/rent/searches/(trips-components)/application-identity.tsx`
- `src/app/app/rent/searches/(trips-components)/application-income.tsx`
- `src/app/app/rent/searches/(trips-components)/application-questionnaire.tsx`
- `src/app/app/rent/searches/(trips-components)/residential-landlord-info.tsx`
- `src/stores/application-store.ts`
- `src/app/actions/applications.ts`
- `src/app/actions/housing-requests.ts`
- `src/constants/search-constants.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
