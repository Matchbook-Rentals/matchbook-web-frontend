# Edge Case: Auth Redirect Preserves Trip Details

**Bug report:** When a guest fills out dates on a listing and clicks "Apply Now", they are prompted to sign in. After signing in, they are redirected back to the listing but the dates are lost and no trip is created.

**Fix:** The listing page now reads date/guest params from the URL after auth redirect, creates a trip server-side, pre-fills the action box, and auto-opens the application wizard when `isApplying=true`.

---

## Flow

```
Guest visits listing → fills dates → clicks Apply Now → auth modal → signs in
→ Clerk redirects back with ?startDate=...&endDate=...&numAdults=1&isApplying=true
→ Server creates trip → dates pre-filled → application wizard opens automatically
```

---

## Desktop Flow

### Step 1: Guest views listing with dates pre-filled

A guest (not signed in) arrives at a listing page with date parameters in the URL. The action box shows the dates and an **Apply Now** button.

![Guest listing with dates — desktop](screenshots/desktop-01-guest-listing-with-dates.png)

### Step 2: Guest clicks "Apply Now" — auth modal appears

Since the user is not authenticated, clicking **Apply Now** triggers the auth modal. The redirect URL encodes the current dates, guest count, and `isApplying=true` so they survive the sign-in round-trip.

![Auth modal — desktop](screenshots/desktop-02-guest-auth-modal.png)

### Step 3: After sign-in — dates are preserved

After signing in, the user is redirected back to the listing. The dates and renter count are restored from the URL params. A trip is created server-side. The **Apply Now** button is ready.

![Authed listing with dates pre-filled — desktop](screenshots/desktop-03-authed-listing-dates-prefilled.png)

### Step 4: Auto-apply — application wizard opens

When the redirect URL includes `isApplying=true`, the page skips straight to the application wizard with all details pre-filled (move-in, move-out, renter count). The user can review and submit immediately.

![Application wizard — desktop](screenshots/desktop-04-authed-application-wizard.png)

---

## Mobile Flow

### Step 1: Guest views listing with dates pre-filled

On mobile, the sticky footer shows the price, dates, and an **Apply Now** button.

![Guest listing with dates — mobile](screenshots/mobile-01-guest-listing-with-dates.png)

### Step 2: Guest clicks "Apply Now" — auth modal appears

The auth modal overlays the listing on mobile.

![Auth modal — mobile](screenshots/mobile-02-guest-auth-modal.png)

### Step 3: After sign-in — dates are preserved

After signing in, the mobile footer still shows the correct dates and **Apply Now**.

![Authed listing with dates pre-filled — mobile](screenshots/mobile-03-authed-listing-dates-prefilled.png)

### Step 4: Auto-apply — application wizard opens

The application wizard renders in a mobile-friendly layout with all details pre-filled.

![Application wizard — mobile](screenshots/mobile-04-authed-application-wizard.png)

---

## Additional Viewports

Laptop and tablet screenshots for visual QA. Layout and interactions match desktop — these capture presentation differences only.

### Laptop (1024×768)

![Guest listing with dates — laptop](screenshots/laptop-01-guest-listing-with-dates.png)

![Auth modal — laptop](screenshots/laptop-02-guest-auth-modal.png)

![Authed listing with dates pre-filled — laptop](screenshots/laptop-03-authed-listing-dates-prefilled.png)

![Application wizard — laptop](screenshots/laptop-04-authed-application-wizard.png)

### Tablet (768×1024)

![Guest listing with dates — tablet](screenshots/tablet-01-guest-listing-with-dates.png)

![Auth modal — tablet](screenshots/tablet-02-guest-auth-modal.png)

![Authed listing with dates pre-filled — tablet](screenshots/tablet-03-authed-listing-dates-prefilled.png)

![Application wizard — tablet](screenshots/tablet-04-authed-application-wizard.png)

---

## Test Coverage

| Test | File | Description |
|------|------|-------------|
| Guest clicking Apply Now shows auth modal | `guest-browse.spec.ts` | Guest with date params clicks Apply, auth modal appears |
| Landing with date params + isApplying shows wizard | `renter-authed.spec.ts` | Authed user with date params + isApplying lands on application wizard |
| Landing with date params pre-fills dates | `renter-authed.spec.ts` | Authed user with date params sees "Apply Now" (dates pre-filled) |

## Files Changed

- `src/app/guest/listing/[listingId]/page.tsx` — reads searchParams, creates trip server-side
- `src/app/guest/listing/[listingId]/(components)/renter-listing-action-box-context.tsx` — `autoApply` prop + effect
- `src/app/guest/listing/[listingId]/(components)/public-listing-details-view.tsx` — accepts server `tripId` prop
