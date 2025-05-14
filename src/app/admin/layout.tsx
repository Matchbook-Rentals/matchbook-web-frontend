import React from 'react'
import PlatformNavbar from '@/components/platform-components/platformNavbar'
import { Toaster } from '@/components/ui/toaster'
import { PAGE_MARGIN } from '@/constants/styles'
import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for admin role at layout level for stronger protection
  const isAdmin = await checkRole('admin')
  
  if (!isAdmin) {
    redirect('/unauthorized')
  }
  
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
