'use client'
import RenterNavbar from './renterNavbar'
import React from 'react'
import { usePathname } from 'next/navigation'
import SessionTracker from '../SessionTracker'

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface PlatformLayoutClientProps {
  children: React.ReactNode;
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
}

export default function PlatformLayoutClient({ children, userId, user, isSignedIn }: PlatformLayoutClientProps) {
  const pathname = usePathname()
  
  const shouldHideNavbar = pathname === '/app/host/add-property'
  
  return (
    <>
      <SessionTracker />
      {!shouldHideNavbar && <RenterNavbar userId={userId} user={user} isSignedIn={isSignedIn} />}
      <div style={{ fontFamily: 'Poppins' }}>{children}</div>
    </>
  )
}