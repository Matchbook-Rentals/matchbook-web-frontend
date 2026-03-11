# Application Submit Flow

**Feature:** Renter submits a rental application through the listing wizard.

**Fixes:** Corrected submit pipeline ordering, Prisma validation errors, form state wiping, and silent completion failures.

---

## Flow

```
Listing Page
    │
    ▼
[Click "Apply Now"] ──► Application Wizard
                              │
                        Fill all sections:
                        - Personal Info
                        - Identification + photo
                        - Residential History
                        - Income + proof
                        - Questionnaire
                              │
                              ▼
                     [Click "Submit Application"]
                              │
                    ┌─────────┴──────────┐
                    │  1. upsertApplication │ ── save form data to DB
                    │  2. markComplete       │ ── verify all requirements met
                    │  3. applyToListing     │ ── create housing request + notify host
                    └─────────┬──────────┘
                              │
                    ┌─── Success? ───┐
                    │                │
                   Yes              No
                    │                │
                    ▼                ▼
             Success Screen    Error Toast
             ✓ "Application    (shows specific
               Submitted!"     missing fields)
```

---

## Desktop Flow

### Step 1: Listing Page with Apply Action

The renter views a listing with dates pre-filled. The action box shows "Apply Now".

![Listing page with Apply Now](screenshots/desktop-01-listing-apply.png)

---

### Step 2: Application Wizard — Personal Info

The wizard opens with trip context (move-in/out dates, guests) at the top. Personal info fields: first name, last name, middle name (or "No Middle Name" checkbox), date of birth.

![Personal info section](screenshots/desktop-02-personal-info.png)

---

### Step 3: Application Wizard — Identification

ID type dropdown, ID number, and photo upload via UploadThing.

![Identification section](screenshots/desktop-03-identification.png)

---

### Step 4: Application Wizard — Residential History

Current residence with address, duration, monthly payment, and housing status. If renting, landlord contact info is required. If duration < 24 months, a previous address is required.

![Residential history section](screenshots/desktop-04-residential.png)

---

### Step 5: Application Wizard — Income & Questionnaire

Income source, monthly amount, and proof upload. Questionnaire asks about felony and eviction history.

![Income and questionnaire](screenshots/desktop-05-income-questionnaire.png)

---

### Step 6: Submit — Success Screen

After clicking "Submit Application", the pipeline runs: save → mark complete → apply. On success, the wizard transitions to a confirmation screen with a teal checkmark, "Application Submitted!" heading, and a "Back to Listing" button.

![Success screen](screenshots/desktop-06-success.png)

---

## Mobile Flow

### Step 1: Listing Page

![Mobile listing page](screenshots/mobile-01-listing-apply.png)

---

### Step 2: Personal Info

![Mobile personal info](screenshots/mobile-02-personal-info.png)

---

### Step 3: Identification

![Mobile identification](screenshots/mobile-03-identification.png)

---

### Step 4: Residential History

![Mobile residential history](screenshots/mobile-04-residential.png)

---

### Step 5: Income & Questionnaire

![Mobile income and questionnaire](screenshots/mobile-05-income-questionnaire.png)

---

### Step 6: Success Screen

![Mobile success screen](screenshots/mobile-06-success.png)

---

## Additional Viewports

### Laptop (1024x768)

![Step 1 — laptop](screenshots/laptop-01-listing-apply.png)
![Step 2 — laptop](screenshots/laptop-02-personal-info.png)
![Step 3 — laptop](screenshots/laptop-03-identification.png)
![Step 4 — laptop](screenshots/laptop-04-residential.png)
![Step 5 — laptop](screenshots/laptop-05-income-questionnaire.png)
![Step 6 — laptop](screenshots/laptop-06-success.png)

### Tablet (768x1024)

![Step 1 — tablet](screenshots/tablet-01-listing-apply.png)
![Step 2 — tablet](screenshots/tablet-02-personal-info.png)
![Step 3 — tablet](screenshots/tablet-03-identification.png)
![Step 4 — tablet](screenshots/tablet-04-residential.png)
![Step 5 — tablet](screenshots/tablet-05-income-questionnaire.png)
![Step 6 — tablet](screenshots/tablet-06-success.png)

---

