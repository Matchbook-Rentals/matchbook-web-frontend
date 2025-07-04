
"use client";

import PlatformNavbar from '@/components/platform-components/platformNavbar'
import React from 'react'
import { usePathname } from 'next/navigation'

// Note: Terms agreement check moved to sign-in/sign-up flow

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const shouldHideNavbar = pathname === '/platform/host/add-property'
  
  return (
    <>
      {!shouldHideNavbar && <PlatformNavbar />}
      <div style={{ fontFamily: 'Poppins' }}>{children}</div>
    </>
  )
}
