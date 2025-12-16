import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UsersIcon, BookText, Database, TicketIcon, Bell, Home, UserSearch, AlertTriangle } from 'lucide-react'

export default async function AdminDashboard() {
  if (!(await checkAdminAccess())) {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            This is the protected admin dashboard restricted to users with the `admin` role.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <UsersIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Role Management</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Manage user access levels and roles
                </p>
                <Link href="/admin/user-management">
                  <Button>Manage Users</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserSearch className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">User Management</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Search users and view their activity
                </p>
                <Link href="/admin/user-manager">
                  <Button>Manage Users</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TicketIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Support Tickets</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Manage customer support tickets
                </p>
                <Link href="/admin/tickets">
                  <Button>View Tickets</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <BookText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Listing Approval</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Review and approve pending listings
                </p>
                <Link href="/admin/listing-approval">
                  <Button>View Listings</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Listing Management</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  View and manage all property listings
                </p>
                <Link href="/admin/listing-management">
                  <Button>Manage Listings</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Send notifications to users
                </p>
                <Link href="/admin/notifications">
                  <Button>Manage Notifications</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-semibold">Eviction Review</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Review verifications with eviction hits
                </p>
                <Link href="/admin/eviction-review">
                  <Button>Review Evictions</Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