## Issues Found & Fixed

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | **`markComplete` result was ignored** — if the completion check failed, `handleSubmit` proceeded to `applyToListingFromSearch`, which then failed at `checkApplicationLimits` with a generic "Please complete your application" error | User saw a confusing error with no indication of what was missing | Now checks `markComplete` result; on failure, shows a toast listing specific missing requirements (e.g. "Missing: ID photo, Income proof") and halts submission |
| 2 | **Empty residential history entries sent to server** — the Zustand store initializes with two residential history slots; the second (empty) one was always included in the upsert payload | Blank residential history records saved to DB on every application submit | `buildApplicationData()` now filters entries where no address fields are filled before sending |
| 3 | **`buildApplicationData` included trip-level fields** — `moveInDate`, `moveOutDate`, `numAdults`, `numChildren`, `numPets` were spread into the application data but don't exist on the Prisma Application model | Prisma validation error: `Unknown argument 'moveInDate'` — submissions always failed for new users | Removed trip-level fields from `buildApplicationData()` return value |
| 4 | **Submit flow ordering was backwards** — `applyToListingFromSearch` (which checks `isComplete`) was called *before* the application was saved and marked complete | New users could never submit — the application didn't exist yet when the completeness check ran | Reordered to: save application → mark complete → apply to listing |
| 5 | **`useEffect` called `resetStore()` on every re-render** — `effectiveTripContext` was a new object reference each render, triggering the effect and wiping user-entered form data | Form fields cleared mid-submission when `revalidatePath` caused parent re-renders | Added `hasInitialized` ref guard in wizard + wrapped `effectiveTripContext` in `useMemo` in parent |
| 6 | **`SaveStatusIndicator` shown in submit wizard** — the auto-save status indicator (designed for `/applications/general` template editing) was displayed in the listing submit wizard, showing "Failed to save" / "Saving..." messaging from stale Zustand state | Users saw confusing "Failed to save" / "Application not found" banners during a submit flow where no auto-save occurs | Removed `SaveStatusIndicator` from the wizard; error toasts now use "submit" language instead of "save" |
| 7 | **Auto-save `saveField` fired during file uploads in submit wizard** — identity and income components called `saveField` after UploadThing uploads completed, which failed because no application ID existed yet | "Upload Error — Photos uploaded but failed to sync" toast appeared after every file upload | Added `autoSaveEnabled` flag to Zustand store; wizard sets it to `false` on init (with cleanup to re-enable); identity/income components read it via `getState()` before calling `saveField`. Also fixed React StrictMode double-mount bug where cleanup reset `hasInitialized` ref but not `autoSaveEnabled`. |

---

## Completion Checklist (Server-Side)

The `checkApplicationCompletionServer` function verifies all of these before marking `isComplete: true`:

| Requirement | Rule |
|-------------|------|
| First name | Non-empty |
| Last name | Non-empty |
| Middle name | Non-empty OR "No Middle Name" checked |
| Date of birth | Non-null |
| Identification | At least one ID with type + number + photo |
| Income | At least one with source + amount + proof (imageUrl or fileKey) |
| Felony question | Must be answered (not null) |
| Felony explanation | Required if felony = true |
| Eviction question | Must be answered (not null) |
| Eviction explanation | Required if evicted = true |
| Current address | Street, city, state, ZIP, duration of tenancy |
| Landlord info | Required if housing status = "rent" (first + last name, email or phone) |
| Previous address | Required if current duration < 24 months (same field requirements) |

---

## Test Coverage

| Test | File | Description |
|------|------|-------------|
| apply to listing with trip details (Story 07) | `e2e/renter-authed.spec.ts` | Full wizard fill + submit + assert success screen |

## Files Changed

- `src/app/search/listing/[listingId]/(components)/application-wizard.tsx` — reordered submit pipeline, removed trip fields from application data, added `hasInitialized` ref guard, check `markComplete` result, filter empty residential entries, removed `SaveStatusIndicator` and "save" language, disable auto-save on init
- `src/app/search/listing/[listingId]/(components)/listing-detail-with-wizard.tsx` — wrapped `effectiveTripContext` in `useMemo`
- `src/stores/application-store.ts` — added `autoSaveEnabled` flag and guard in `saveField`; `resetStore` preserves flag
- `src/components/application/application-identity.tsx` — guard `saveField` calls with `autoSaveEnabled` via `getState()`
- `src/components/application/application-income.tsx` — guard `saveField` calls with `autoSaveEnabled` via `getState()`
- `src/lib/send-notification-email.ts` — lazy-init Resend client to handle missing API key in dev
- `e2e/renter-authed.spec.ts` — added Story 07 e2e test
- `e2e/renter-flow.md` — marked AP1 as tested
