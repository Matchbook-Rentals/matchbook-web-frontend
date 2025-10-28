# Migrating Identity Verification from Medallion to Stripe ID

This guide lays out the end-to-end plan for retiring the Medallion identity verification integration and adopting [Stripe Identity](https://stripe.com/identity). It focuses on actionable steps that the Matchbook web team can execute across configuration, backend, frontend, data, and operational workflows.

---

## 1. Why Switch

- **Unified payments + compliance**: Reduce the number of vendors we manage and take advantage of Stripe's single contract and reporting.
- **Global coverage & compliance**: Stripe Identity maintains updated verification rules per jurisdiction, a Medallion pain point flagged by Ops.
- **Better developer ergonomics**: Official SDKs, TypeScript types, webhook consistency, and built-in test fixtures streamline development compared to Medallion's bespoke SDK.
- **Risk controls**: Built-in fraud signals, watchlist screening, and optional biometric checks we had to custom-build with Medallion.

---

## 2. Current Medallion Footprint

Use this section as a checklist to ensure every Medallion dependency is replaced:

- **User data model**: `prisma/schema.prisma:75-86` maintains `medallionUserId`, `medallionUserAccessCode`, `medallionVerificationToken`, and DOB formatting helpers.
- **Server actions / API routes**:
  - JWT flow in `src/components/medallion-verification.tsx`.
  - Low-code SDK flow in `src/components/medallion-verification-sdk.tsx`.
  - Admin dashboards under `src/app/admin/medallion/` and `src/app/admin/authenticate-integration/`.
  - Webhook handler at `/api/medallion/webhook` (see `docs/webhooks/master.md` for event mapping).
- **Environment variables**: `MEDALLION_*` secrets in `.env` and deployment configs.
- **Docs**: `MEDALLION_SDK_SETUP.md`, changelog entries, and onboarding runbooks.

Everything listed above either needs to be deleted, migrated, or clearly deprecated once Stripe Identity is live.

---

## 3. Target Stripe Identity Architecture

Stripe Identity revolves around two core objects:

1. **Verification Sessions** (`identity.verification_session`): lifecycle state machine our app creates and tracks.
2. **Verification Reports** (`identity.verification_report`): immutable record containing document data, selfies, and decisioning metadata.

For Matchbook:

- **Initiation**: Server action creates a verification session via Stripe SDK (Node `stripe.identity.verificationSessions.create`).
- **Client handoff**: Frontend renders Stripe's [Verification Modal](https://docs.stripe.com/identity/verify-identity-documents?platform=web&ui=stripe-hosted) or hosted link.
- **Webhook ingestion**: `/api/stripe/webhook` processes `identity.verification_session.*` events to persist status transitions.
- **Decision**: We treat `verified` as success, `requires_input` as retry prompt, and escalate `canceled` / `failed` to support workflows.

---

## 4. Prerequisites & Configuration

- Stripe Identity must be enabled in the Stripe Dashboard (requires compliance approval).
- **API keys**: Ensure `STRIPE_SECRET_KEY` supports Identity (test + live). Rotate keys in Doppler/Vercel.
- **Webhook signing secret**: Add `STRIPE_WEBHOOK_SECRET_IDENTITY` dedicated to Identity events.
- **Allowed origins**: Configure webhook endpoint for each environment (dev, staging, prod).
- **Compliance**: Confirm with Legal that Stripe Identity ToS satisfy marketplace KYC obligations.
- **Team access**: Grant engineers access to the Identity Logs section in Stripe.

---

## 5. Data Model Updates

1. Extend `User` model in `prisma/schema.prisma`:
   - Deprecate Medallion fields (migrate data before removal).
   - Add:
     ```prisma
     stripeVerificationSessionId String?
     stripeVerificationStatus    String?   // 'requires_input' | 'processing' | 'verified' | 'canceled' | 'failed'
     stripeVerificationLastCheck DateTime?
     stripeVerificationReportId  String?
     stripeIdentityPayload       Json?
     ```
   - Add supporting enums if stricter typing is preferred.
2. Generate migration via `prisma migrate dev` and plan corresponding production migration.
3. Create backfill script to map Medallion-verified users to a synthetic `verified` Stripe state (so existing hosts stay approved).

**Important:** The onboarding completion logic (`isHostOnboardingComplete`) checks:
- Stripe Account setup
- Stripe onboarding complete
- Identity verified via **either** Medallion OR Stripe Identity (dual system)

It does **NOT** check `agreedToHostTerms` - this field exists for legal record-keeping but is not a blocker for accessing host features.

---

## 6. Backend Implementation Plan

1. **Stripe client**: Update `src/lib/stripe.ts` (or create if missing) to initialize Stripe with API version supporting Identity.
2. **Server action** (e.g., `src/app/(auth)/verify/stripe-actions.ts`):
   - `createStripeVerificationSession(userId)` calls `stripe.identity.verificationSessions.create`.
   - Persist session ID + initial status.
   - Return client secret or hosted link to the caller.
3. **Webhook handler**:
   - Extend existing `/api/stripe/webhook` to handle `identity.verification_session.processing/verified/requires_input/canceled`.
   - Normalize payload into Prisma updates and emit analytics events.
   - Remove Medallion webhook once Stripe is authoritative.
4. **Admin tools**:
   - Create Stripe Identity management page mirroring Medallion admin functionality.
   - Provide manual reset/retry buttons (`stripe.identity.verificationSessions.cancel` + `create` new).
5. **Audit logging**:
   - Ensure every state change is recorded (existing observability pipeline should work once fields are renamed).

---

## 7. Frontend Changes

- Replace `MedallionVerification` components with a new `StripeIdentityVerification` component under `src/components/`.
  - Use Stripe.js + `loadStripe` with the publishable key.
  - Present a CTA that either opens the Stripe verification modal or redirects to `verification_session.url`.
  - Handle retry flows when session status is `requires_input`.
  - Update UI copy to reference Stripe.
- Update protected routes that read Medallion fields (`src/app/profile/verification`, host onboarding flows) to consume the new `stripeVerificationStatus`.
- Remove Medallion-specific toasts, icons, and help text.

---

## 8. Migration & Rollout Strategy

1. **Dual-run (recommended)**:
   - For a limited beta cohort, create both Medallion and Stripe sessions.
   - Gate the frontend with a feature flag (`useFeatureFlag('stripeIdentity')`) to fall back quickly.
2. **Data migration**:
   - Mark all currently verified users as `stripeVerificationStatus = 'verified'`.
   - Archive Medallion identifiers in a separate table or object storage for compliance retention.
3. **Progressive rollout**:
   - Stage → internal dogfood → 5% new hosts → 100% new hosts → migrate existing hosts who need reverification.
4. **Monitoring**:
   - Add dashboards for failure rates (`requires_input` vs `failed`), time-to-verify, and webhook latencies.
   - Set PagerDuty alerts for webhook delivery failures or sustained `requires_input` spikes.
5. **Decommission**:
   - After 30 days of stable Stripe verification, remove Medallion secrets, code, and docs.
   - Notify Finance/Ops to terminate the Medallion contract.

---

## 9. Testing Plan

- **Unit tests**: Mock Stripe SDK to cover session creation logic and error handling.
- **Integration tests** (`npm run test:integration`):
  - Simulate webhook payloads (Stripe provides fixtures via `stripe trigger identity_verification_session.verified`).
  - Validate database updates and user state transitions.
- **E2E tests** (`npm run test:e2e`):
  - Use Stripe test identity documents to complete the flow in CI.
  - Cover retry/cancel flows.
- **Manual QA**: Checklist for Ops to confirm document uploads, failure messaging, admin overrides, and analytics events.

---

## 10. Risks & Mitigations

- **Webhook delivery**: Use Stripe CLI replay + set up automatic retries in case of downtime.
- **Regulatory gaps**: Validate Stripe supports every market we operate in before cutting over. Keep Medallion available in markets not yet supported.
- **User experience changes**: Stripe's UI copy differs; update help articles and support macros ahead of launch.
- **Data retention**: Confirm Medallion exports are archived to comply with KYC retention requirements.
- **Cost monitoring**: Identity pricing may differ; have Finance review during beta.

---

## 11. Timeline (Suggested)

| Week | Milestone |
| ---- | --------- |
| 1 | Enable Stripe Identity, scaffold Prisma changes, feature flag ready |
| 2 | Implement backend session + webhook handling, unit tests passing |
| 3 | Build new frontend component, stage environment testing |
| 4 | Beta rollout with dual-run, monitor metrics |
| 5 | Full rollout, remove Medallion entry points (keep backend read-only) |
| 6 | Cleanup: delete Medallion code paths, revoke secrets, finalize docs |

---

## 12. Clean-Up Checklist

- Remove Medallion files/components (`src/components/medallion-*`, `src/app/admin/medallion/`).
- Delete Medallion secrets from `.env`, Doppler, Vercel, GitHub Actions.
- Drop Medallion columns in Prisma once no longer needed.
- Update documentation (`MEDALLION_SDK_SETUP.md`, wiki pages) to reference Stripe Identity.
- Notify support + ops channels about the completion of the migration.

---

## References

- Stripe Identity docs: https://docs.stripe.com/identity
- Existing Stripe integration practices: `STRIPE_DEBUGGING_GUIDE.md`
- Current webhook architecture: `docs/webhooks/master.md`

