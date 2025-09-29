import React from 'react'
import { HostSidebar } from '@/app/app/host/components/host-sidebar'
import { HostBreadcrumb } from '@/app/app/host/components/host-breadcrumb'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import UserMenu from "@/components/userMenu"
import { Toaster } from '@/components/ui/toaster'
import { checkRole, checkAdminAccess } from '@/utils/roles'
import { redirect } from 'next/navigation'
import { currentUser } from "@clerk/nextjs/server"

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for admin role at layout level for stronger protection
  // Preview role should NOT have access to admin routes
  // Allow both 'admin' and 'admin_dev' roles
  const hasAdminAccess = await checkAdminAccess()
  
  if (!hasAdminAccess) {
    redirect('/unauthorized')
  }

  // Check if user has dev access for integrations and system tools
  const isDev = await checkRole('admin_dev')

  // Get user data
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

  // Define admin navigation items
  const adminDashboardItems = [
    {
      title: "Dashboard",
      url: "/admin",
      icon: "Home",
    },
    {
      title: "Role Management",
      url: "/admin/user-management",
      icon: "Users",
    },
    {
      title: "User Management",
      url: "/admin/user-manager",
      icon: "Search",
    },
    {
      title: "Listing Management",
      url: "/admin/listing-management",
      icon: "Building",
    },
    {
      title: "Booking Management",
      url: "/admin/booking-management",
      icon: "Calendar",
    },
    {
      title: "Listing Approval",
      url: "/admin/listing-approval",
      icon: "CheckCircle",
    },
    {
      title: "Address Changes",
      url: "/admin/address-change-approvals",
      icon: "MapPin",
    },
    {
      title: "Tickets",
      url: "/admin/tickets",
      icon: "MessageSquare",
    },
    {
      title: "Notifications",
      url: "/admin/notifications",
      icon: "Bell",
    },
  ];

  const devToolsItems = [
    {
      title: "Stripe Integration",
      url: "/admin/stripe-integration",
      icon: "CreditCard",
    },
    {
      title: "BoldSign Integration",
      url: "/admin/boldsign",
      icon: "Settings",
    },
    {
      title: "Clerk Integration",
      url: "/admin/clerk-integration",
      icon: "Users",
    },
    {
      title: "Authenticate Integration",
      url: "/admin/authenticate-integration",
      icon: "Shield",
    },
    {
      title: "Upload Article",
      url: "/admin/upload-article",
      icon: "Settings",
    },
    {
      title: "Application Errors",
      url: "/admin/application-errors",
      icon: "Settings",
    },
    {
      title: "Client Logs",
      url: "/admin/client-logs",
      icon: "Settings",
    },
    {
      title: "Cron Jobs",
      url: "/admin/cron-jobs",
      icon: "Settings",
    },
    {
      title: "Test Suites",
      url: "/admin/test",
      icon: "FlaskConical",
    },
    {
      title: "Orphaned Listings",
      url: "/admin/orphaned-listings",
      icon: "Unlink",
    },
  ];

  // Build sidebar groups - only include dev tools for devs
  const sidebarGroups = [
    { 
      title: "Admin Dashboard",
      items: adminDashboardItems 
    },
    ...(isDev ? [
      { 
        title: "Dev Tools",
        items: devToolsItems 
      }
    ] : [])
  ];
  
  return (
    <SidebarProvider>
      <HostSidebar groups={sidebarGroups} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center justify-between w-full px-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <HostBreadcrumb groups={sidebarGroups} breadcrumbTitle="Admin Dashboard" />
            </div>
            {/* hasListings={undefined} for admin menu */}
            <UserMenu isSignedIn={!!user?.id} user={userObject} color="#000" mode="header" hasListings={undefined} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
