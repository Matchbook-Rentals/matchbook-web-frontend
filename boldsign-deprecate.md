# BoldSign Deprecation Plan

## Executive Summary

BoldSign was previously used as a third-party e-signature service for lease documents. The system has been replaced with a custom PDF-based signing solution. This document outlines the complete removal of BoldSign integration from the codebase.

## Status: Ready for Deprecation

- **Replacement System**: Custom PDF signing with field-based signatures (PDFEditor/PDFEditorSigner components)
- **Database Migration Required**: Yes - remove deprecated models and foreign keys
- **Breaking Changes**: None - BoldSign is already deprecated in production
- **Estimated Effort**: 2-3 hours

---

## Database Changes

### Models to Delete

#### 1. `BoldSignLease` (prisma/schema.prisma:1229)
**Justification**: Explicitly marked as deprecated with comment "Use Match.tenantSignedAt and Match.landlordSignedAt fields instead". Replaced by new `Lease` model and Match timestamp fields.

**Current References**:
- `User.BoldSignLease` (schema.prisma:99)
- `Match.boldSignLease` (schema.prisma:441)
- `HousingRequest.boldSignLease` (schema.prisma:748)

**Migration Steps**:
1. Remove foreign key from Match table
2. Remove foreign key from HousingRequest table
3. Remove relation from User model
4. Drop BoldSignLease table

#### 2. `BoldSignTemplate` (prisma/schema.prisma:1212)
**Justification**: Used for BoldSign template management. No longer needed with custom PDF system.

**Current References**:
- `User.boldSignTemplates` (schema.prisma:98)
- `Listing.boldSignTemplate` (schema.prisma:364)

**Migration Steps**:
1. Remove foreign key from Listing table
2. Remove relation from User model
3. Drop BoldSignTemplate table

---

## Files to Delete

### Core Library

#### `src/lib/boldsign-client.ts`
**Justification**: BoldSign API client wrapper. No longer needed.
- Contains: DocumentApi initialization, API key configuration, error handling
- Used by: All BoldSign API routes

### API Routes

#### `src/app/api/boldsign/webhook/route.ts`
**Justification**: Handles BoldSign webhook events (document signed, viewed, declined). Webhooks no longer received.
- Creates notifications for lease signing events
- Calls `createBookingFromCompletedMatch` (now handled by new lease system)
- 325+ lines of legacy webhook processing

#### `src/app/api/leases/start-flow/route.ts`
**Justification**: Gets BoldSign embed URL for signing. Replaced by PDF signing flow.
- Queries `prisma.boldSignLease`
- Calls `documentApi.getEmbeddedSignLink`

#### `src/app/api/leases/view/route.ts`
**Justification**: Retrieves BoldSign document view URL. Not used in new system.

#### `src/app/api/leases/create-from-upload/route.ts`
**Justification**: Creates BoldSign documents from uploaded PDFs. Replaced by direct PDF handling.

#### `src/app/api/housing-requests/remove-lease/route.ts`
**Justification**: Removes BoldSign lease references. Will be obsolete after model removal.

#### `src/app/api/leases/template/route.ts`
**Justification**: BoldSign template management endpoint.

#### `src/app/api/leases/template/webhook/route.ts`
**Justification**: BoldSign template webhook handler.

#### `src/app/api/leases/document/route.ts`
**Justification**: BoldSign document retrieval endpoint.

### Admin Pages

#### `src/app/admin/boldsign/page.tsx`
**Justification**: Admin dashboard for viewing BoldSign statistics. No longer relevant.

#### `src/app/admin/boldsign/_actions.ts`
**Justification**: Server actions for BoldSign admin operations.
- `getBoldSignStats()` - queries BoldSignLease and BoldSignTemplate
- `deleteAllBoldSignDocuments()` - cleanup utility (can be run before deletion)

#### `src/app/admin/boldsign/delete-all-button.tsx`
**Justification**: UI component for BoldSign cleanup. One-time use only.

### Test Pages

#### `src/app/admin/test/lease-signing/page.tsx`
**Justification**: May contain BoldSign-specific test code. Review and update if needed.

