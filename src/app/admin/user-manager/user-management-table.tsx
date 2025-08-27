'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Search, 
  Eye, 
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Filter
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SerializedUser {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  emailAddress: string | null
  role: string | null
  createdAt: string | null
  lastSignInAt: string | null
}

interface UserManagementTableProps {
  users: SerializedUser[]
  totalCount: number
  currentPage: number
  pageSize: number
  searchParams: {
    search?: string
    role?: string
    sort?: string
    page?: string
    pageSize?: string
    dateFrom?: string
    dateTo?: string
    status?: string
  }
}

function getRoleBadgeColor(role: string | null) {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'admin_dev':
      return 'bg-purple-100 text-purple-800'
    case 'host':
      return 'bg-blue-100 text-blue-800'
    case 'renter':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getActivityStatus(lastSignInAt: string | null) {
  if (!lastSignInAt) return { label: 'Never', color: 'bg-gray-100 text-gray-800' }
  
  const lastSignIn = new Date(lastSignInAt)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  if (lastSignIn > thirtyDaysAgo) {
    return { label: 'Active', color: 'bg-green-100 text-green-800' }
  } else {
    return { label: 'Inactive', color: 'bg-yellow-100 text-yellow-800' }
  }
}

export function UserManagementTable({
  users,
  totalCount,
  currentPage,
  pageSize,
  searchParams
}: UserManagementTableProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState(searchParams.search || '')

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // URL update helper
  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(urlSearchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    // Reset to first page when filtering/sorting changes
    if ('search' in updates || 'role' in updates || 'status' in updates || 'sort' in updates) {
      params.delete('page')
    }
    
    router.push(`/admin/user-manager?${params.toString()}`)
  }

  // Handle sorting
  const handleSort = (field: string) => {
    const currentSort = searchParams.sort || 'name-asc'
    const [currentField, currentDirection] = currentSort.split('-')
    
    let newDirection = 'asc'
    if (currentField === field && currentDirection === 'asc') {
      newDirection = 'desc'
    }
    
    updateSearchParams({ sort: `${field}-${newDirection}` })
  }

  // Get sort direction for field
  const getSortDirection = (field: string) => {
    const currentSort = searchParams.sort || 'name-asc'
    const [currentField, direction] = currentSort.split('-')
    return currentField === field ? direction : null
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams({ search: searchTerm })
  }

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => {
    const direction = getSortDirection(field)
    
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2">
          {children}
          {direction === 'asc' && <ChevronUp className="h-4 w-4" />}
          {direction === 'desc' && <ChevronDown className="h-4 w-4" />}
          {!direction && <div className="h-4 w-4" />}
        </div>
      </TableHead>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2 items-center">
          <Select value={searchParams.role || 'all'} onValueChange={(value) => updateSearchParams({ role: value })}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="admin_dev">Admin Dev</SelectItem>
              <SelectItem value="host">Host</SelectItem>
              <SelectItem value="renter">Renter</SelectItem>
              <SelectItem value="none">No Role</SelectItem>
            </SelectContent>
          </Select>

          <Select value={searchParams.status || 'all'} onValueChange={(value) => updateSearchParams({ status: value })}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={searchParams.pageSize || '25'} onValueChange={(value) => updateSearchParams({ pageSize: value })}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedUsers.length} user{selectedUsers.length === 1 ? '' : 's'} selected
          </span>
          <Button variant="outline" size="sm">
            Bulk Actions
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <SortableHeader field="name">User</SortableHeader>
              <SortableHeader field="email">Email</SortableHeader>
              <SortableHeader field="role">Role</SortableHeader>
              <SortableHeader field="created">Created</SortableHeader>
              <SortableHeader field="lastSignIn">Last Sign In</SortableHeader>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2" />
                    <p>No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const activityStatus = getActivityStatus(user.lastSignInAt)
                
                return (
                  <TableRow 
                    key={user.id}
                    className={selectedUsers.includes(user.id) ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={user.imageUrl} 
                            alt="User avatar"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.emailAddress || 'No email'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role || 'No role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.lastSignInAt ? formatDate(user.lastSignInAt) : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={activityStatus.color}>
                        {activityStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/user-manager/${user.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} users
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSearchParams({ page: String(currentPage - 1) })}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSearchParams({ page: String(page) })}
                >
                  {page}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSearchParams({ page: String(currentPage + 1) })}
            disabled={!hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}