# Payment Refactor: Itemized Rent Payment Charges

## Objectives
- Persist per-charge breakdowns on every rent payment so platform, credit-card, and transfer fees can be toggled without recomputing totals.
- Make it trivial to determine which fees have been applied to a payment and when they were added or removed.
- Keep downstream experiences (notably booking creation initiated from `PaymentReviewScreen`) operational while we migrate.

## Current Pain Points
- `RentPayment.amount` currently stores an all-in total. Removing a fee requires recalculating the base amount and reapplying remaining adjustments in code, which is error-prone.
- We do not have a durable source of truth for whether specific fees (platform, card, transfer) were applied. Log statements or derived math are required to infer state.
- Payment review UIs build their breakdowns from ad-hoc calculations, so different surfaces can drift or miscommunicate the totals Stripe expects.

## Proposed Data Model

### Prisma Schema Changes
```prisma
enum RentPaymentChargeCategory {
  BASE_RENT
  SECURITY_DEPOSIT
  PET_RENT
  PET_DEPOSIT
  PLATFORM_FEE
  CREDIT_CARD_FEE
  TRANSFER_FEE
  DISCOUNT          // negative amount
  OTHER
}

model RentPayment {
  id                    String                 @id @default(cuid())
  bookingId             String
  stripePaymentMethodId String?                // Payment method to charge (copied from Match at booking creation)
  totalAmount           Int                    // authoritative total Stripe should collect
  baseAmount            Int                    // sum of non-fee charges we consider prior to surcharges
  dueDate               DateTime
  ...

  charges               RentPaymentCharge[]
}

model RentPaymentCharge {
  id              String                 @id @default(cuid())
  rentPaymentId   String
  category        RentPaymentChargeCategory
  amount          Int                    // always in cents; positive for surcharges, negative for discounts
  isApplied       Boolean                @default(true)
  appliedAt       DateTime               @default(now())
  removedAt       DateTime?
  metadata        Json?

  rentPayment     RentPayment            @relation(fields: [rentPaymentId], references: [id])

  @@index([rentPaymentId])
  @@index([category])
  @@index([isApplied])
}
```

#### Key Notes
- `stripePaymentMethodId` is copied from `Match.stripePaymentMethodId` during booking creation. This allows the cron job to automatically charge rent payments. A retry mechanism (3 attempts with 200ms delays) handles race conditions where the payment method hasn't propagated to the Match record yet.
- `totalAmount` becomes the sum of all `RentPaymentCharge.amount` values where `isApplied = true`. We retain the legacy `amount` column temporarily (with a migration that copies it into `totalAmount` and a shadow column/trigger during rollout) to avoid breaking existing reads.
- `baseAmount` holds the subtotal prior to surcharges so we can easily calculate percentages (for example, credit card fees as a percentage of base rent) without recomputing from scratch.
- `metadata` provides room for Stripe fee ids, justification text, or links to the workflow that introduced the charge.
- Discount handling uses negative amounts; the UI should surface absolute values with contextual copy.

## Lifecycle & Workflow Updates

### Payment Schedule Generation
- When generating rent payments (match confirmation, admin tooling, cron backfills), create a base charge row for rent/security deposit and separate charge rows for each fee.
- Fee calculation functions should return `RentPaymentCharge` definitions rather than raw integers. This makes fee inclusion explicit and testable.
- Store the ID of each fee charge on the object that computed it when needed (for example, to reference the card-fee entry in logs).
- **Payment Method Attachment**: During booking creation, copy `Match.stripePaymentMethodId` to each `RentPayment.stripePaymentMethodId`. This enables automated charging via cron jobs. Implementation includes retry logic to handle race conditions where the Match record hasn't been updated yet.

### Payment Method Management
- **Initial Assignment**: When a booking is created via `PaymentReviewScreen` → `processDirectPayment` → `confirm-payment-and-book`, the payment method ID is:
  1. Attached to the customer in Stripe
  2. Saved to `Match.stripePaymentMethodId`
  3. Copied to each `RentPayment.stripePaymentMethodId` in the payment schedule
- **Updating Payment Methods**: When a renter changes their payment method mid-lease:
  1. Update `RentPayment.stripePaymentMethodId` for future payments
  2. Toggle the `CREDIT_CARD_FEE` charge based on new payment method type:
     - **ACH → Card**: Set `cardFeeCharge.isApplied = true`, calculate fee based on `baseAmount`
     - **Card → ACH**: Set `cardFeeCharge.isApplied = false`, record `removedAt` timestamp
  3. Recalculate `totalAmount` from active charges
  4. Audit trail preserved via charge history (`appliedAt`, `removedAt`)
