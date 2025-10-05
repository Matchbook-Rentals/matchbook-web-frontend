/**
 * Notification Email Data Builders
 *
 * Single source of truth for notification emailData structure.
 * Both test notifications and production notifications use these same builders.
 *
 * Related files:
 * - Test UI: src/app/admin/test/notifications/page.tsx
 * - Test Actions: src/app/admin/test/notifications/_actions.ts
 * - Production: src/app/api/cron/check-unread-messages/route.ts
 */

export interface NotificationEmailData {
  senderName?: string;
  messagePreview?: string;
  messageContent?: string;
  conversationId?: string;
  listingTitle?: string;
  renterName?: string;
  dateRange?: string;
  hostName?: string;
  amount?: string;
  [key: string]: any; // Allow additional fields for flexibility
}

/**
 * Build the emailData structure for a specific notification type.
 * This ensures consistency between test notifications and production notifications.
 *
 * @param actionType - The notification type (e.g., 'message', 'new_conversation')
 * @param data - The data to include in the email
 * @returns Properly structured emailData object for this notification type
 */
export function buildNotificationEmailData(
  actionType: string,
  data: NotificationEmailData
): Record<string, any> {

  switch (actionType) {
    case 'message':
      return {
        senderName: data.senderName,
        conversationId: data.conversationId,
        listingTitle: data.listingTitle,
        messagePreview: data.messagePreview || data.messageContent
      };

    case 'new_conversation':
      return {
        senderName: data.senderName,
        conversationId: data.conversationId,
        listingTitle: data.listingTitle,
        messagePreview: data.messagePreview || data.messageContent
      };

    case 'application_submitted':
      return {
        listingTitle: data.listingTitle,
        renterName: data.renterName || data.senderName,
        hostFirstName: data.hostFirstName
      };

    case 'view': // Application received
      return {
        listingTitle: data.listingTitle,
        renterName: data.renterName || data.senderName,
        dateRange: data.dateRange
      };

    case 'application_approved':
      return {
        listingTitle: data.listingTitle,
        hostName: data.hostName || data.senderName
      };

    case 'application_declined':
      return {
        listingTitle: data.listingTitle
      };

    case 'application_revoked':
      return {
        listingTitle: data.listingTitle
      };

    case 'application_updated':
      return {
        listingTitle: data.listingTitle,
        renterName: data.renterName || data.senderName
      };

    case 'booking_host':
      return {
        listingTitle: data.listingTitle,
        renterName: data.renterName || data.senderName,
        moveInDate: data.moveInDate || data.amount // Support both production and tests
      };

    case 'booking_confirmed':
      return {
        listingTitle: data.listingTitle,
        city: data.city || data.messageContent, // Support both production and tests
        dateRange: data.dateRange || data.amount // Support both production and tests
      };

    case 'booking_change_request':
      return {
        listingTitle: data.listingTitle
      };

    case 'booking_change_declined':
      return {
        renterName: data.renterName || data.senderName
      };

    case 'booking_change_approved':
      return {
        renterName: data.renterName || data.senderName
      };

    case 'move_in_upcoming':
      return {
        listingTitle: data.listingTitle
      };

    case 'move_in_upcoming_host':
      return {
        listingTitle: data.listingTitle,
        renterName: data.renterName || data.senderName
      };

    case 'move_out_upcoming':
      return {
        listingTitle: data.listingTitle
      };

    case 'payment_success':
      return {
        amount: data.amount,
        listingTitle: data.listingTitle
      };

    case 'payment_failed':
    case 'payment_failed_severe':
      return {
        amount: data.amount,
        listingTitle: data.listingTitle
      };

    case 'payment_failed_host':
    case 'payment_failed_host_severe':
      return {
        amount: data.amount,
        listingTitle: data.listingTitle,
        renterName: data.renterName || data.senderName
      };

    case 'payment_authorization_required':
      return {
        amount: data.amount,
        listingTitle: data.listingTitle
      };

    case 'review_prompt':
      return {
        renterName: data.renterName,
        listingTitle: data.listingTitle
      };

    case 'review_prompt_renter':
      return {
        listingTitle: data.listingTitle
      };

    case 'listing_approved':
      return {
        listingTitle: data.listingTitle
      };

    case 'welcome_renter':
      return {};

    case 'ADMIN_INFO':
    case 'ADMIN_WARNING':
    case 'ADMIN_SUCCESS':
      return {
        messageContent: data.messageContent || data.messagePreview
      };

    default:
      // For any unknown types, pass through all provided data
      return { ...data };
  }
}
