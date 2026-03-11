# Story: Start a Guest Session

## Description
A guest can start a guest session, which acts as a temporary version of a trip. The session is stored via cookie (session ID) and localStorage/DB, allowing the guest to browse and interact with listings in a trip-like flow without being authenticated.

## Acceptance Criteria
- [ ] A guest session is created when the guest initiates a search/trip flow
- [ ] Session ID is persisted in a cookie
- [ ] Session data (search criteria, viewed listings) is stored in localStorage and/or DB
- [ ] Guest can view their session at `/guest/rent/searches/[sessionId]`
- [ ] Guest session includes grid view, map view, and listing details
- [ ] Guest can filter and browse listings within their session

## Relevant Files
- `src/utils/guest-session.ts`
- `src/app/actions/guest-session-db.ts`
- `src/app/actions/guest-trips.ts`
- `src/app/actions/guest-listings.ts`
- `src/contexts/guest-trip-context-provider.tsx`
- `src/app/guest/rent/searches/[sessionId]/page.tsx`
- `src/app/guest/rent/searches/[sessionId]/guest-search-client.tsx`
- `src/app/guest/rent/searches/components/guest-search-listing-card.tsx`
- `src/app/guest/rent/searches/components/guest-search-listings-grid.tsx`
- `src/app/guest/rent/searches/components/guest-search-map.tsx`
- `src/app/guest/rent/searches/components/guest-search-map-mobile.tsx`
- `src/app/guest/rent/searches/components/guest-filter-display.tsx`
- `src/app/guest/rent/searches/components/guest-filter-options-dialog.tsx`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**
