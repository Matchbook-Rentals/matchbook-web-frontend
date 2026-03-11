# Story: View Applications

## Description
A host can view incoming rental applications (housing requests) for their listings. Each application shows the renter's personal info, identity, income, questionnaire responses, and residential history.

## Acceptance Criteria
- [ ] Host can view all applications at `/app/host/dashboard/applications`
- [ ] Host can view applications for a specific listing via the listing sidebar
- [ ] Application detail shows: personal info, identity, income, questionnaire, residential history
- [ ] Application cards show key applicant info at a glance

## Relevant Files
- `src/app/app/host/dashboard/applications/page.tsx`
- `src/app/app/host/host-dashboard-applications-tab.tsx`
- `src/app/app/host/host-application-cards.tsx`
- `src/app/app/host/[listingId]/applications/[housingRequestId]/page.tsx`
- `src/app/app/host/[listingId]/(components)/host-applications-sidebar.tsx`
- `src/app/app/host/[listingId]/(components)/host-application-details.tsx`
- `src/app/app/host/[listingId]/(components)/host-application-identity.tsx`
- `src/app/app/host/[listingId]/(components)/host-application-incomes.tsx`
- `src/app/app/host/[listingId]/(components)/host-application-resident-history.tsx`
- `src/app/app/host/[listingId]/(components)/host-application-criminal-history.tsx`
- `src/app/app/host/[listingId]/(components)/host-applicant-card.tsx`
- `src/app/actions/housing-requests.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
