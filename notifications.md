# User Notifications Documentation

This document catalogs all user notifications created throughout the Matchbook application.

## Notification Structure
- **Message**: The notification content displayed to the user
- **Action**: What triggers the notification
- **Link**: The URL the notification navigates to (if applicable)
- **Source**: Where in the codebase the notification is created

---

## Applications & Housing Requests

### Application Submitted (Host Notification)
- **Message**: "New Application - [streetAddress1]"
- **Action**: When a renter submits a housing request/application
- **Link**: `/app/host/[listingId]/applications`
- **Source**: `src/app/actions/housing-requests.ts:170-175` (createHousingRequest)

### Application Approved
- **Message**: "Your application for [listingTitle] has been approved!"
- **Action**: When host approves a housing request (Note: Often combined with lease signing notification via BoldSign webhook)
- **Link**: `/app/rent/searches/[tripId]?tab=matchbook`
- **Source**: `src/app/actions/housing-requests.ts:420-426` (approveHousingRequest)

### Application Declined
- **Message**: "Your application for [listingTitle] has been declined."
- **Action**: When host declines a housing request
- **Link**: `/app/rent/searches/[tripId]`
- **Source**: `src/app/actions/housing-requests.ts:477-483` (declineHousingRequest)

### Application Approval Revoked
- **Message**: "Your approval for [listingTitle] has been revoked."
- **Action**: When host undoes an approval
- **Link**: `/app/rent/searches/[tripId]`
- **Source**: `src/app/actions/housing-requests.ts:585-591` (undoApproval)

### Application Decline Reverted
- **Message**: "Your application for [listingTitle] is being reconsidered."
- **Action**: When host undoes a decline
- **Link**: `/app/rent/searches/[tripId]`
- **Source**: `src/app/actions/housing-requests.ts:657-663` (undoDeclineHousingRequest)

---

## Bookings

### New Booking (Host Notification)
- **Message**: "You have a new booking for [listingTitle] from [startDate] to [endDate]"
- **Action**: When a booking is created (either via lease signing completion or payment completion)
- **Link**: `/app/host-dashboard/[listingId]?tab=bookings`
- **Source**: 
  - `src/app/actions/bookings.ts:414-421` (createBookingFromCompletedMatch)
  - `src/app/actions/documents.ts:125-148` (via document completion)

### Booking Created (General)
- **Message**: Context-dependent notification content
- **Action**: When a booking is created through the createBooking function
- **Link**: `/bookings`
- **Source**: `src/app/actions/bookings.ts:143` (createBooking)

### Move-In Confirmed / Payment Authorization Required
- **Message**: "Your move-in has been confirmed! Please authorize your first month's rent payment of $[amount]."
- **Action**: When host confirms move-in for a booking
- **Link**: `/app/renter/bookings/[bookingId]/authorize-payment`
- **Source**: `src/app/actions/bookings.ts:552-559` (confirmMoveIn)

---

## Lease Signing

### Lease Ready for Signature (Combined with Approval)
- **Message**: 
  - **Landlord**: "Application approved! Your lease agreement for [documentTitle] is ready for your signature."
  - **Tenant**: "Congratulations! Your application for [documentTitle] has been approved and your lease is ready for signature."
- **Action**: When lease document is sent via BoldSign ("Sent" event)
- **Link**: 
  - **Landlord**: `/app/host/match/[matchId]`
  - **Tenant**: `/app/match/[matchId]`
- **Source**: `src/app/api/boldsign/webhook/route.ts:111-137` (BoldSign webhook)
- **ActionType**: `application_approved_lease_ready`

### Document Fully Signed
- **Message**: "The lease document \"[documentTitle]\" has been fully signed. Payment setup is the next step."
- **Action**: When all parties have signed a lease document
- **Link**: `/app/documents/[documentId]`
- **Source**: `src/app/actions/documents.ts:131-135` (sendCompletionNotifications)

### Lease Fully Executed
- **Message**: 
  - With booking: "Your lease for [listingTitle] has been fully executed and your booking is confirmed!"
  - Without booking: "The document \"[documentTitle]\" has been fully executed."
