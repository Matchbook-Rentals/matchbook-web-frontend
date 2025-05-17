import React from 'react';
import { headers } from 'next/headers';
import { getUserApplication } from '@/app/actions/applications';
import ApplicationClientComponent from './applicationClientComponent';

export default async function ApplicationPage() {

  const userAgent = headers().get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  // Load the user's default application from the server
  const application = await getUserApplication();

  // Get user agent to determine if mobile on server side

  // For testing: Add artificial delay to simulate loading state
  // Use reasonable timeout value in production
  //await new Promise((resolve) => setTimeout(resolve, 300));

  // Pass the application data and mobile state to the client component
  // The form will show empty if no application exists
  return <ApplicationClientComponent application={application} isMobile={isMobile} />;
}
