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
  // Booking notifications
  booking: {
    subject: 'New Booking - MatchBook Rentals',
    headerText: 'New Booking!',
    contentTitle: 'You have a new booking',
    buttonText: 'View Booking',
    getContentText: (content) => content
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
    emailData.footerText = `You have a new message from ${additionalData.senderName}`;
    
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
    
    // Truncate message preview if too long
    if (additionalData.messageContent) {
      const preview = additionalData.messageContent.length > 200 
        ? additionalData.messageContent.substring(0, 197) + '...'
        : additionalData.messageContent;
      emailData.contentText = preview;
    }
  }

  // Add special formatting for new conversation notifications
  if (actionType === 'new_conversation' && additionalData?.senderName) {
    emailData.senderLine = `From ${additionalData.senderName},`;
    emailData.footerText = `You have a new conversation with ${additionalData.senderName}`;
    
    // Truncate message preview if too long
    if (additionalData.messagePreview) {
      const preview = additionalData.messagePreview.length > 200 
        ? additionalData.messagePreview.substring(0, 197) + '...'
        : additionalData.messagePreview;
      emailData.contentText = preview;
    }
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
    emailData.footerText = `New application to ${listingTitle}${dateRange ? ` for ${dateRange}` : ''}`;
  }

  // Add special formatting for application approved notifications
  if (actionType === 'application_approved' && additionalData) {
    const renterFirstName = user?.firstName || 'there';
    const listingTitle = additionalData.listingTitle || 'the listing';
    const hostName = additionalData.hostName || 'the host';
    
    // Format the email body
    emailData.contentText = `Hi ${renterFirstName},\n\nGreat news, your application for "${listingTitle}" has been approved by ${hostName}.`;
    emailData.footerText = `You have a Match!`;
  }
  
  return emailData;
}

export function getNotificationEmailSubject(actionType: string, additionalData?: any): string {
  const config = getNotificationEmailConfig(actionType);
  
  // Handle dynamic subject for application notifications
  if (actionType === 'view' && additionalData?.listingTitle) {
    return `A New Application Has Been Submitted for ${additionalData.listingTitle}`;
  }
  
  return config.subject;
}