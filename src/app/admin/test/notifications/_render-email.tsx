import React from 'react'
import { generateEmailTemplateHtml } from '@/lib/email-template-html'
import { NotificationEmailData } from '@/types'

export function renderEmailToHtml(emailData: NotificationEmailData): string {
  // Use the shared HTML generator to ensure consistency with the React component
  return generateEmailTemplateHtml(emailData);
}