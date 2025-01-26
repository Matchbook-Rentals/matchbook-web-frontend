
import PlatformNavbar from '@/components/platform-components/platformNavbar'
import React from 'react'
//import { Montserrat } from 'next/font/google'
import Footer from '@/components/marketing-landing-components/footer';


//const montserrat = Montserrat({ subsets: ["latin"] });

export default function ClerkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PlatformNavbar />
      <div style={{ fontFamily: 'Poppins' }}>{children}</div>
    </>
  )
} 
