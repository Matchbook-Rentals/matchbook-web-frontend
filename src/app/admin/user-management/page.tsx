import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { SearchUsers } from './SearchUsers'
import { UsersTable } from './users-table'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { UsersIcon, RefreshCcw } from 'lucide-react'
import { SerializedUser } from './types'

interface SearchParams {
  search?: string
  role?: string
  sort?: string
  page?: string
}

export default async function UserManagementPage(params: {
  searchParams: SearchParams
}) {
  if (!checkRole('admin')) {
    redirect('/unauthorized')
  }

  const { search, role, sort = 'name', page = '1' } = params.searchParams
  const currentPage = parseInt(page, 10) || 1
  const itemsPerPage = 10
  const skip = (currentPage - 1) * itemsPerPage
  
  const client = clerkClient

  // Calculate filters for the query
  let query = ''
  if (search) {
    query = search
  }

  // Fetch users with pagination
  const userResults = await client.users.getUserList({
    query: query || undefined,
    limit: itemsPerPage,
    offset: skip,
  })

  const users = userResults.data
  
  // Filter by role if specified
  const filteredUsers = role && role !== 'all'
    ? users.filter(user => {
        const userRole = user.publicMetadata.role as string
        if (role === 'none') {
          return !userRole || userRole === ''
        }
        return userRole === role
      })
    : users

  // Sort users based on sort parameter
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch(sort) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      case 'email':
        const emailA = a.emailAddresses.find(email => email.id === a.primaryEmailAddressId)?.emailAddress || ''
        const emailB = b.emailAddresses.find(email => email.id === b.primaryEmailAddressId)?.emailAddress || ''
        return emailA.localeCompare(emailB)
      case 'role':
        const roleA = a.publicMetadata.role as string || 'No role'
        const roleB = b.publicMetadata.role as string || 'No role'
        return roleA.localeCompare(roleB)
      case 'created':
        return (new Date(b.createdAt || 0)).getTime() - (new Date(a.createdAt || 0)).getTime()
      default:
        return 0
    }
  })

  // Get total count for pagination
  // In a real app, this would be a separate count query
  const totalCount = userResults.totalCount || sortedUsers.length

  // Serialize user data to pass to client components
  const serializedUsers: SerializedUser[] = sortedUsers.map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddress: user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress || null,
    role: (user.publicMetadata.role as string) || null,
    createdAt: user.createdAt || null,
    lastSignInAt: user.lastSignInAt || null
  }))

  return (
    <div className="container mx-auto py-10">
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" />
            <CardTitle>User Management</CardTitle>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/user-management">
              <Button variant="outline" size="icon" aria-label="Refresh user list">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline">Back to Admin Dashboard</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="max-w-full overflow-x-auto pl-10">
              <SearchUsers />
            </div>
            
            <div className="pl-10">
              <UsersTable users={serializedUsers} totalCount={totalCount} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
