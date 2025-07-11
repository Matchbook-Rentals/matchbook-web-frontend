# Notifications Documentation

This document lists all `createNotification` usage throughout the Matchbook web frontend application, documenting their language content and associated URLs.

## Overview

The `createNotification` function is defined in `/src/app/actions/notifications.ts` and is used across 8 files for various user notifications including housing requests, matches, bookings, lease signatures, and administrative notifications.

## Usage by Source File

### 1. `/src/app/actions/housing-requests.ts`

**Import:** Line 5 - `import { createNotification } from './notifications'`

| Line | Content | URL | Action Type | Context |
|------|---------|-----|-------------|---------|
| 146 | "New Housing Request" | `/app/host/${listing.id}/applications` | 'view' | New application received |
| 353 | "Your application for ${housingRequest.listing.title} has been approved!" | `/app/searches/${housingRequest.tripId}` | 'application_approved' | Application approval |
| 407 | "Your application for ${housingRequest.listing.title} has been declined." | `/app/searches/${housingRequest.tripId}` | 'application_declined' | Application rejection |
| 515 | "Your approval for ${housingRequest.listing.title} has been revoked." | `/app/searches/${housingRequest.tripId}` | 'application_revoked' | Approval revocation |
| 587 | "Your application for ${housingRequest.listing.title} is being reconsidered." | `/app/searches/${housingRequest.tripId}` | 'application_reconsidered' | Application reconsideration |

### 2. `/src/app/actions/matches.ts`

**Import:** Line 7 - `import { createNotification } from './notifications'`

| Line | Content | URL | Action Type | Context |
|------|---------|-----|-------------|---------|
| 57 | "New Match" | `/app/rent/searches/?tab=matchbook&searchId=${trip.id}` | 'view' | New match found |

### 3. `/src/app/api/payment/webhook/route.ts`

**Import:** Line 8 - `import { createNotification } from '@/app/actions/notifications'`

| Line | Content | URL | Action Type | Context |
|------|---------|-----|-------------|---------|
| 143 | "You have a new booking for ${match?.listing.title} from ${match?.trip.startDate} to ${match?.trip.endDate}" | `/app/host-dashboard/${match?.listing.id}?tab=bookings` | 'booking' | Stripe webhook booking |

### 4. `/src/app/api/cron/check-unread-messages/route.ts`

**Import:** Line 3 - `import { createNotification } from '@/app/actions/notifications'`

| Line | Content | URL | Action Type | Context |
|------|---------|-----|-------------|---------|
| 129 | "You have a new message from ${senderName}." | `/app/messages?convo=${message.conversation.id}` | 'message' | Unread message notification (cron job) |

### 5. `/src/app/api/boldsign/webhook/route.ts`

**Import:** Line 3 - `import { createNotification } from '@/app/actions/notifications'`

| Line | Content | URL | Action Type | Context |
|------|---------|-----|-------------|---------|
| 110 | "Application approved! Your lease agreement for ${body.data.messageTitle} is ready for your signature." | `/app/host/match/${boldSignLease.matchId}` | 'application_approved_lease_ready' | Landlord - lease ready |
| 125 | "Congratulations! Your application for ${body.data.messageTitle} has been approved and your lease is ready for signature." | `/app/match/${boldSignLease.matchId}` | 'application_approved_lease_ready' | Tenant - lease ready |
| 217 | "Your lease agreement for ${body.data.messageTitle} is ready for your signature." | `/app/host/match/${boldSignLease.matchId}` | 'lease_signature_required' | Landlord signature needed |
| 236 | "Your lease agreement for ${body.data.messageTitle} is ready for your signature." | `/app/searches/book/${boldSignLease.matchId}` | 'lease_signature_required' | Primary tenant signature needed |
| 252 | "Your lease agreement for ${body.data.messageTitle} is ready for your signature." | `/app/searches/book/${boldSignLease.matchId}` | 'lease_signature_required' | Secondary tenant signature needed |
| 337 | "Congratulations! The lease agreement for ${body.data.messageTitle} has been fully executed by all parties." | `/app/host/match/${boldSignLease.matchId}` or `/app/searches/book/${boldSignLease.matchId}` | 'lease_fully_executed' | Lease completion (multiple users) |

### 6. `/src/app/admin/notifications/_actions.ts`

**Import:** Line 5 - `import { createNotification } from '@/app/actions/notifications'`

| Line | Content | URL | Action Type | Context |
|------|---------|-----|-------------|---------|
| 85 | "${data.title}: ${data.message}" | `${data.actionUrl}` or `/app/dashboard` | `ADMIN_${data.type}` | Single admin notification |
| 139 | "${data.title}: ${data.message}" | `${data.actionUrl}` or `/app/dashboard` | `ADMIN_${data.type}` | Bulk admin notifications |

### 7. `/src/app/actions/bookings.ts`

**Import:** Line 7 - `import { createNotification } from './notifications'`

| Line | Content | URL | Action Type | Context |
|------|---------|-----|-------------|---------|
| 143 | "You have a new booking for ${match?.listing.title} from ${match?.trip.startDate} to ${match?.trip.endDate}" | `/app/host-dashboard/${match?.listing.id}?tab=bookings` | 'booking' | New booking created |
| 201 | ⚠️ **Invalid format** - Missing content | N/A | 'BOOKING_UPDATED' | Booking update (needs fix) |
| 222 | ⚠️ **Invalid format** - Missing content | N/A | 'BOOKING_DELETED' | Booking deletion (needs fix) |
| 480 | "Your move-in has been confirmed! Please authorize your first month's rent payment of $${firstRentPayment.amount}." | `/app/renter/bookings/${bookingId}/authorize-payment` | 'payment_authorization_required' | Payment authorization needed |

### 8. `/src/app/api/leases/create-from-upload/route.ts`

**Import:** Line 4 - `import { createNotification } from '@/app/actions/notifications'`

*Note: This file imports the function but doesn't use it in the current code.*

## Summary Statistics

- **Total Files Using createNotification:** 8 files
- **Total Notification Instances:** 20+ individual calls
- **Languages Used:** English (all notifications)
- **URL Patterns:**
  - Host dashboard routes: `/app/host/`, `/app/host-dashboard/`
  - Renter routes: `/app/searches/`, `/app/rent/`, `/app/renter/`
  - Match routes: `/app/match/`, `/app/host/match/`
  - Message routes: `/app/messages`
  - Admin routes: `/app/dashboard`

## Action Types Used

- `'view'` - General viewing actions
- `'application_approved'` - Application approvals
- `'application_declined'` - Application rejections
- `'application_revoked'` - Approval revocations
- `'application_reconsidered'` - Application reconsiderations
- `'booking'` - Booking-related notifications
- `'message'` - Message notifications
- `'application_approved_lease_ready'` - Lease ready notifications
- `'lease_signature_required'` - Signature required notifications
- `'lease_fully_executed'` - Lease completion notifications
- `'payment_authorization_required'` - Payment authorization notifications
- `ADMIN_*` - Various admin notification types

## Issues Found

**Lines 201 and 222 in `/src/app/actions/bookings.ts`:**
- These calls use invalid schema format
- Missing required `content` field
- Using `type` instead of proper notification schema
- **Recommendation:** Fix these to follow proper createNotification schema

## Related Files

- **Function Definition:** `/src/app/actions/notifications.ts`
- **Database Schema:** Likely in database migration files (not analyzed)
- **Email Templates:** Referenced in cron job for email notifications