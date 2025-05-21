import React from 'react'
import PlatformNavbar from '@/components/platform-components/platformNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Toaster } from '@/components/ui/toaster'
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
    <div className="min-h-screen bg-background flex flex-col">
      <PlatformNavbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-grow p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
