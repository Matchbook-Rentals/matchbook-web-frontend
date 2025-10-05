# Implementation Guide: Enforcing Two-Letter State Codes

This guide walks a junior developer through adding rock-solid validation so host listings only ever persist USPS-style two-letter state codes (e.g. `CA`, `NY`). Follow the steps in order; each includes exact files, snippets, and a rationale explaining *why* the change matters.

---
## 1. Prerequisites & Context

- Repo: `matchbook-web-frontend`
- Stack highlights: Next.js 14, TypeScript (strict), Prisma, Clerk auth
- Target area: host flows for creating and editing listings
- Goal: Every code path that reads or writes `listing.state` or draft equivalents must normalize names to two-letter codes and reject invalid values.

Before you start:
1. Run `npm install` if dependencies aren’t already present.
2. Ensure you can run Vitest unit tests locally (`npm run test:unit`).
3. Skim the existing host add-property flow (`src/app/app/host/add-property/*`) so the form structure is familiar.

---
## 2. Add Shared State Utilities

**File:** `src/lib/us-states.ts` (new file)

1. Create the file and paste the snippet below.
2. The array provides the single source of truth for US states.
3. `normalizeStateCode` turns either a code or full name into a two-letter code (or `null` if unknown).
4. `sanitizeStateInput` is stricter: it’s meant for server code; it throws unless the value is clean.

```ts
// src/lib/us-states.ts
export interface UsState {
  name: string;
  code: string;
}

export const US_STATES: UsState[] = [
  { name: "Alabama", code: "AL" },
  { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" },
  { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" },
  { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" },
  { name: "Delaware", code: "DE" },
  { name: "District of Columbia", code: "DC" },
  { name: "Florida", code: "FL" },
  { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" },
  { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" },
  { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" },
  { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" },
  { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" },
  { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" },
  { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" },
  { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" },
  { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" },
  { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" },
  { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" },
  { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" },
  { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" },
  { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" },
  { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" },
  { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" },
  { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" },
  { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" },
  { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" },
  { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" },
  { name: "Wyoming", code: "WY" }
];

const STATE_CODE_LOOKUP = new Set(US_STATES.map((state) => state.code));
const STATE_NAME_LOOKUP = new Map(
  US_STATES.map((state) => [state.name.toLowerCase(), state.code])
);

export const STATE_VALIDATION_ERROR = 'State must be a valid two-letter US state code.';

export function normalizeStateCode(input?: string | null): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (STATE_CODE_LOOKUP.has(upper)) return upper;

  const byName = STATE_NAME_LOOKUP.get(trimmed.toLowerCase());
  return byName ?? null;
}

export function sanitizeStateInput(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') throw new Error(STATE_VALIDATION_ERROR);

  const normalized = normalizeStateCode(value);
  if (!normalized) {
    if (value.trim() === '') return null;
    throw new Error(STATE_VALIDATION_ERROR);
  }

  return normalized;
}
```

*Rationale:* With this shared module in place, UI components can normalize user input, and server actions can rely on `sanitizeStateInput` to enforce correctness. One definition avoids copy/paste state lists and keeps behaviour consistent.

---
## 3. Update Host-Facing UI Components

We now ensure every host-facing form feeds sanitized values into app state.

### 3.1 Add-Property Confirmation Form
**File:** `src/app/app/host/add-property/address-confirmation-form.tsx`

1. Replace the inline `US_STATES` array with imports from the new helper.
2. Update the `normalizeState` function to use `normalizeStateCode`.
3. Make sure the `<SelectItem>` uses `state.code` for the value.

Key snippet (imports at top):
```ts
import { US_STATES, normalizeStateCode } from "@/lib/us-states";
```

Updated helper:
```ts
const normalizeState = (input: string): string => {
  const normalized = normalizeStateCode(input);
  return normalized ?? "";
};
```

### 3.2 Location Autocomplete Component
**File:** `src/app/app/host/add-property/listing-creation-location-input.tsx`

1. Import `normalizeStateCode`.
2. When parsing Google’s `administrative_area_level_1`, set `state = normalizeStateCode(component.short_name) || "";`

### 3.3 Generic Address Entry Box
**File:** `src/components/AddressEntryBox.tsx`

1. Import `US_STATES` and `normalizeStateCode`.
2. Normalize `initialAddress.state` when setting form defaults.
3. When handling changes, only allow codes through the select by normalizing `value`.
4. Update the `<option>` to use `state.code` and display `state.name`.

### 3.4 Overview Edit Handler
**File:** `src/app/app/host/[listingId]/overview/(components)/overview-handlers.ts`

1. Import `normalizeStateCode`.
2. Before calling the update action, run `normalizeStateCode` on `updateData.state`.
3. If the result is falsy, show a destructive toast and abort (don’t hit the server).

