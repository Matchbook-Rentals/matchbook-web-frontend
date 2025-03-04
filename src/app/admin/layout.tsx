import React from 'react'
import PlatformNavbar from '@/components/platform-components/platformNavbar'
import { Toaster } from '@/components/ui/toaster'
import { PAGE_MARGIN } from '@/constants/styles'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen bg-background flex flex-col ${PAGE_MARGIN}`}>
      <PlatformNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
