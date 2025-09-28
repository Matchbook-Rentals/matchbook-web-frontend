import React from 'react';
import { generateEmailTemplateHtml } from '@/lib/email-template-html';

interface NotificationEmailProps {
  companyName: string;
  headerText: string;
  contentTitle: string;
  contentText: string;
  buttonText: string;
  buttonUrl: string;
  companyAddress: string;
  companyCity: string;
  companyWebsite: string;
  senderLine?: string;
  footerText?: string;
  tagLink?: {
    text: string;
    url: string;
  };
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
}

const NotificationEmailTemplate: React.FC<NotificationEmailProps> = (props) => {
  const htmlContent = generateEmailTemplateHtml(props);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default NotificationEmailTemplate;
