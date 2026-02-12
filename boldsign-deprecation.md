# BoldSign Full Removal Plan

## Context
BoldSign was the third-party lease signing service, now replaced by an in-house PDF signing system. The new system uses `Match.tenantSignedAt`/`Match.landlordSignedAt` timestamps and `DocumentInstance`/`FieldValue`/`SigningSession` models. The codebase is partially migrated — the new creation and signing flows work, but ~48 files still reference BoldSign. This plan removes all BoldSign code.

**Key finding:** The host-match page (`host-match-client.tsx`) is the only actively-navigated page still calling BoldSign APIs (`/api/leases/start-flow`, `/api/leases/view`). All other BoldSign-calling pages are orphaned/deprecated.

---

## Phase 1: Delete Dead Files

Delete these files/directories entirely — they are BoldSign-only with no shared logic:

**Admin pages:**
- `src/app/admin/boldsign/` (entire directory: `page.tsx`, `_actions.ts`, `delete-all-button.tsx`)

**Core library:**
- `src/lib/boldsign-client.ts`

**API routes (BoldSign-only):**
- `src/app/api/boldsign/webhook/route.ts`
- `src/app/api/leases/template/route.ts`
- `src/app/api/leases/template/webhook/route.ts`
- `src/app/api/leases/create-from-upload/route.ts`
- `src/app/api/leases/document/route.ts`
- `src/app/api/leases/view/route.ts`

**Server actions:**
- `src/app/actions/templates.ts` (BoldSignTemplate CRUD — entire file)

**Deprecated/orphaned UI pages:**
- `src/app/app/rent/old-search/book/[matchId]/(components)/lease-sign-embed.tsx`
- `src/app/app/host/[listingId]/send-lease/page.tsx` (deprecated, not linked)
- `src/app/app/host/[listingId]/sign-lease/` (entire directory, not linked)
- `src/app/app/host/[listingId]/applications/[housingRequestId]/lease-sent/page.tsx` (deprecated)
- `src/app/app/host/[listingId]/applications/[housingRequestId]/lease-editor/page.tsx` (BoldSign editor)
- `src/app/app/host/[listingId]/applications/[housingRequestId]/application-details-old.tsx` (old version)
- `src/app/app/rent/match/[matchId]/lease-signing-client-original.tsx` (legacy)

---

## Phase 2: Surgical Edits — Remove BoldSign References from Active Files

### 2a. Host Match Page (critical — actively used)
**File:** `src/app/app/host/match/[matchId]/host-match-client.tsx`
- Remove all `match.BoldSignLease` checks (~5 references)
- Replace BoldSign document viewing (`/api/leases/view`) with in-house document viewer using `match.leaseDocumentId` → `/api/documents/[id]/view` (matching the renter-side pattern)
- Replace BoldSign signing flow (`/api/leases/start-flow`) with in-house signing or remove if host signing now happens at lease creation time
- Remove BoldSign iframe event listeners (`onDocumentSigned`, etc.)
- **Decision:** Wire up the in-house document system (not just strip BoldSign)

### 2b. API Route — Start Flow (dual-purpose)
**File:** `src/app/api/leases/start-flow/route.ts`
- Remove the BoldSignLease lookup path
- Keep only the `Match.leaseDocumentId` lookup for the new system
- Or delete entirely if host signing no longer uses this route

### 2c. API Route — Document View (dual-purpose)
**File:** `src/app/api/documents/[id]/view/route.ts`
- Remove BoldSignLease fallback logic
- Keep DocumentInstance handling

### 2d. API Route — Remove Lease
**File:** `src/app/api/housing-requests/remove-lease/route.ts`
- Remove BoldSignLease deletion logic
- Keep Match record cleanup if still needed, or delete entire file

### 2e. Match API Routes
- `src/app/api/matches/[matchId]/callback/route.ts` — remove `BoldSignLease?.tenantSigned` check, use `Match.tenantSignedAt`
- `src/app/api/matches/[matchId]/authorize-existing-payment/route.ts` — remove BoldSignLease checks
- `src/app/api/matches/[matchId]/capture-payment/route.ts` — remove BoldSignLease checks
- `src/app/api/matches/[matchId]/route.ts` — remove BoldSignLease includes

### 2f. Server Actions
- `src/app/actions/bookings.ts` — remove ~7 BoldSignLease include/condition lines
- `src/app/actions/listings.ts` — remove `boldSignTemplateId` update and BoldSignLease includes
- `src/app/actions/housing-requests.ts` — remove BoldSignLease deletion logic and `boldSignLeaseId` clearing
- `src/app/actions/matches.ts` — remove BoldSignLease includes from queries
- `src/app/actions/process-payment.ts` — remove commented-out BoldSignLease line

### 2g. Types
**File:** `src/types/index.ts`
- Remove `BoldSignLease` import from `@prisma/client`
- Remove `BoldSignLease?` from `MatchWithRelations` interface

### 2h. Admin Sidebar
**File:** `src/components/admin/AdminSidebar.tsx`
- Remove nav link to `/admin/boldsign` (~L111-112)

### 2i. Pending Host Signature Pages
- `src/app/app/rent/match/[matchId]/pending-host-signature/pending-host-signature-client.tsx` — remove BoldSignLease usage if any (may just need type update)
- `src/app/match/[matchId]/pending-host-signature/pending-host-signature-client.tsx` — same

### 2j. Other Files
- `src/app/admin/booking-management/_actions.ts` — remove BoldSignLease includes
- `src/app/app/host/host-dashboard-bookings-tab.tsx` — remove BoldSignLease references
- `src/app/app/host/[listingId]/(tabs)/overview-tab.tsx` — remove BoldSign template creation (~L85)
- `src/app/host/match/[matchId]/host-match-client.tsx` — remove BoldSignLease checks (if different from app/app version)
- `src/app/host/[listingId]/leases/page.tsx` — remove or delete if BoldSign-only

---

## Phase 3: NPM & Environment Cleanup

- `package.json` — remove `"boldsign": "^1.0.2"` dependency
- `.env` — remove `BOLDSIGN_API_KEY` line
- Run `npm install` to update lockfile

---

## Phase 4: Prisma Schema Migration

**File:** `prisma/schema.prisma`

Remove these model definitions:
- `model BoldSignTemplate { ... }` (~L1721)
- `model BoldSignLease { ... }` (~L1738)

Remove these relation fields:
- User model: `boldSignTemplates BoldSignTemplate[]`, `BoldSignLease BoldSignLease[]`
- Listing model: `boldSignTemplate BoldSignTemplate?`, `boldSignTemplateId String?`
- HousingRequest model: `boldSignLeaseId String? @unique`, `boldSignLease BoldSignLease?`
- Match model: `boldSignLease BoldSignLease?`

Run `npx prisma db push` to apply after review.

---

## Phase 5: Documentation Cleanup

Remove or update BoldSign references in:
- `docs/webhooks/master.md`
- `notifications.md`
- `security-audit.md`
- `changelog.md`
- `notes/to-do.md`
- `notes/bold-sign.md` (delete entirely)
- `links.md`

---

## Verification

After all changes:
1. Run `npx prisma generate` — ensure no schema errors
2. Search codebase for any remaining "boldsign" or "BoldSign" references (grep -ri)
3. Verify host-match page still loads and shows lease documents via in-house system
4. Verify renter signing flow still works (`/app/rent/match/[matchId]/lease-signing`)
5. Verify payment capture routes still check `Match.tenantSignedAt`/`Match.landlordSignedAt`
6. Verify admin sidebar no longer shows BoldSign link