- **Cron Job Processing**: The automated rent payment cron job (`/api/cron/process-rent-payments`) reads `RentPayment.stripePaymentMethodId` to charge the correct payment method. Payments without a payment method ID are filtered out during processing.
- **Race Condition Handling**: The booking creation endpoint implements a retry mechanism (3 attempts with 200ms delays) to wait for the payment method to propagate from `processDirectPayment` to the Match record before creating rent payments.

### Toggling Fees
- Removing a fee (e.g., waiving the platform fee, or switching from card to ACH) becomes a soft action: mark the corresponding charge `isApplied = false`, set `removedAt`, and recompute `totalAmount` via database trigger or transactionally in code.
- Re-adding the fee flips `isApplied` back to true (or re-inserts a new charge row). Historical audit remains intact.
- **Primary Use Case**: When a renter changes payment method from card to ACH (or vice versa), the system toggles the `CREDIT_CARD_FEE` charge automatically. The fee amount is calculated as a percentage of `baseAmount`, ensuring the total adjusts correctly without manual recalculation.
- Admin tooling should surface the charge list with toggles instead of exposing numeric inputs.

### Payment Processing
- All API endpoints that call Stripe (`processDirectPayment`, `create-payment-session`, rent payment cron jobs) should reference `RentPayment.totalAmount` exclusively.
- For display, read `RentPayment.charges` and group by category. The card-fee toggle on `PaymentReviewScreen` now simply includes or excludes the `CREDIT_CARD_FEE` charge before invoking Stripe.
- `PaymentModification` requests should capture both the delta to `totalAmount` and the specific charges being added, removed, or edited so approvals stay in sync with the new structure.

## Application Touchpoints
- `PaymentReviewScreen` should render from the new charge array. When a guest selects ACH, the UI omits the `CREDIT_CARD_FEE` charge and posts `includeCardFee = false`; the server simply toggles `isApplied` before charging.
- **Booking creation** (`/api/matches/[matchId]/confirm-payment-and-book`) must:
  1. Validate that `Match.stripePaymentMethodId` exists (with retry logic for race conditions)
  2. Persist the charge breakdown when creating initial rent payments
  3. Copy `Match.stripePaymentMethodId` to each `RentPayment.stripePaymentMethodId`
  4. This endpoint is our regression canary—if a booking can be created through `PaymentReviewScreen` with correct totals and payment methods, the refactor passes.
- **Cron jobs** (`preview-rent-payments`, `process-rent-payments`) need to:
  1. Understand the new schema so previews remain accurate
  2. Respect fee toggles when processing payments
  3. Read `RentPayment.stripePaymentMethodId` to charge the correct payment method
  4. Filter out payments without payment methods
- Admin management screens should display the canonical charge list with category labels and timestamps so customer support can explain adjustments.

### Payment Display Data Compatibility

Screens that display payment data must handle both old and new schemas gracefully to prevent runtime errors during migration:

1. **Host Payment Dashboard** (`/app/host/payments`)
   - Currently reads: `RentPayment.amount`
   - Must support: Both `amount` (legacy) and `totalAmount` + `charges[]` (new)
   - Graceful fallback: If `charges` is empty/null, display `amount` field
   - Payment method: Handle null `stripePaymentMethodId` for old payments

2. **Property-Specific Payments** (`/app/host/[listingId]/payments`)
   - Same compatibility requirements as host payments dashboard
   - Must not crash if `charges` array doesn't exist

3. **Renter Booking Details** (`/app/rent/bookings/[bookingId]`)
   - Currently reads: `RentPayment.amount`
   - Must support: Reading from `charges[]` if available, fallback to `amount`
   - Handle missing payment method IDs for historical payments

4. **Payment Modification Requests** (`PaymentModification` flow)
   - When creating modifications, check if charges exist
   - If charges available: Capture specific charge IDs being modified
   - If legacy data: Continue using total amount deltas
   - Store both formats during transition for backwards compatibility

#### Compatibility Requirements

**During Migration:**
- All payment reads must check: `payment.charges?.length > 0 ? calculateFromCharges() : payment.amount`
- Payment method checks: `payment.stripePaymentMethodId ?? 'No payment method'`
- Type guards to handle both schemas
- No breaking changes to existing GraphQL/API responses

