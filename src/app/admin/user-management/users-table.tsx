'use client'

import { useState } from 'react'
import { UserCard } from './user-card'
import { BulkActions } from './bulk-actions'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from './empty-state'
import { Pagination } from './pagination'
import { useSearchParams } from 'next/navigation'
import { SerializedUser } from './types'

interface UsersTableProps {
  users: SerializedUser[]
  totalCount: number
}

export function UsersTable({ users, totalCount }: UsersTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const searchParams = useSearchParams()
  const isFiltered = searchParams.has('search') || searchParams.has('role')
  const itemsPerPage = 10
  const currentPage = Number(searchParams.get('page')) || 1
  
  // Handle item selection
  const toggleSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }
  
  // Check if there are any users to display
  if (users.length === 0) {
    return <EmptyState isFiltered={isFiltered} />
  }
  
  return (
    <div className="space-y-4">
      <BulkActions 
        users={users}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
      />
      
      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="relative group">
            <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Checkbox 
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={() => toggleSelection(user.id)}
                aria-label={`Select ${user.firstName || ''} ${user.lastName || ''}`}
              />
            </div>
            <div 
              className={`relative transition-all ${selectedUsers.includes(user.id) ? 'bg-muted/50 border-l-4 border-primary pl-3' : ''}`}
              onClick={() => toggleSelection(user.id)}
            >
              <UserCard user={user} />
            </div>
          </div>
        ))}
      </div>
      
      <Pagination 
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
      />
    </div>
  )
}