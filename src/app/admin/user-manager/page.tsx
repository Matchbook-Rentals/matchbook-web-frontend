import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { UserSearch, RefreshCcw } from 'lucide-react'
import { UserManagementTable } from './user-management-table'

interface SearchParams {
  search?: string
  role?: string
  sort?: string
  page?: string
  pageSize?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}

export default async function UserManagementPage(params: {
  searchParams: SearchParams
}) {
  if (!(await checkAdminAccess())) {
    redirect('/unauthorized')
  }

  const { 
    search = '', 
    role = 'all', 
    sort = 'name-asc', 
    page = '1', 
    pageSize = '25',
    dateFrom,
    dateTo,
    status = 'all'
  } = params.searchParams
  
  const currentPage = parseInt(page, 10) || 1
  const itemsPerPage = parseInt(pageSize, 10) || 25
  const skip = (currentPage - 1) * itemsPerPage
  
  const client = clerkClient

  // Fetch users with pagination
  const userResults = await client.users.getUserList({
    query: search || undefined,
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

  // Filter by status if specified
  const statusFilteredUsers = status !== 'all' 
    ? filteredUsers.filter(user => {
        const lastSignIn = user.lastSignInAt
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        if (status === 'active') {
          return lastSignIn && new Date(lastSignIn) > thirtyDaysAgo
        } else if (status === 'inactive') {
          return !lastSignIn || new Date(lastSignIn) <= thirtyDaysAgo
        }
        return true
      })
    : filteredUsers

  // Filter by date range if specified
  const dateFilteredUsers = (dateFrom || dateTo) 
    ? statusFilteredUsers.filter(user => {
        const createdDate = new Date(user.createdAt || 0)
        let matchesDate = true
        
        if (dateFrom) {
          matchesDate = matchesDate && createdDate >= new Date(dateFrom)
        }
        if (dateTo) {
          matchesDate = matchesDate && createdDate <= new Date(dateTo)
        }
        
        return matchesDate
      })
    : statusFilteredUsers

  // Sort users based on sort parameter
  const [sortField, sortDirection] = sort.split('-')
  const sortedUsers = [...dateFilteredUsers].sort((a, b) => {
    let comparison = 0
    
    switch(sortField) {
      case 'name':
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim()
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim()
        comparison = nameA.localeCompare(nameB)
        break
      case 'email':
        const emailA = a.emailAddresses.find(email => email.id === a.primaryEmailAddressId)?.emailAddress || ''
        const emailB = b.emailAddresses.find(email => email.id === b.primaryEmailAddressId)?.emailAddress || ''
        comparison = emailA.localeCompare(emailB)
        break
      case 'role':
        const roleA = a.publicMetadata.role as string || 'zzz' // Sort no role to end
        const roleB = b.publicMetadata.role as string || 'zzz'
        comparison = roleA.localeCompare(roleB)
        break
      case 'created':
        comparison = (new Date(a.createdAt || 0)).getTime() - (new Date(b.createdAt || 0)).getTime()
        break
      case 'lastSignIn':
        const lastSignInA = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0
        const lastSignInB = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0
        comparison = lastSignInA - lastSignInB
        break
      default:
        return 0
    }
    
    return sortDirection === 'desc' ? -comparison : comparison
  })

  // Get total count for pagination
  const totalCount = userResults.totalCount || sortedUsers.length

  // Serialize user data to pass to client components
  const serializedUsers = sortedUsers.map(user => ({
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
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UserSearch className="h-6 w-6 text-primary" />
            <CardTitle>User Management</CardTitle>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/user-manager">
              <Button variant="outline" size="icon" aria-label="Refresh">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline">Back to Admin Dashboard</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <UserManagementTable 
            users={serializedUsers}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={itemsPerPage}
            searchParams={params.searchParams}
          />
        </CardContent>
      </Card>
    </div>
  )
}