import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UsersIcon, BookText, Database, TicketIcon } from 'lucide-react'

export default async function AdminDashboard() {
  if (!checkRole('admin')) {
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
                  <h2 className="text-xl font-semibold">User Management</h2>
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
                  <BookText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Blog Articles</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Upload and manage blog articles
                </p>
                <Link href="/admin/upload-article">
                  <Button>Upload Article</Button>
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
            
          {/*
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Database Explorer</h2>
                </div>
                  
                <p className="text-muted-foreground mb-4">
                  View data and run SQL queries
                </p>
                <Link href="/admin/sql-editor">
                  <Button>Open Explorer</Button>
                </Link>
              </CardContent>
            </Card>
        */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
