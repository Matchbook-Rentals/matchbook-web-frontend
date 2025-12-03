# Renter Verification Flow

This document describes the verification flow for renters, including all steps and the components responsible for each.

## Overview

The verification flow allows renters to complete background screening (credit check, criminal history, evictions) for a one-time fee of $25. The verification is valid for 90 days and can be reused across multiple applications.

## Flow Diagram

```
┌─────────────────────┐
│    page.tsx         │  Server Component: Fetches payment methods, user data
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  VerificationFlow   │  Client Component: Main orchestrator, manages step state
└──────────┬──────────┘
           │
           ▼
    ┌──────┴──────┬──────────────┬──────────────┬──────────────┐
    ▼             ▼              ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Personal│  │Background│  │  Credit  │  │Processing│  │ Results  │
│  Info  │  │   Auth   │  │   Auth   │  │  Screen  │  │  Screen  │
└────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## Steps

### Step 1: Personal Information
**Component:** `VerificationFlow.tsx` → `CurrentAddressSection.tsx`

User enters:
- First name, Last name
- Date of birth
- SSN (9 digits)
- Current address (street, city, state, zip)

**Dev Mode:** A "Skip (Dev)" button opens a modal to select iSoftPull test clients for quick testing.

---

### Step 2: Background Check Authorization
**Component:** `AuthorizationStepScreen.tsx` → `BackgroundCheckAuthorizationContent.tsx`

User reviews and accepts the background check authorization disclosure. Must check the authorization checkbox to proceed.

**Form Field:** `backgroundCheckAuthorization` (boolean)

---

### Step 3: Credit Check Authorization
**Component:** `AuthorizationStepScreen.tsx` → `CreditCheckAuthorizationContent.tsx`

User reviews and accepts the credit check (FCRA) authorization disclosure. Must check the authorization checkbox to proceed.

**Form Field:** `creditAuthorizationAcknowledgment` (boolean)

---

### Step 4: Processing (Payment + API Calls)
**Component:** `ProcessingScreen.tsx`

This step has multiple sub-steps:

#### 4a. Payment Selection (`select-payment`)
**Sub-component:** `VerificationPaymentSelector`

User selects a payment method:
- Existing saved cards (fetched server-side from Stripe)
- Add new card via Stripe Elements

#### 4b. Payment Processing (`payment`)
**API Route:** `/api/verification/charge-payment-method`

1. Creates a PaymentIntent with the selected payment method
2. Confirms payment via Stripe.js
3. Polls `/api/verification/payment-status` until success

#### 4c. Credit Check (`isoftpull`)
**API Route:** `/api/verification/isoftpull`

Calls iSoftPull API for soft credit pull:
- Converts state abbreviation to full name (iSoftPull requirement)
- Returns credit bucket (Exceptional, Very Good, Good, Fair, Poor)
- Saves `creditBucket` and `creditReportUrl` to database

**Database Updates:**
- `CreditReport` model: creditBucket, creditUpdatedAt
- `Verification` model: creditReportUrl, creditBucket, creditStatus, creditCheckedAt

#### 4d. Background Check (`accio`)
**Status:** Currently mocked (simulated delay)

Will call Accio Data API for:
- Criminal history search
- Eviction records

#### 4e. Completion (`complete`)
Auto-advances to results screen after 1.5 seconds.

---

### Step 5: Results Summary
**Component:** `VerificationResultsScreen.tsx`

Displays verification summary card with:
- User avatar and name
- "Verified" badge
- Credit range (from iSoftPull data)
- Evictions status (mocked until Accio integration)
- Criminal record status (mocked until Accio integration)
- Screening date and expiration (90 days)
- Download and View buttons

---

### Step 6: Details View
**Component:** `VerificationDetailsScreen.tsx`

Expanded view with:
- `RenterVerificationSection`: Full user profile display
- `ScreeningResultsSection`: Detailed screening results

---

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/verification/charge-payment-method` | Create PaymentIntent and charge saved card |
| `/api/verification/payment-status` | Poll payment status |
| `/api/verification/isoftpull` | Soft credit pull via iSoftPull |
| `/api/verification/submit` | Legacy verification submission |
| `/api/verification/status` | Check verification status |

---

## Data Flow

```
VerificationFlow (state owner)
    │
    ├── form: react-hook-form instance
    ├── creditData: ISoftPullResponse | null
    ├── currentStep: Step
    │
    └── ProcessingScreen
            │
            ├── onCreditDataReceived(data) → setCreditData()
            │
            └── VerificationResultsScreen
                    │
                    └── creditData prop → displays credit range
```

---

## iSoftPull Test Clients

For development testing, use these test applicants:

| Name | SSN | Credit Score |
|------|-----|--------------|
| Steve Johnson | 111111111 | ~700 (Good) |
| John Dough | 222222222 | ~600 (Fair) |
| Susie Que | 333333333 | ~500 (Poor) |
| Chris Iceman | 444444444 | Frozen |
| Jeff Nascore | 555555555 | No Score |

All test clients use Carlsbad, CA addresses.

---

## File Structure

```
src/app/app/rent/verification/
├── page.tsx                          # Server component entry
├── verification-client.tsx           # Legacy client (deprecated)
├── utils.ts                          # Form schema & types
├── README.md                         # This documentation
│
└── components/
    ├── VerificationFlow.tsx          # Main orchestrator
    ├── VerificationFooter.tsx        # Fixed footer with nav buttons
    ├── ProcessingScreen.tsx          # Payment + API processing
    ├── VerificationResultsScreen.tsx # Results summary card
    ├── AuthorizationStepScreen.tsx   # Reusable auth step wrapper
    │
    ├── sections/
    │   ├── CurrentAddressSection.tsx # Personal info form
    │   └── PersonalInformationSection.tsx
    │
    ├── legal/
    │   ├── BackgroundCheckAuthorizationContent.tsx
    │   └── CreditCheckAuthorizationContent.tsx
    │
    └── details/
        ├── VerificationDetailsScreen.tsx
        └── sections/
            ├── RenterVerificationSection.tsx
            └── ScreeningResultsSection.tsx

src/app/api/verification/
├── isoftpull/route.ts          # iSoftPull credit check
├── charge-payment-method/route.ts
├── payment-status/route.ts
├── submit/route.ts
└── status/route.ts

src/types/
└── isoftpull.ts                # TypeScript interfaces for iSoftPull response
```

---

## Database Models

### Verification
- `creditReportUrl` - Link to iSoftPull report
- `creditBucket` - Credit tier (Exceptional, Very Good, Good, Fair, Poor)
- `creditStatus` - Processing status
- `creditCheckedAt` - Timestamp

### CreditReport
- `creditBucket` - Credit tier
- `creditUpdatedAt` - Timestamp

---

## TODO / Future Work

1. **Accio Data Integration** - Replace mocked criminal/eviction checks with real API calls
2. **Store full iSoftPull response** - Currently only storing bucket and URL
3. **Background check webhooks** - For async Accio Data results
4. **PDF generation** - For downloadable verification reports
