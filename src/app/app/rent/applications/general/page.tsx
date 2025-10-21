import React from 'react';
import { headers } from 'next/headers';
import { getUserApplication } from '@/app/actions/applications';
import ApplicationClientComponent from './applicationClientComponent';

interface ApplicationPageProps {
  searchParams: { from?: string };
}

export default async function ApplicationPage({ searchParams }: ApplicationPageProps) {

  const userAgent = headers().get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  // Load the user's default application from the server
  const application = await getUserApplication();

  // Pass the application data and mobile state to the client component
  // The form will show empty if no application exists
  return <ApplicationClientComponent application={application} isMobile={isMobile} from={searchParams.from} />;
}
