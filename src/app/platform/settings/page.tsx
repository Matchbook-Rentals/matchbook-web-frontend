'use client'

import React from 'react';
import { UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <UserProfile appearance={{
      elements: {
        rootBox: {
          height: '100%',
          width: '100%'
        }
      }
    }} />
  )
}