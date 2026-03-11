# Story: Guest Session Converts to Trip on Sign-In

## Description
When a guest with an active guest session signs in, their session is automatically converted into an authenticated trip. Favorites, dislikes, and search criteria are migrated so the user can continue seamlessly.

## Acceptance Criteria
- [ ] On sign-in, the system checks for an existing guest session
- [ ] If a session exists, it checks whether it was already converted
- [ ] A new Trip is created from the guest session data
- [ ] Guest favorites are migrated to the authenticated trip
- [ ] Guest dislikes are migrated to the authenticated trip
- [ ] User is redirected to the authenticated trip view after conversion
- [ ] The conversion is idempotent (re-signing in doesn't create duplicates)

## Relevant Files
- `src/app/actions/guest-conversion.ts`
- `src/app/actions/guest-to-trip.ts`
- `src/app/actions/trips.ts`
- `src/components/guest-favorite-sync-processor.tsx`
- `src/app/guest/rent/searches/[sessionId]/page.tsx`
- `src/app/search/page.tsx`
- `src/utils/guest-session.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
