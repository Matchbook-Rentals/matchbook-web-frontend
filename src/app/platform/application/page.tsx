import React from 'react';
import { getUserApplication } from '@/app/actions/applications';
import ApplicationClientComponent from './applicationClientComponent';

export default async function ApplicationPage() {
  // Load the user's default application from the server
  const application = await getUserApplication();

  return <ApplicationClientComponent application={application} />;
}