'use client';

import React from 'react';
import { useApplicationStore } from '@/stores/application-store';
import { getUserApplication } from '@/app/actions/applications';

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout will load the user's default application and manage the state
  // We don't need to pass props to children as we'll use the store
  
  return (
    <div className="application-layout">
      {children}
    </div>
  );
}