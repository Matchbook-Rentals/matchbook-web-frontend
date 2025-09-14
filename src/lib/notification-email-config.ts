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
    subject: 'New Application - MatchBook Rentals', 
    headerText: 'New Application!',
    contentTitle: 'You have a new rental application',
    buttonText: 'Review Application',
    getContentText: (content) => content
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
  
  return emailData;
}

export function getNotificationEmailSubject(actionType: string): string {
  const config = getNotificationEmailConfig(actionType);
  return config.subject;
}