- **Action**: When lease is fully signed and executed (triggers approval if not already approved)
- **Link**: 
  - With booking: `/app/rent/match/[matchId]/complete`
  - Without booking: `/app/documents`
- **Source**: `src/app/actions/documents.ts:265-270` (handleHostSigningCompletion via BoldSign webhook)

---

## Messages

### New Message Notification
- **Message**: "You have a new message from [senderName]."
- **Action**: When a message is unread for more than 2 minutes (via cron job)
- **Link**: `/app/messages?convo=[conversationId]`
- **Source**: `src/app/api/cron/check-unread-messages/route.ts:129` (cron job)
- **Note**: Includes email with additional details like listing title and message content

---

## Payments

### Payment Success (Stripe Webhook)
- **Message**: Varies based on payment type
- **Action**: When a Stripe payment succeeds
- **Link**: Varies
- **Source**: `src/app/api/payment-webhook/route.ts` (webhook handler)

### Payment Failed (Stripe Webhook)
- **Message**: Varies based on payment type
- **Action**: When a Stripe payment fails
- **Link**: Varies
- **Source**: `src/app/api/payment-webhook/route.ts` (webhook handler)

---

## Matches

### Match Created (Renter Notification)
- **Message**: "New Match"
- **Action**: When a match is created between a housing request and a listing
- **Link**: `/app/rent/searches/?tab=matchbook&searchId=[tripId]`
- **Source**: `src/app/actions/matches.ts:52-57` (createMatch)

---

## Admin Notifications

### Custom Admin Notification
- **Message**: "[title]: [message]" (Combined format)
- **Action**: Admin manually creates a notification for a user
- **Link**: Configurable (defaults to `/app/dashboard`)
- **ActionType**: `ADMIN_[type]` format
- **Source**: `src/app/admin/notifications/_actions.ts:82-91` (createAdminNotification)

---

## Client-Side Toast Notifications

### Contact Form Submission
- **Success**: "Message Sent - Thank you for contacting us. We'll get back to you soon."
- **Error**: "Something went wrong - We couldn't send your message. Please try again later."
- **Validation Errors**: Various validation messages for missing fields
- **Action**: When submitting the contact form
- **Source**: `src/components/marketing-landing-components/contact-form.tsx`

### Various UI Toasts
- Multiple components use toast notifications for immediate user feedback
- These are typically for form submissions, errors, and success confirmations
- Source files include various client components with `useToast` hook

---

## Email Notification Preferences

The following notification types respect user email preferences (found in `src/app/actions/notifications.ts:10-45`):

- `message` → emailNewMessageNotifications
- `new_conversation` → emailNewConversationNotifications
- `view` → emailApplicationReceivedNotifications
- `application_approved` → emailApplicationApprovedNotifications
- `application_declined` → emailApplicationDeclinedNotifications
- `application_revoked` → No specific email preference (uses default)
- `application_reconsidered` → No specific email preference (uses default)
- `application_approved_lease_ready` → emailApplicationApprovedNotifications
- `submit_host_review` → emailSubmitHostReviewNotifications
- `submit_renter_review` → emailSubmitRenterReviewNotifications
- `landlord_info_request` → emailLandlordInfoRequestNotifications
- `verification_completed` → emailVerificationCompletedNotifications
- `booking` → emailBookingCompletedNotifications
- `booking_canceled` → emailBookingCanceledNotifications
- `move_out_upcoming` → emailMoveOutUpcomingNotifications
- `move_in_upcoming` → emailMoveInUpcomingNotifications
- `payment_success` → emailPaymentSuccessNotifications
- `payment_failed` → emailPaymentFailedNotifications
- `payment_authorization_required` → No specific email preference (uses default)
- `off_platform_host` → emailOffPlatformHostNotifications
- `lease_fully_executed` → emailBookingCompletedNotifications
- `ADMIN_[type]` → Always sent (bypasses preferences)

---

## Notes

1. All server-side notifications are created using the `createNotification` function from `src/app/actions/notifications.ts`
2. Notifications include both in-app notifications and optional email notifications based on user preferences
3. The `actionType` field is used to map notifications to email preference settings
4. Unread message notifications are sent via a cron job that checks every 2 minutes
5. Some notifications (like admin notifications) bypass preference checks and are always sent