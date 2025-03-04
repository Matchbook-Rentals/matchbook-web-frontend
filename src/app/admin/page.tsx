import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">User Management</h2>
                <p className="text-muted-foreground mb-4">
                  Manage user access levels and roles
                </p>
                <Link href="/admin/user-management">
                  <Button>Manage Users</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">Blog Articles</h2>
                <p className="text-muted-foreground mb-4">
                  Upload and manage blog articles
                </p>
                <Link href="/admin/upload-article">
                  <Button>Upload Article</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
