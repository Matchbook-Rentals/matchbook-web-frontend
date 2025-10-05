import { NotificationEmailData } from '@/types';

export interface NotificationEmailConfig {
  subject: string;
  headerText: string;
  contentTitle: string;
  buttonText: string;
  getContentText?: (content: string, notification?: any) => string;
  getHeaderText?: (notification?: any) => string;
  getContentTitle?: (notification?: any) => string;
}

export const NOTIFICATION_EMAIL_CONFIGS: Record<string, NotificationEmailConfig> = {
  // Booking notifications (host-side)
  booking_host: {
    subject: 'Your Booking is Confirmed',
    headerText: 'Your Booking is Confirmed',
    contentTitle: '',
    buttonText: 'View details',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Booking confirmation (renter-side)
  booking_confirmed: {
    subject: 'Your Booking is Confirmed',
    headerText: 'Your Booking is Confirmed',
    contentTitle: '',
    buttonText: 'View booking',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Booking change request notification
  booking_change_request: {
    subject: 'Booking Change Request Received',
    headerText: 'Booking Change Request',
    contentTitle: '',
    buttonText: 'Review Changes',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Booking change declined notification
  booking_change_declined: {
    subject: 'Booking Change Declined',
    headerText: 'Booking Change Declined',
    contentTitle: '',
    buttonText: 'View booking',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Booking change approved notification
  booking_change_approved: {
    subject: 'Booking Change Approved',
    headerText: 'Booking Change Approved',
    contentTitle: '',
    buttonText: 'View booking',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Listing approved notification (for new hosts)
  listing_approved: {
    subject: 'Your Listing Has Been Approved',
    headerText: 'Your Listing is Live!',
    contentTitle: '',
    buttonText: 'See Calendar',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Welcome notification for new renters
  welcome_renter: {
    subject: 'Welcome to MatchBook!',
    headerText: 'Welcome to MatchBook!',
    contentTitle: '',
    buttonText: 'Explore our platform',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Application submitted (renter-side)
  application_submitted: {
    subject: 'A New Application Has Been Submitted',
    headerText: 'Your Application is Submitted',
    contentTitle: '',
    buttonText: 'View Application',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Application/Housing Request notifications
  view: {
    subject: 'A New Application Has Been Submitted',
    headerText: 'New application received',
    contentTitle: '',
    buttonText: 'Review Application',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Message notifications
  message: {
    subject: "You've Got a New Message on MatchBook",
    headerText: "You've Got a New Message on MatchBook",
    contentTitle: '',
    buttonText: 'View Message',
    getContentText: (content, notification) => {
      // Return the actual message content from email data
      return notification?.messageContent || content;
    }
  },

  // New conversation notifications
  new_conversation: {
    subject: 'A New Conversation Has Started',
    headerText: 'A New Conversation Has Started',
    contentTitle: '',
    buttonText: 'Read here',
    getContentText: (content, notification) => {
      // Return the message preview from email data
      return notification?.messagePreview || content;
    }
  },

  // Application approved notifications
  application_approved: {
    subject: "It's a Match!",
    headerText: 'You have a match',
    contentTitle: '',
    buttonText: 'Sign and Book',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Application declined notifications
  application_declined: {
    subject: 'Your Application Was Declined',
    headerText: 'Application Update',
    contentTitle: '',
    buttonText: 'Browse Listings',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Application revoked/withdrawn notifications
  application_revoked: {
    subject: 'Your approval was withdrawn',
    headerText: 'Approval Update',
    contentTitle: '',
    buttonText: 'View Trip',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Application updated notifications
  application_updated: {
    subject: '',  // Will be set dynamically with renter name
    headerText: 'Application Updated',
    contentTitle: '',
    buttonText: 'Review Application',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Review prompt notifications (host-side)
  review_prompt: {
    subject: 'Tell Us How It Went',
    headerText: 'Tell Us How It Went',
    contentTitle: '',
    buttonText: 'Write a review',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Review prompt notifications (renter-side)
  review_prompt_renter: {
    subject: 'Tell Us How It Went',
    headerText: 'Tell Us How It Went',
    contentTitle: '',
    buttonText: 'Start your review',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Payment failure notifications
  payment_failed: {
    subject: 'Payment Issue. Action Required',
    headerText: 'Payment Issue',
    contentTitle: '',
    buttonText: 'Update Payment',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Severe payment failure notifications (second attempt)
  payment_failed_severe: {
    subject: 'Payment Failure. Action Required Immediately',
    headerText: 'Payment Failure',
    contentTitle: '',
    buttonText: 'Update Payment',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Host payment failure notification
  payment_failed_host: {
    subject: '', // Will be set dynamically with listing title
    headerText: 'Payment Issue',
    contentTitle: '',
    buttonText: 'Go to inbox',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Severe host payment failure notification (no more retries)
  payment_failed_host_severe: {
    subject: '', // Will be set dynamically with listing title
    headerText: 'Payment Failure',
    contentTitle: '',
    buttonText: 'Go to inbox',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Move-in upcoming notification
  move_in_upcoming: {
    subject: '', // Will be set dynamically with listing title
    headerText: 'Your Booking is Approaching',
    contentTitle: '',
    buttonText: 'View booking',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Move-in upcoming notification (host)
  move_in_upcoming_host: {
    subject: '', // Will be set dynamically with listing title
    headerText: 'Upcoming Guest Arrival',
    contentTitle: '',
    buttonText: 'Booking details',
    getContentText: (content, notification) => {
      // Content will be formatted in the buildNotificationEmailData function
      return content;
    }
  },

  // Admin notifications
  ADMIN_INFO: {
    subject: 'Information - MatchBook Rentals',
    headerText: 'Information',
    contentTitle: 'Important information',
    buttonText: 'View Details',
    getContentText: (content) => content
  },

  ADMIN_WARNING: {
    subject: 'Warning - MatchBook Rentals',
    headerText: 'Warning',
    contentTitle: 'Important warning',
    buttonText: 'View Details',
    getContentText: (content) => content
  },

  ADMIN_ERROR: {
    subject: 'Error Notification - MatchBook Rentals',
    headerText: 'Error',
    contentTitle: 'Error notification',
    buttonText: 'View Details',
    getContentText: (content) => content
  },

  ADMIN_SUCCESS: {
    subject: 'Success - MatchBook Rentals',
    headerText: 'Success!',
    contentTitle: 'Success notification',
    buttonText: 'View Details',
    getContentText: (content) => content
  },

  // Default fallback
  default: {
    subject: 'New Notification - MatchBook Rentals',
    headerText: 'New Notification',
    contentTitle: 'You have a new notification',
    buttonText: 'View Details',
    getContentText: (content) => content
  }
};

export function getNotificationEmailConfig(actionType: string): NotificationEmailConfig {
  return NOTIFICATION_EMAIL_CONFIGS[actionType] || NOTIFICATION_EMAIL_CONFIGS.default;
}

export function buildNotificationEmailData(
  actionType: string,
  notification: {
    content: string;
    url: string;
  },
  user?: {
    firstName?: string | null;
    verifiedAt?: Date | null;  // Matchbook Verification timestamp (background check + credit report)
  },
  additionalData?: {
    senderName?: string;
    conversationId?: string;
    listingTitle?: string;
    messageContent?: string;
    [key: string]: any;
  }
): NotificationEmailData {
  const config = getNotificationEmailConfig(actionType);
  const notificationContext = { user, ...additionalData };
  
  // Build base email data
  const emailData: NotificationEmailData = {
    companyName: 'MatchBook',
    headerText: config.getHeaderText?.(notificationContext) || config.headerText,
    contentTitle: config.getContentTitle?.(notificationContext) || config.contentTitle,
    contentText: config.getContentText?.(notification.content, notificationContext) || notification.content,
    buttonText: config.buttonText,
    buttonUrl: `${process.env.NEXT_PUBLIC_URL}${notification.url}`,
    companyAddress: '',
    companyCity: 'Ogden, UT 84414',
    companyWebsite: 'matchbookrentals.com'
  };

  // Add special formatting for message notifications
  if (actionType === 'message' && additionalData?.senderName) {
    emailData.senderLine = `From ${additionalData.senderName},`;

    // Add tagLink for conversation with listing title
    if (additionalData.conversationId) {
      const linkText = additionalData.listingTitle
        ? `RE: ${additionalData.listingTitle}`
        : 'RE: Listing you liked';
      emailData.tagLink = {
        text: linkText,
        url: `${process.env.NEXT_PUBLIC_URL}/app/messages?convo=${additionalData.conversationId}`
      };
    }

    // Display message preview (already truncated to 1000 chars in cron job)
    if (additionalData.messagePreview) {
      emailData.contentText = additionalData.messagePreview;
    }
  }

  // Add special formatting for new conversation notifications
  if (actionType === 'new_conversation' && additionalData?.senderName) {
    emailData.senderLine = `From ${additionalData.senderName},`;

    // Add tagLink for conversation with listing title (same as message type)
    if (additionalData.conversationId) {
      const linkText = additionalData.listingTitle
        ? `RE: ${additionalData.listingTitle}`
        : 'RE: Listing you liked';
      emailData.tagLink = {
        text: linkText,
        url: `${process.env.NEXT_PUBLIC_URL}/app/messages?convo=${additionalData.conversationId}`
      };
    }

    // Display message preview (already truncated to 1000 chars in cron job)
    if (additionalData.messagePreview) {
      emailData.contentText = additionalData.messagePreview;
    }
  }

  // Add special formatting for application submitted notifications (renter-side)
  if (actionType === 'application_submitted' && additionalData) {
    const renterName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'the listing';
    const hostFirstName = additionalData.hostFirstName || 'the host';

    // Format the email body
    emailData.contentText = `Hi ${renterName},\nYour application for "${listingTitle}" has been submitted to ${hostFirstName}.`;
  }

  // Add special formatting for application notifications
  if (actionType === 'view' && additionalData) {
    const hostName = user?.firstName || 'there';
    const renterName = additionalData.renterName || 'A renter';
    const listingTitle = additionalData.listingTitle || 'your listing';
    const dateRange = additionalData.dateRange || '';

    // Update subject with listing name
    const config = getNotificationEmailConfig(actionType);
    if (additionalData.listingTitle) {
      // Note: We can't modify the subject here, but we format the body
    }

    // Format the email body
    emailData.contentText = `Hi ${hostName},\n\nYou've received a new application from ${renterName} for your listing${dateRange ? `: ${dateRange}` : ''}.`;
  }

  // Add special formatting for application approved notifications
  if (actionType === 'application_approved' && additionalData) {
    const renterFirstName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'the listing';
    const hostName = additionalData.hostName || 'the host';
    
    // Format the email body
    emailData.contentText = `Hi ${renterFirstName},\n\nGreat news, your application for "${listingTitle}" has been approved by ${hostName}.`;
  }

  // Add special formatting for application declined notifications
  if (actionType === 'application_declined' && additionalData) {
    const renterFirstName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'your listing';

    // Only include FCRA language if user has completed Matchbook Verification
    // verifiedAt indicates user has been run through criminal background check and credit report
    // FCRA (Fair Credit Reporting Act) only applies when credit/background checks have been performed
    // This is different from medallionIdentityVerified (which is just identity verification, not background/credit)
    if (user?.verifiedAt) {
      // Format the email body with FCRA rights for verified users
      emailData.contentText = `Hi ${renterFirstName},\n\nWe appreciate your interest in "${listingTitle}," but unfortunately, the host has decided not to move forward.\n\nYour Rights Under FCRA\n • Free Report: You have the right to obtain a free copy of your consumer report from the reporting agency within 60 days of this notice.\n • Dispute Inaccuracies: You have the right to dispute any information in the report that you believe is incomplete or inaccurate\n\nThere are many great options still available — keep browsing:`;
    } else {
      // No FCRA language for non-verified users (no background/credit check has been run)
      emailData.contentText = `Hi ${renterFirstName},\n\nWe appreciate your interest in "${listingTitle}," but unfortunately, the host has decided not to move forward.\n\nThere are many great options still available — keep browsing:`;
    }
    // Don't override buttonUrl - it's already set correctly from notification.url
    // notification.url is `/app/rent/searches/${tripId}` from housing-requests.ts
  }

  // Add special formatting for application revoked/withdrawn notifications
  if (actionType === 'application_revoked' && additionalData) {
    const renterFirstName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'your listing';
    
    // Format the email body
    emailData.contentText = `Hi ${renterFirstName},\n\nYour approval for ${listingTitle} has been withdrawn.\n\nIf you have questions please reach out to the host.`;
  }

  // Add special formatting for application updated notifications
  if (actionType === 'application_updated' && additionalData) {
    const hostFirstName = user?.firstName || 'there';
    const renterName = additionalData.renterName || 'A renter';
    const listingTitle = additionalData.listingTitle || 'your listing';
    
    // Format the email body
    emailData.contentText = `Hi ${hostFirstName},\n\n${renterName} has made a change to their application to ${listingTitle}.`;
  }

  // Add special formatting for review prompt notifications (host-side)
  if (actionType === 'review_prompt' && additionalData) {
    const renterName = additionalData.renterName || 'The guest';
    const listingTitle = additionalData.listingTitle || 'your listing';
    
    // Format the email body
    emailData.contentText = `${renterName} has checked out of ${listingTitle}.\n\nReady to write a review?`;
  }

  // Add special formatting for review prompt notifications (renter-side)
  if (actionType === 'review_prompt_renter' && additionalData) {
    const renterFirstName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'your recent stay';
    
    // Format the email body
    emailData.contentText = `Hey ${renterFirstName}, how was your stay?\n\nHow was your stay at ${listingTitle}? Ready to rate your host?`;
  }

  // Add special formatting for booking confirmation notifications (renter-side)
  if (actionType === 'booking_confirmed' && additionalData) {
    const listingTitle = additionalData.listingTitle || 'your listing';
    const city = additionalData.city || 'the city';
    const dateRange = additionalData.dateRange || 'your selected dates';
    
    // Format the email body
    emailData.contentText = `You booked ${listingTitle} in ${city} for ${dateRange}.\n\nGet ready for your stay!`;
  }

  // Add special formatting for booking notifications (host-side)
  if (actionType === 'booking_host' && additionalData) {
    const hostName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'your listing';
    const renterName = additionalData.renterName || additionalData.senderName || 'the renter';
    const moveInDate = additionalData.moveInDate || additionalData.dateRange || 'the move-in date';
    
    // Format the email body
    emailData.contentText = `Hi ${hostName},\n\nYour booking for "${listingTitle}" with "${renterName}" is confirmed.\n\nMove-in: ${moveInDate}`;
  }

  // Add special formatting for booking change request notifications
  if (actionType === 'booking_change_request' && additionalData) {
    const firstName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'your booking';
    
    // Format the email body
    emailData.contentText = `Hi ${firstName},\n\nA change has been requested to your booking for "${listingTitle}."\n\nPlease review and approve/decline the request:`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/host-dashboard?tab=bookings`;
  }

  // Add special formatting for booking change declined notifications
  if (actionType === 'booking_change_declined' && additionalData) {
    const firstName = user?.firstName || 'there';
    const declinerName = additionalData.declinerName || additionalData.senderName || 'the other party';
    
    // Format the email body
    emailData.contentText = `Hi ${firstName},\n\nYour requested change has been declined by ${declinerName}.`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/renter/bookings`;
  }

  // Add special formatting for booking change approved notifications
  if (actionType === 'booking_change_approved' && additionalData) {
    const firstName = user?.firstName || 'there';
    const approverName = additionalData.approverName || additionalData.senderName || 'the other party';
    
    // Format the email body
    emailData.contentText = `Hi ${firstName},\n\nYour requested change has been approved by ${approverName}.`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/renter/bookings`;
  }

  // Add special formatting for listing approved notifications
  if (actionType === 'listing_approved' && additionalData) {
    const hostName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'your listing';
    
    // Format the email body
    emailData.contentText = `Hi ${hostName},\n\nYour listing "${listingTitle}" is now live on MatchBook!\n\nPlease ensure your calendar is up to date.`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/host-dashboard?tab=calendar`;
  }

  // Add special formatting for welcome renter notifications
  if (actionType === 'welcome_renter') {
    const firstName = user?.firstName || 'there';
    
    // Format the email body with CEO message
    emailData.contentText = `Hi ${firstName},\n\nWe founded MatchBook out of a need for a reliable, and trustworthy way to find flexible rentals. Our teams' mission is to make renting as easy and seamless as possible. We truly hope you enjoy it!\n\n— Daniel Resner\nMatchBook CEO`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/rent/searches`;
  }

  // Add special formatting for payment failed notifications
  if (actionType === 'payment_failed' && additionalData) {
    const firstName = user?.firstName || 'there';
    const paymentAmount = additionalData.amount || additionalData.paymentAmount || 'your payment';
    const listingTitle = additionalData.listingTitle || 'your listing';
    const nextRetryDate = additionalData.nextRetryDate || 'the next business day';
    
    // Format the email body
    emailData.contentText = `Hi ${firstName},\n\nYour recent payment of $${paymentAmount} for ${listingTitle} could not be processed.\n\nWe will attempt to process this payment again on ${nextRetryDate}.\n\nNeed to change your form of payment? Please update your payment method here to avoid disruptions.`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/payment-methods`;
  }

  // Add special formatting for severe payment failed notifications
  if (actionType === 'payment_failed_severe' && additionalData) {
    const renterName = user?.firstName || 'there';
    const paymentAmount = additionalData.amount || additionalData.paymentAmount || 'your payment';
    const listingTitle = additionalData.listingTitle || 'your listing';
    
    // Format the email body with severe warning
    emailData.contentText = `Hi ${renterName},\n\nWe were unable to process your payment of $${paymentAmount} for ${listingTitle}.\n\nThis was our second attempt.\n\nYour host has been notified. Please update your payment method to avoid disruptions to your stay.\n\nNeed help? We're here for you. Please submit a customer support ticket.`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/payment-methods`;
    emailData.secondaryButtonText = 'Contact Support';
    emailData.secondaryButtonUrl = `${process.env.NEXT_PUBLIC_URL}/app/support`;
  }

  // Add special formatting for host payment failed notifications
  if (actionType === 'payment_failed_host' && additionalData) {
    const hostName = user?.firstName || 'there';
    const renterName = additionalData.renterName || 'The renter';
    const paymentAmount = additionalData.amount || additionalData.paymentAmount || 'the payment';
    const listingTitle = additionalData.listingTitle || 'your listing';
    const nextRetryDate = additionalData.nextRetryDate || 'the next business day';
    
    // Format the email body
    emailData.contentText = `Hi ${hostName},\n\nWe were unable to process ${renterName}'s payment of $${paymentAmount} for ${listingTitle}.\n\nWe will attempt to process this payment again on ${nextRetryDate}.\n\n${renterName} can also update their payment method.\n\nNeed to message ${renterName}?`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/messages`;
  }

  // Add special formatting for severe host payment failed notifications
  if (actionType === 'payment_failed_host_severe' && additionalData) {
    const hostName = user?.firstName || 'there';
    const renterName = additionalData.renterName || 'The renter';
    const paymentAmount = additionalData.amount || additionalData.paymentAmount || 'the payment';
    const listingTitle = additionalData.listingTitle || 'your listing';
    
    // Format the email body
    emailData.contentText = `Hi ${hostName},\n\nWe were unable to process ${renterName}'s payment of $${paymentAmount} for ${listingTitle}.\n\nWe will not attempt to process this payment again until ${renterName} updates their payment method.\n\nNeed to message ${renterName}?`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/messages`;
  }

  // Add special formatting for move-in upcoming notifications
  if (actionType === 'move_in_upcoming' && additionalData) {
    const firstName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'your booking';
    const moveInDate = additionalData.moveInDate || additionalData.date || 'your move-in date';
    
    // Format the email body
    emailData.contentText = `Hi ${firstName}, your booking at ${listingTitle} starts in 3 days.\n\nMove-in is on ${moveInDate}.`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/renter/bookings`;
  }

  // Add special formatting for move-in upcoming notifications (host)
  if (actionType === 'move_in_upcoming_host' && additionalData) {
    const firstName = user?.firstName || 'there';
    const renterName = additionalData.renterName || additionalData.senderName || 'Your guest';
    const moveInDate = additionalData.moveInDate || additionalData.date || 'the scheduled date';
    
    // Format the email body
    emailData.contentText = `Hi ${firstName}, ${renterName} is scheduled to move-in in 3 days.\n\nMove-in is on ${moveInDate}.`;
    emailData.buttonUrl = `${process.env.NEXT_PUBLIC_URL}/app/host-dashboard?tab=bookings`;
  }
  
  return emailData;
}

export function getNotificationEmailSubject(actionType: string, additionalData?: any): string {
  const config = getNotificationEmailConfig(actionType);
  
  // Handle dynamic subject for application notifications
  if (actionType === 'view' && additionalData?.listingTitle) {
    return `A New Application Has Been Submitted for ${additionalData.listingTitle}`;
  }
  
  // Handle dynamic subject for application updated notifications
  if (actionType === 'application_updated' && additionalData?.renterName) {
    return `${additionalData.renterName} has made a change to their application`;
  }
  
  // Handle dynamic subject for host payment failed notifications
  if (actionType === 'payment_failed_host' && additionalData?.listingTitle) {
    return `Payment issue for ${additionalData.listingTitle}`;
  }

  // Handle dynamic subject for severe host payment failed notifications
  if (actionType === 'payment_failed_host_severe' && additionalData?.listingTitle) {
    return `Payment failure for ${additionalData.listingTitle}`;
  }

  // Handle dynamic subject for move-in upcoming notifications
  if (actionType === 'move_in_upcoming' && additionalData?.listingTitle) {
    return `Upcoming booking at ${additionalData.listingTitle}`;
  }

  // Handle dynamic subject for move-in upcoming notifications (host)
  if (actionType === 'move_in_upcoming_host' && additionalData?.listingTitle) {
    return `Upcoming booking for ${additionalData.listingTitle}`;
  }
  
  return config.subject;
}