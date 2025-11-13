// This is NOT a server action file - it's a server-side utility
// It can only be called from other server-side code, not from the client

import { Resend } from 'resend'
import NotificationEmailTemplate from '@/components/email-templates/notification-email'
import { SendNotificationEmailInput, SendNotificationEmailResponse } from '@/types'
import { generateEmailTemplateHtml } from '@/lib/email-template-html'
import { emailQueueClient } from '@/lib/email-queue-client'

const resend = new Resend(process.env.RESEND_API_KEY);

// Toggle between queue mode and direct sending
const USE_EMAIL_QUEUE = process.env.USE_EMAIL_QUEUE === 'true';

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

    // Route to queue if enabled, otherwise send directly
    if (USE_EMAIL_QUEUE) {
      return await sendViaQueue({ to, subject, emailData });
    } else {
      return await sendDirectly({ to, subject, emailData });
    }
  } catch (error) {
    console.error('Error in sendNotificationEmail:', error);
    return { success: false, error: 'Failed to send notification email' };
  }
}

/**
 * Send email via Redis queue (processed by Java worker)
 */
async function sendViaQueue({
  to,
  subject,
  emailData
}: SendNotificationEmailInput): Promise<SendNotificationEmailResponse> {
  try {
    // Validate Redis configuration
    if (!process.env.REDIS_URL) {
      console.warn('REDIS_URL not configured, falling back to direct send');
      return await sendDirectly({ to, subject, emailData });
    }

    // Render email template to HTML
    const html = generateEmailTemplateHtml(emailData);

    // Enqueue email job
    const jobId = await emailQueueClient.enqueue({
      to,
      subject,
      html,
      from: 'MatchBook Rentals <no-reply@matchbookrentals.com>',
    });

    console.log(`[Email] Enqueued email to ${to} (jobId: ${jobId})`);

    return { success: true, emailId: jobId };
  } catch (error) {
    console.error('[Email] Failed to enqueue email, falling back to direct send:', error);
    // Fallback to direct send if queue fails
    return await sendDirectly({ to, subject, emailData });
  }
}

/**
 * Send email directly via Resend (original implementation)
 */
async function sendDirectly({
  to,
  subject,
  emailData
}: SendNotificationEmailInput): Promise<SendNotificationEmailResponse> {
  try {
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'MatchBook Rentals <no-reply@matchbookrentals.com>',
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

    console.log(`[Email] Sent directly to ${to} (emailId: ${data.id})`);

    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('Error sending email directly:', error);
    return { success: false, error: 'Failed to send email' };
  }
}