**Type-Safe Helpers:**
```typescript
function getPaymentTotal(payment: RentPayment): number {
  // Prefer new structure
  if (payment.charges?.length > 0) {
    return payment.charges
      .filter(c => c.isApplied)
      .reduce((sum, c) => sum + c.amount, 0)
  }
  // Fallback to legacy
  return payment.amount ?? payment.totalAmount ?? 0
}

function getPaymentMethodDisplay(payment: RentPayment): string {
  return payment.stripePaymentMethodId
    ? 'Payment method on file'
    : 'No payment method'
}
```

### Admin Migration Tool

**Purpose:** Provide an admin interface (`/app/admin/test/payment-migration`) to migrate old bookings to the new itemized payment model. Old bookings have two primary issues:
1. Missing `stripePaymentMethodId` on rent payments
2. Lack of itemized `RentPaymentCharge` records

#### Migration Tool Requirements

**1. Booking Identification**
- Query all bookings where associated rent payments:
  - Have `stripePaymentMethodId = null`, OR
  - Have no related `RentPaymentCharge` records (charges array is empty)
- Display count and list of bookings needing migration

**2. Payment Method Migration**
- Source: `Match.stripePaymentMethodId` (payment method from original booking)
- Target: Copy to all `RentPayment.stripePaymentMethodId` for that booking
- Validation: Ensure Match has a payment method before attempting migration
- Handle edge cases: Bookings without associated matches (flag for manual review)

**3. Itemization via Stripe Metadata**
For payments that have been processed (`stripePaymentIntentId` exists), reverse-engineer charges from Stripe PaymentIntent metadata:

```typescript
// Stripe metadata structure (see process-rent-payments cron job)
{
  rentPaymentId: string
  bookingId: string
  type: 'monthly_rent'
  paymentMethodType: 'card' | 'us_bank_account'
  totalAmount: string          // "1234.56"
  platformFeeRate: string      // "1.5%" or "3%"
  platformFeeAmount: string    // "18.52"
  hostAmount: string           // "1216.04"
  bookingDurationMonths: string
}
```

**Charge Reverse-Engineering Logic:**
```typescript
async function reverseEngineerCharges(payment: RentPayment) {
  // If payment was processed, fetch Stripe metadata
  if (payment.stripePaymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId
    )
    const metadata = paymentIntent.metadata

    const totalAmount = parseFloat(metadata.totalAmount) * 100  // Convert to cents
    const platformFeeAmount = parseFloat(metadata.platformFeeAmount) * 100
    const isCard = metadata.paymentMethodType === 'card'

    // Calculate base rent
    let baseAmount = totalAmount - platformFeeAmount
    let cardFee = 0

    if (isCard) {
      // Reverse-engineer card fee (3% self-inclusive)
      // Card fee was calculated as: totalWithFee = base / (1 - 0.03)
      // Therefore: base = totalWithFee * 0.97, fee = totalWithFee * 0.03
      cardFee = Math.round(baseAmount * 0.03 / 0.97)
      baseAmount = baseAmount - cardFee
    }

    return {
      baseAmount,
      charges: [
        { category: 'BASE_RENT', amount: baseAmount, isApplied: true },
        { category: 'PLATFORM_FEE', amount: platformFeeAmount, isApplied: true },
        ...(isCard ? [{ category: 'CREDIT_CARD_FEE', amount: cardFee, isApplied: true }] : [])
      ]
    }
  }

  // Fallback: Payment not yet processed - estimate from booking duration
  const booking = await getBooking(payment.bookingId)
  const durationMonths = calculateDurationMonths(booking.startDate, booking.endDate)
  const platformFeeRate = durationMonths >= 6 ? 0.015 : 0.03

  const baseAmount = Math.round(payment.amount / (1 + platformFeeRate))
  const platformFee = payment.amount - baseAmount

  return {
    baseAmount,
    charges: [
      { category: 'BASE_RENT', amount: baseAmount, isApplied: true },
      { category: 'PLATFORM_FEE', amount: platformFee, isApplied: true }
    ]
  }
}
```

**4. Migration Preview**
Before executing, show:
- Which `stripePaymentMethodId` will be attached (from Match)
- Itemized charge breakdown for each payment (with Stripe metadata source if available)
- Total validation: `sum(charges) === payment.amount`

**5. Migration Execution**
```typescript
async function migrateBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      match: true,
      rentPayments: { include: { charges: true } }
    }
  })

  // Validate match has payment method
  if (!booking.match?.stripePaymentMethodId) {
    throw new Error('Cannot migrate: Match missing payment method')
  }

  await prisma.$transaction(async (tx) => {
    for (const payment of booking.rentPayments) {
      // Skip if already migrated
      if (payment.charges?.length > 0 && payment.stripePaymentMethodId) {
        continue
      }

      const { baseAmount, charges } = await reverseEngineerCharges(payment)

      await tx.rentPayment.update({
        where: { id: payment.id },
        data: {
          stripePaymentMethodId: booking.match.stripePaymentMethodId,
          totalAmount: payment.amount,  // Preserve existing total
          baseAmount: baseAmount,
          charges: {
            create: charges
          }
        }
      })
    }
  })
}
```

