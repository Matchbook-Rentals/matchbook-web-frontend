# Admin Test Notifications Documentation

This document tracks all notification types available in the admin test notification system.

## Testing

Test notifications at: **http://localhost:3000/admin/test/notifications**

This test route allows you to preview and send all notification types. When making changes to notification logic, ensure the implementation matches what's configured in the test route.

## Notification Types

| Category | Notification Type | Description | Email Template | Usage |
|----------|------------------|-------------|----------------|-------|
| **Messages** | `message` | New Message | ✅ | `src/app/actions/messages.ts:106`, `src/app/actions/messages.ts:229` (sendMessage, sendMatchMessage); `src/app/api/cron/check-unread-messages/route.ts:148` (unread message cron) |
| **Messages** | `new_conversation` | New Conversation | ✅ | `src/app/actions/matches.ts:57` (createMatch) |
| **Applications** | `view` | Application Received | ✅ | `src/app/actions/applications.ts:1103` (submitApplication) |
| **Applications** | `application_approved` | Application Approved | ✅ | |
| **Applications** | `application_declined` | Application Declined | ✅ | |
| **Applications** | `application_revoked` | Approval Withdrawn | ✅ | |
| **Applications** | `application_updated` | Application Updated | ✅ | |
| **Applications** | `application_approved_lease_ready` | Lease Ready for Signature | ❌ | |
| **Bookings** | `booking_host` | Booking Confirmation (Host) | ✅ | `src/app/actions/bookings.ts:262`, `src/app/actions/bookings.ts:404`, `src/app/actions/bookings.ts:737`, `src/app/actions/bookings.ts:957` (confirmBooking, confirmBookingAsTenant) |
| **Bookings** | `booking_confirmed` | Booking Confirmation (Renter) | ✅ | `src/app/actions/bookings.ts:262`, `src/app/actions/bookings.ts:404`, `src/app/actions/bookings.ts:737`, `src/app/actions/bookings.ts:957` (confirmBooking, confirmBookingAsTenant) |
| **Bookings** | `booking_change_request` | Booking Change Request | ✅ | `src/app/actions/booking-modifications.ts:334` (createBookingModification) |
| **Bookings** | `booking_change_declined` | Booking Change Declined | ✅ | `src/app/actions/booking-modifications.ts:512` (rejectBookingModification) |
| **Bookings** | `booking_change_approved` | Booking Change Approved | ✅ | `src/app/actions/booking-modifications.ts:430` (approveBookingModification) |
| **Bookings** | `move_in_upcoming` | Move-In Reminder | ✅ | |
| **Bookings** | `move_in_upcoming_host` | Move-In Reminder (Host) | ✅ | |
| **Bookings** | `move_out_upcoming` | Move-Out Reminder | ❌ | |
| **Payments** | `payment_success` | Payment Success | ❌ | `src/app/api/payment/webhook/route.ts:143`, `src/app/api/matches/[matchId]/capture-payment/route.ts:126` (payment webhooks, capture payment) |
| **Payments** | `payment_failed` | Payment Failed | ✅ | `src/app/actions/payment-modifications.ts:84`, `src/app/actions/payment-modifications.ts:168`, `src/app/actions/payment-modifications.ts:239` (handlePaymentIssue, retryPayment, markPaymentAsFailed) |
| **Payments** | `payment_failed_severe` | Payment Failed (Second Attempt) | ✅ | |
| **Payments** | `payment_failed_host` | Payment Failed (Host Notification) | ✅ | |
| **Payments** | `payment_failed_host_severe` | Payment Failed Severe (Host) | ✅ | |
| **Payments** | `payment_authorization_required` | Payment Authorization Required | ❌ | |
| **Reviews** | `review_prompt` | Review Prompt (Host) | ✅ | |
| **Reviews** | `review_prompt_renter` | Review Prompt (Renter) | ✅ | |
| **Host** | `listing_approved` | Listing Approved | ✅ | `src/app/actions/housing-requests.ts:192`, `src/app/actions/housing-requests.ts:636`, `src/app/actions/housing-requests.ts:696`, `src/app/actions/housing-requests.ts:807`, `src/app/actions/housing-requests.ts:879` (approveHousingRequest) |
| **Onboarding** | `welcome_renter` | Welcome (Renter) | ✅ | |
| **Admin** | `ADMIN_INFO` | Admin Info | ✅ | `src/app/admin/notifications/_actions.ts:85` (sendTestNotification) |
| **Admin** | `ADMIN_WARNING` | Admin Warning | ✅ | `src/app/admin/notifications/_actions.ts:139` (sendTestNotificationWithEmail) |
| **Admin** | `ADMIN_SUCCESS` | Admin Success | ✅ | `src/app/admin/test/notifications/_actions.ts:210` (sendTestNotification) |

## Legend

- ✅ = Custom email template configured in `src/lib/notification-email-config.ts`
- ❌ = Uses default email template

## Usage Tracking

Update the "Usage" column when these notifications are implemented or used in the application:
- List the files that trigger these notifications
- Note any special implementation details
- Track when notifications are added to production flows

## Additional createNotification Usage

Beyond the notification types listed above, `createNotification` is also called in the following locations:

### Document Management
- `src/app/actions/documents.ts:236` - Document upload notifications
- `src/app/actions/documents.ts:377` - Document status notifications

### Lease Signing & BoldSign Webhooks
- `src/app/api/boldsign/webhook/route.ts:111` - Landlord lease signed notification
- `src/app/api/boldsign/webhook/route.ts:126` - Tenant lease signed notification
- `src/app/api/boldsign/webhook/route.ts:218` - Document viewed notification
- `src/app/api/boldsign/webhook/route.ts:237` - Document signed notification (signer)
- `src/app/api/boldsign/webhook/route.ts:253` - Document signed notification (other party)
- `src/app/api/boldsign/webhook/route.ts:325` - Document declined/expired/revoked notifications

### Admin Booking Management
Multiple notifications in `src/app/admin/booking-management/_actions.ts`:
- Lines 703, 711 - Move-in date change notifications
- Lines 895, 905 - Move-out date change notifications
- Lines 992, 1000 - Lease duration change notifications
- Lines 1367, 1375 - Booking details update notifications
- Lines 1583, 1591 - Booking update notifications
- Lines 1650, 1658 - Additional booking notifications
- Lines 1717, 1725 - Additional booking notifications
- Lines 1784, 1792 - Additional booking notifications

## Files

- **Core Function**: `src/app/actions/notifications.ts:80` (createNotification implementation)
- **Test Actions**: `src/app/admin/test/notifications/_actions.ts`
- **Test UI**: `src/app/admin/test/notifications/page.tsx`
- **Admin Actions**: `src/app/admin/notifications/_actions.ts`
- **Email Config**: `src/lib/notification-email-config.ts`
- **Preview**: `src/app/admin/test/notifications/_preview-actions.ts`