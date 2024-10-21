
import PlatformNavbar from '@/components/platform-components/platformNavbar'
import React from 'react'
import { Montserrat } from 'next/font/google'


const montserrat = Montserrat({ subsets: ["latin"] });

export default function ClerkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PlatformNavbar />
      <div className={montserrat.className}>{children}</div>
    </>
  )
}