**6. Safety Features**
- Dry-run mode: Preview migration without executing
- Confirmation dialog before execution
- Logging: Record all migrations with timestamp and admin user ID
- Validation: Ensure `sum(charges.amount where isApplied=true) === totalAmount`
- Bulk migration: "Migrate All" button with progress indicator
- Error handling: Display specific errors for each failed booking

**7. UI Requirements**
- Dashboard showing migration status:
  - Total bookings
  - Bookings needing payment method migration
  - Bookings needing itemization
  - Fully migrated bookings
- Table of bookings with issues (filterable/sortable)
- Individual "Migrate" button per booking
- Bulk "Migrate All" action
- Migration preview modal before confirmation
- Success/error feedback after migration

## Migration Plan

Given the small number of existing payments, we can use a manual conversion approach rather than complex automated migrations.

1. **Prepare Schema**
   - Add `totalAmount`, `baseAmount`, `stripePaymentMethodId`, new enum, and `RentPaymentCharge` model.
   - **Payment Method Validation**: Before migration, verify all existing `RentPayment` records have a `stripePaymentMethodId`. Any payments missing this field cannot be automatically charged and should be flagged for manual review.

2. **Manual Conversion Script**
   - For each existing `RentPayment`:
     ```typescript
     async function convertToItemizedModel(payment: RentPayment) {
       // Retrieve payment method to determine type
       const paymentMethod = await stripe.paymentMethods.retrieve(payment.stripePaymentMethodId)
       const isCard = paymentMethod.type === 'card'

       // Reverse-engineer the charges from current amount
       const { baseAmount, platformFee, cardFee } = reverseCalculateCharges(
         payment.amount,
         isCard,
         bookingDurationMonths
       )

       // Create itemized charge records
       await createCharges(payment.id, [
         { category: 'BASE_RENT', amount: baseAmount, isApplied: true },
         { category: 'PLATFORM_FEE', amount: platformFee, isApplied: true },
         ...(isCard ? [{ category: 'CREDIT_CARD_FEE', amount: cardFee, isApplied: true }] : [])
       ])

       // Set totalAmount and baseAmount
       await updatePayment(payment.id, {
         totalAmount: payment.amount,  // Preserve existing total
         baseAmount: baseAmount
       })
     }
     ```
   - Run conversion script in a transaction with validation that `sum(charges.amount where isApplied=true) === totalAmount`

3. **Dual-Write Phase**
   - Update payment generation flows to populate both legacy `amount` and new `totalAmount` + charge rows
   - Keep `amount` field for backwards compatibility during transition
   - Add type guards ensuring `amount === totalAmount` until legacy column is dropped

4. **Read Switch**
   - Migrate UI and API consumers to build from `charges` array
   - Update cron jobs and webhooks to use `totalAmount` and itemized charges
   - Once all consumers updated, deprecate `amount` field

5. **Decommission Legacy Column**
   - After confirming no remaining consumers (telemetry, analytics, exports), drop or rename `amount` column
   - Remove dual-write logic and type guards

## Testing Strategy
- Unit tests for charge builders ensuring totals match charge sums and that toggling a fee only flips the relevant charge.
- Integration tests covering payment plan creation during match confirmation, ensuring charge rows persist as expected.
- UI contract tests for `PaymentReviewScreen` verifying that ACH vs card selection mutates the charge list and total amount coherently.
- End-to-end flow: run through the booking creation path from `PaymentReviewScreen` (card and ACH) to ensure Stripe amounts, stored charges, and resulting booking ledger match expectations.

## Open Questions
- Do we need change-tracking beyond `isApplied`/`removedAt` (for example, storing who toggled a fee)? We can add `updatedBy` to charge rows if required.
- Should discounts live as negative charges or a separate `Discount` table with approval history?
- How do we represent fees that Stripe reports back (e.g., exact card processing costs) post-settlement? A future iteration could reconcile against actual Stripe fees using `metadata`.

## Next Steps
1. Finalize schema decisions (naming, enum coverage, whether `baseAmount` stays on `RentPayment` or is derived).
2. Implement migrations and backfill script in a feature branch.
3. Update fee calculation helpers and `PaymentReviewScreen` to consume `charges`.
4. Execute the booking creation flow end-to-end to confirm the refactor works before rollout.