---

## Code Changes Required

### Update: `src/app/actions/bookings.ts`
**Lines to Remove**: References to `createBookingFromCompletedMatch` from BoldSign webhook context
**Justification**: Function still used elsewhere, but BoldSign-specific invocations are obsolete.
**Action**: Remove imports/references only if they're BoldSign-specific.

### Update: `src/app/actions/documents.ts`
**Lines to Check**: Lines 236, 377 (createNotification calls for documents)
**Justification**: Document notifications may be BoldSign-specific. Review context.
**Action**: If notifications are for BoldSign documents only, remove. If used for general documents, keep.

### Update: `src/app/actions/templates.ts`
**Justification**: May contain BoldSign template logic.
**Action**: Grep for BoldSign references and remove.

### Update: `src/app/actions/listings.ts`
**Justification**: Contains BoldSign references (from grep results).
**Action**: Remove BoldSign template associations.

### Update: `src/app/actions/housing-requests.ts`
**Justification**: Contains BoldSign references.
**Action**: Remove BoldSign lease creation/linking logic.

### Update: `src/app/actions/matches.ts`
**Justification**: Contains BoldSign references.
**Action**: Remove BoldSign lease associations.

### Update: `src/components/admin/AdminSidebar.tsx`
**Justification**: Likely has "BoldSign" navigation link.
**Action**: Remove BoldSign admin menu item.

---

## Environment Variables to Remove

### `.env`
- `BOLDSIGN_API_KEY` - Remove from production environment

### `.env.example`
- Add deprecation note or remove BoldSign configuration entirely

---

## NPM Dependencies to Remove

### `package.json`
```json
"boldsign": "^1.0.2"  // Line 79
```
**Justification**: BoldSign SDK no longer needed.
**Action**:
```bash
npm uninstall boldsign
```

---

## Documentation Updates

### `notifications.md`
**Lines to Update**:
- Line 66-71: BoldSign webhook notification references
- Line 73-82: Admin booking management with BoldSign lease references

**Action**: Add deprecation note or remove BoldSign-specific notification documentation.

### `notes/bold-sign.md`
**Action**: Add deprecation notice at top of file or delete entirely.

### `notes/to-do.md`
**Action**: Remove any BoldSign-related todos.

---

## Files to Update (Remove References)

The following files contain BoldSign references that need to be cleaned up:

### Host/Landlord Pages
- `src/app/app/host/host-dashboard-bookings-tab.tsx`
- `src/app/app/host/[listingId]/applications/[housingRequestId]/application-details.tsx`
- `src/app/app/host/[listingId]/applications/[housingRequestId]/application-details-old.tsx`
- `src/app/app/host/[listingId]/sign-lease/[housingRequestId]/page.tsx`
- `src/app/app/host/[listingId]/sign-lease/page.tsx`
- `src/app/app/host/[listingId]/send-lease/page.tsx`
- `src/app/app/host/[listingId]/applications/[housingRequestId]/lease-sent/page.tsx`
- `src/app/app/host/[listingId]/applications/[housingRequestId]/lease-editor/page.tsx`
- `src/app/app/host/[listingId]/(tabs)/bookings-tab.tsx`
- `src/app/app/host/[listingId]/(tabs)/overview-tab.tsx`
- `src/app/app/host/match/[matchId]/host-match-client.tsx`
- `src/app/app/host/match/[matchId]/page.tsx`

### Renter/Tenant Pages
- `src/app/app/rent/applications/[applicationId]/application-details.tsx`
- `src/app/app/rent/match/[matchId]/lease-signing-client-original.tsx` (appears to be legacy)
- `src/app/app/rent/match/[matchId]/pending-host-signature/page.tsx`
- `src/app/app/rent/match/[matchId]/pending-host-signature/pending-host-signature-client.tsx`
- `src/app/match/[matchId]/pending-host-signature/pending-host-signature-client.tsx`
- `src/app/app/rent/old-search/book/[matchId]/booking-client-interface.tsx`
- `src/app/app/rent/old-search/book/[matchId]/(components)/lease-sign-embed.tsx` (likely BoldSign embed)

