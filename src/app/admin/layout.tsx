import React from 'react'
import RenterNavbar from '@/components/platform-components/renterNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Toaster } from '@/components/ui/toaster'
import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'
import { auth, currentUser } from "@clerk/nextjs/server"

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for admin role at layout level for stronger protection
  // Preview role should NOT have access to admin routes
  const isAdmin = await checkRole('admin')
  
  if (!isAdmin) {
    redirect('/unauthorized')
  }

  // Get user data for navbar
  const { userId } = await auth();
  const user = await currentUser();
  
  // Serialize user data to plain object
  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RenterNavbar userId={userId} user={userObject} isSignedIn={!!userId} />
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
