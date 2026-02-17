# Story: Manage Applications

## Description
An authenticated renter can view and manage their applications. A default application stores reusable info (personal details, income, etc.) that pre-fills future applications.

## Acceptance Criteria
- [ ] Renter can view all applications at `/app/rent/applications`
- [ ] Renter can view/edit their default application at `/app/rent/applications/general`
- [ ] Renter can view individual application details
- [ ] Default application data pre-fills new applications
- [ ] Application data persists across trips and listings

## Relevant Files
- `src/app/app/rent/applications/page.tsx`
- `src/app/app/rent/applications/ApplicationsClient.tsx`
- `src/app/app/rent/applications/general/page.tsx`
- `src/app/app/rent/applications/general/applicationClientComponent.tsx`
- `src/app/app/rent/applications/[applicationId]/page.tsx`
- `src/app/app/rent/applications/[applicationId]/application-details.tsx`
- `src/app/actions/applications.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
