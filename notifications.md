# Admin Test Notifications Documentation

This document tracks all notification types available in the admin test notification system (`/admin/test/notifications`).

## Notification Types

| Category | Notification Type | Description | Email Template | Usage |
|----------|------------------|-------------|----------------|-------|
| **Messages** | `message` | New Message | ✅ | |
| **Messages** | `new_conversation` | New Conversation | ✅ | |
| **Applications** | `view` | Application Received | ✅ | |
| **Applications** | `application_approved` | Application Approved | ✅ | |
| **Applications** | `application_declined` | Application Declined | ✅ | |
| **Applications** | `application_revoked` | Approval Withdrawn | ✅ | |
| **Applications** | `application_updated` | Application Updated | ✅ | |
| **Applications** | `application_approved_lease_ready` | Lease Ready for Signature | ❌ | |
| **Bookings** | `booking_host` | Booking Confirmation (Host) | ✅ | |
| **Bookings** | `booking_confirmed` | Booking Confirmation (Renter) | ✅ | |
| **Bookings** | `booking_change_request` | Booking Change Request | ✅ | `src/app/actions/booking-modifications.ts:324-340` (createBookingModification) |
| **Bookings** | `booking_change_declined` | Booking Change Declined | ✅ | `src/app/actions/booking-modifications.ts:468-484` (rejectBookingModification) |
| **Bookings** | `booking_change_approved` | Booking Change Approved | ✅ | `src/app/actions/booking-modifications.ts:401-425` (approveBookingModification) |
| **Bookings** | `move_in_upcoming` | Move-In Reminder | ✅ | |
| **Bookings** | `move_in_upcoming_host` | Move-In Reminder (Host) | ✅ | |
| **Bookings** | `move_out_upcoming` | Move-Out Reminder | ❌ | |
| **Payments** | `payment_success` | Payment Success | ❌ | |
| **Payments** | `payment_failed` | Payment Failed | ✅ | |
| **Payments** | `payment_failed_severe` | Payment Failed (Second Attempt) | ✅ | |
| **Payments** | `payment_failed_host` | Payment Failed (Host Notification) | ✅ | |
| **Payments** | `payment_failed_host_severe` | Payment Failed Severe (Host) | ✅ | |
| **Payments** | `payment_authorization_required` | Payment Authorization Required | ❌ | |
| **Reviews** | `review_prompt` | Review Prompt (Host) | ✅ | |
| **Reviews** | `review_prompt_renter` | Review Prompt (Renter) | ✅ | |
| **Host** | `listing_approved` | Listing Approved | ✅ | |
| **Onboarding** | `welcome_renter` | Welcome (Renter) | ✅ | |
| **Admin** | `ADMIN_INFO` | Admin Info | ✅ | |
| **Admin** | `ADMIN_WARNING` | Admin Warning | ✅ | |
| **Admin** | `ADMIN_SUCCESS` | Admin Success | ✅ | |

## Legend

- ✅ = Custom email template configured in `src/lib/notification-email-config.ts`
- ❌ = Uses default email template

## Usage Tracking

Update the "Usage" column when these notifications are implemented or used in the application:
- List the files that trigger these notifications
- Note any special implementation details
- Track when notifications are added to production flows

## Files

- **Actions**: `src/app/admin/test/notifications/_actions.ts`
- **UI**: `src/app/admin/test/notifications/page.tsx`
- **Email Config**: `src/lib/notification-email-config.ts`
- **Preview**: `src/app/admin/test/notifications/_preview-actions.ts`