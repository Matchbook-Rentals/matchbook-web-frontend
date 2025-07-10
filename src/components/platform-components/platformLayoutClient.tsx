'use client'
import PlatformNavbar from './platformNavbar'
import React from 'react'
import { usePathname } from 'next/navigation'

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
      {!shouldHideNavbar && <PlatformNavbar userId={userId} user={user} isSignedIn={isSignedIn} />}
      <div style={{ fontFamily: 'Poppins' }}>{children}</div>
    </>
  )
}