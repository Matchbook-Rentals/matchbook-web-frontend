import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { SearchUsers } from './SearchUsers'
import { clerkClient } from '@clerk/nextjs/server'
import { removeRole, setRole } from './_actions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>
}) {
  if (!checkRole('admin')) {
    redirect('/unauthorized')
  }

  const query = (await params.searchParams).search

  const client = clerkClient

  const users = query ? (await client.users.getUserList({ query })).data : []

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This is the protected admin dashboard restricted to users with the `admin` role.
          </p>

          <SearchUsers />

          <div className="grid gap-4 mt-6">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="grid md:grid-cols-2 gap-4 p-6">
                  <div className="space-y-2">
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.emailAddresses.find(
                        (email) => email.id === user.primaryEmailAddressId
                      )?.emailAddress}
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={user.imageUrl}
                        alt={`${user.firstName}'s profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-medium">
                      Role: {user.publicMetadata.role as string || 'No role'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <form action={setRole}>
                      <Input type="hidden" value={user.id} name="id" />
                      <Input type="hidden" value="admin" name="role" />
                      <Button type="submit" variant="default" className="w-full">
                        Make Admin
                      </Button>
                    </form>

                    <form action={setRole}>
                      <Input type="hidden" value={user.id} name="id" />
                      <Input type="hidden" value="moderator" name="role" />
                      <Button type="submit" variant="secondary" className="w-full">
                        Make Moderator
                      </Button>
                    </form>

                    <form action={removeRole}>
                      <Input type="hidden" value={user.id} name="id" />
                      <Button type="submit" variant="destructive" className="w-full">
                        Remove Role
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
