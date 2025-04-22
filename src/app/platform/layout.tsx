
"use client";

import PlatformNavbar from '@/components/platform-components/platformNavbar'
import React from 'react'

// Note: Terms agreement check moved to sign-in/sign-up flow

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PlatformNavbar />
      <div style={{ fontFamily: 'Poppins' }}>{children}</div>
    </>
  )
}
