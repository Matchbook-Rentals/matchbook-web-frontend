// This is NOT a server action file - it's a server-side utility
// It can only be called from other server-side code, not from the client

import { Resend } from 'resend'
import NotificationEmailTemplate from '@/components/email-templates/notification-email'
import { SendNotificationEmailInput, SendNotificationEmailResponse } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotificationEmail({
  to,
  subject,
  emailData
}: SendNotificationEmailInput): Promise<SendNotificationEmailResponse> {
  try {
    // Validate environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'notifications <info@matchbookrentals.com>',
      to: [to],
      subject: subject,
      react: NotificationEmailTemplate(emailData),
    });

    if (error) {
      console.error('Failed to send notification email:', error);
      return { success: false, error: 'Failed to send email' };
    }

    if (!data?.id) {
      console.error('No email ID returned from Resend');
      return { success: false, error: 'Invalid response from email service' };
    }

    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('Error in sendNotificationEmail:', error);
    return { success: false, error: 'Failed to send notification email' };
  }
}