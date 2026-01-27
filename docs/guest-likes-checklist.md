# Guest Likes + Location Rows Checklist

## 1) Guest sessions never expire
- [ ] Decide persistence approach (recommended: keep `expiresAt` but set far-future value and ignore expiry checks)
- [ ] Update guest session creation to use far-future `expiresAt` (or make it nullable) in `src/app/actions/guest-session-db.ts`
- [ ] Remove/relax expiry checks in `getGuestSession`, `updateGuestSession`, and conversion flows in `src/app/actions/guest-session-db.ts`
- [ ] Remove/relax expiry checks in conversion guardrails in `src/app/actions/guest-conversion.ts` and `src/app/actions/guest-to-trip.ts`
- [ ] Update client cache logic in `src/utils/guest-session.ts` to stop invalidating based on `expiresAt`
- [ ] (Optional) Add an explicit cleanup script/cron later if needed

## 2) Location-grouped rows on `/newnew`
- [ ] Extend `getPopularListingAreas` to return a center point (e.g., `avgLat`, `avgLng`) in `src/app/actions/listings.ts`
- [ ] Update `PopularListingsSectionWrapper` to remove the generic “Popular rentals” row and always use location-specific rows in `src/components/home-components/popular-listings-section-wrapper.tsx`
- [ ] Ensure each row includes a `locationString` and `center` (lat/lng) for guest trip creation
- [ ] Keep or remove “Near me” row (confirm decision), but keep all row titles location-specific
- [ ] Update `ListingSection` type to include `center` and `locationString` in `src/components/home-components/popular-listings-section.tsx`

## 3) Guest likes on `/newnew` rows
- [ ] Add `initialFavorited?: boolean` and `onFavorite?: (listingId: string, isFavorited: boolean) => void` to `HomepageListingCard` in `src/components/home-components/homepage-listing-card.tsx`
- [ ] Initialize local `isFavorited` from `initialFavorited` and call `onFavorite` when toggled
- [ ] In `PopularListingsSectionWrapper`, build a guest favorite ID set (from cookie session) and pass `initialFavorited` into cards
- [ ] When guest likes first time, create a guest session using the row center (city/state + avg lat/lng) and store via `GuestSessionService.storeSession`
- [ ] Use `guestOptimisticFavorite` / `guestOptimisticRemoveFavorite` for guest likes in `src/app/actions/guest-favorites.ts`

## 4) Guest likes on `/newnew/trips`
- [ ] Read guest session ID from cookie in `src/app/newnew/trips/page.tsx` and load guest favorites server-side
- [ ] Seed `favoriteListingIds` (or a new prop) with guest favorites when unauthenticated
- [ ] In `src/components/newnew/trips-page-client.tsx`, on guest like, create guest session with the map center and store it
- [ ] Reuse `guestOptimisticFavorite` / `guestOptimisticRemoveFavorite` for guest likes

## 5) Sync guest likes to a Trip on sign-in
- [ ] Add `GuestFavoriteSyncProcessor` that runs on sign-in (Clerk `useUser`) and converts guest session → Trip
- [ ] Use `createTripFromGuestSession` + `convertGuestSessionToTrip` in `src/app/actions/trips.ts` / `src/app/actions/guest-to-trip.ts`
- [ ] Clear guest session cookie/localStorage after conversion
- [ ] Mount processor in `src/app/layout.tsx`

## Verification
- [ ] Logged out: like/unlike persists across refresh on both `/newnew` and `/newnew/trips`
- [ ] Logged in: existing likes flow works unchanged
- [ ] Sign in after guest likes: favorites migrate to the user trip
- [ ] Rows on `/newnew` are location-specific and grouped by city/state