### API Routes (Match-related)
- `src/app/api/matches/[matchId]/confirm-payment-and-book/route.ts`
- `src/app/api/matches/[matchId]/capture-payment/route.ts`
- `src/app/api/matches/[matchId]/authorize-existing-payment/route.ts`
- `src/app/api/matches/[matchId]/route.ts`
- `src/app/api/matches/[matchId]/callback/route.ts`
- `src/app/api/documents/[id]/view/route.ts`

### Admin Pages
- `src/app/admin/layout.tsx`
- `src/app/admin/booking-management/_actions.ts`
- `src/app/admin/booking-management/[bookingId]/page.tsx`
- `src/app/admin/test/export/_actions.ts`

### Types
- `src/types/index.ts` - May have BoldSign type definitions

### Scripts
- `scripts/debug-host-dashboard.js`
- `scripts/compare-booking-queries.js`
- `scripts/create-booking-from-match.js` - References `createBookingFromCompletedMatch`

### Other Documentation
- `staged-changes-summary.md`
- `links.md`
- `security-audit.md`
- `copyListing.sql` - May have BoldSign schema references

---

## Migration Checklist

### Phase 1: Pre-Deletion Audit
- [ ] Run `getBoldSignStats()` to see if any documents exist
- [ ] Check production database for BoldSignLease/BoldSignTemplate records
- [ ] Archive any necessary lease documents from BoldSign service
- [ ] Verify all active leases use new Lease model

### Phase 2: Database Migration
- [ ] Create Prisma migration to remove BoldSignLease model
- [ ] Create Prisma migration to remove BoldSignTemplate model
- [ ] Remove foreign key references in Match, HousingRequest, User, Listing
- [ ] Run migrations in staging
- [ ] Verify no data loss

### Phase 3: Code Deletion
- [ ] Delete core library: `src/lib/boldsign-client.ts`
- [ ] Delete API routes: `src/app/api/boldsign/*`
- [ ] Delete API routes: `src/app/api/leases/*`
- [ ] Delete admin pages: `src/app/admin/boldsign/*`
- [ ] Uninstall npm package: `npm uninstall boldsign`
- [ ] Remove environment variable: `BOLDSIGN_API_KEY`

### Phase 4: Code Cleanup
- [ ] Update all files in "Files to Update" section
- [ ] Remove BoldSign references from actions
- [ ] Remove BoldSign menu items from admin sidebar
- [ ] Update notifications.md documentation
- [ ] Run full-text search for remaining "boldsign" references
- [ ] Update any remaining TypeScript types

### Phase 5: Testing
- [ ] Test lease signing flow end-to-end
- [ ] Test booking creation from lease
- [ ] Verify no broken imports or references
- [ ] Run build: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Test in staging environment

### Phase 6: Deployment
- [ ] Deploy database migrations
- [ ] Deploy code changes
- [ ] Remove BOLDSIGN_API_KEY from production environment
- [ ] Monitor for errors in production
- [ ] Archive this deprecation document

---

## Rollback Plan

If issues arise after deletion:

1. **Code Rollback**: Revert git commit
2. **Database Rollback**: Prisma migration rollback (requires manual schema restoration)
3. **Environment Rollback**: Restore BOLDSIGN_API_KEY
4. **Package Rollback**: `npm install boldsign@1.0.2`

**Note**: Database rollback is complex. Ensure thorough testing in staging before production deployment.

---

## Notes

- The `Lease` model (schema.prisma:1248) is the official replacement for BoldSignLease
- Current lease signing uses PDF-based field signing via PDFEditor components
- The Match model now tracks signing timestamps directly (tenantSignedAt, landlordSignedAt)
- Recent git commits show active development on the new lease system
- No production traffic should be using BoldSign APIs

---

## References

- Current lease signing: `src/app/app/rent/match/[matchId]/lease-signing-client.tsx`
- New Lease model: `prisma/schema.prisma:1248`
- Deprecated BoldSignLease model: `prisma/schema.prisma:1229`
- BoldSign notes: `notes/bold-sign.md`