*Rationale:* UI normalization improves UX (accepts “California”), prevents invalid drafts, and lowers the chance of unhandled errors by catching issues before hitting the server.

---
## 4. Enforce Validation in Server Actions

Server-side sanitization is the safety net—no matter what payload we receive, the database should never store invalid values.

### 4.1 Draft Transactions
**File:** `src/app/actions/listings-in-creation.ts`

- Import `sanitizeStateInput`.
- After copying `draftDataWithoutRelations`, run `sanitizeStateInput` on the `state` field (if present).
- Behaviour:
  - `undefined` → remove the property (nothing to update).
  - Empty string → store `null` (intentional clear).
  - Invalid string → throw before the transaction runs.

### 4.2 Listing Actions
**File:** `src/app/actions/listings.ts`

Apply the same pattern in three places:
1. `createListingTransaction`
2. `updateListing`
3. `updateListingLocation`

Each should sanitize the state field before Prisma writes happen. Throw `STATE_VALIDATION_ERROR` on invalid strings so the caller can surface a friendly message.

### 4.3 Listing Helpers
**File:** `src/lib/listing-actions-helpers.ts`

- Import `sanitizeStateInput` and `STATE_VALIDATION_ERROR`.
- In `handleSubmitListing`:
  - Sanitize `listingData.state` and throw if the result is null/undefined.
- In `handleSaveDraft`:
  - Sanitize `draftData.state` before building `processedDraftData`.

*Rationale:* Keeping validation in the helper layer + server actions guarantees that even if a new UI slips through later, the database still refuses invalid values.

---
## 5. Strengthen Unit Tests

**File:** `test/lib/listing-actions-helpers.test.ts`

1. Import `STATE_VALIDATION_ERROR` from the new helper.
2. Add targeted cases in the `handleSubmitListing` and `handleSaveDraft` suites:
   - Passing `"Texas"` normalizes to `"TX"`.
   - Passing `"Quebec"` rejects with `STATE_VALIDATION_ERROR`.
3. These tests run fast and cover the most critical paths.

Example additions:
```ts
import { STATE_VALIDATION_ERROR } from '@/lib/us-states';

it('normalizes full state names to codes', async () => {
  const clientData = createFakeAddPropertyClientData();
  clientData.state = 'Texas';
  const result = await handleSubmitListing(clientData, testUserId);
  expect(result.state).toBe('TX');
});

it('rejects invalid state values', async () => {
  const clientData = createFakeAddPropertyClientData();
  clientData.state = 'Quebec';
  await expect(handleSubmitListing(clientData, testUserId)).rejects.toThrow(STATE_VALIDATION_ERROR);
});
```

Repeat similar checks inside the draft tests to ensure drafts behave consistently.

*Rationale:* Tests keep regressions from sneaking in and document the intended behaviour for future contributors.

---
## 6. Testing Checklist

### Automated
- Run the targeted unit suite:
  ```bash
  npm run test:unit -- test/lib/listing-actions-helpers.test.ts
  ```
  (If Vitest workers complain on your machine, temporarily set `VITEST_MAX_THREADS=1` or re-run on a machine without sandbox restrictions.)

### Manual
1. **Add Property Flow:** Navigate to `/app/host/add-property`, progress to the address confirmation step, type `Texas` in the state field, and confirm it stores `TX` in drafts (check network payload or Prisma console if possible).
2. **Edit Existing Listing:** On a host dashboard listing, enter edit mode, change state to a full name, and save. It should succeed and display the code afterward. Try entering `Quebec`; the UI should show an error toast and reject the save.
3. **Draft Persistence:** Save a draft with the state cleared; ensure the draft reloads with the state blank (null persisted, not empty string).

---
## 7. Acceptance Criteria
- A shared list of states and normalization helpers exists in `src/lib/us-states.ts`.
- All host address forms import from the shared helper and no longer define their own state arrays.
- Server-side draft/save/update operations throw `STATE_VALIDATION_ERROR` when given invalid states and otherwise persist uppercase two-letter codes.
- Unit tests cover both happy-path normalization and invalid input rejection.
- Manual smoke tests confirm the add-property flow and listing edit flow behave as expected.

---
## 8. Tips & Troubleshooting
- If you see TypeScript path errors on imports like `@/lib/us-states`, double-check `tsconfig.json`’s path alias configuration; the new file must live under `src/`.
- When a test fails with the validation error, read the stack trace—it should point to the exact mutation that needs sanitizing.
- If Prisma writes still show a full state name, search for other code paths (e.g. guest flows, admin tools) that might need the same treatment. The pattern documented here can be reused elsewhere.
- Keep unrelated git changes out of your commit (especially `stripe` files that may already be modified locally).

Following this playbook end-to-end will deliver consistent state handling across the host experience and protect the database from malformed location data.
