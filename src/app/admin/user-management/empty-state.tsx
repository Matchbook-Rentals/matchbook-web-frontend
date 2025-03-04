'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserRound, Search, XCircle, RefreshCw } from 'lucide-react'

interface EmptyStateProps {
  isFiltered: boolean
}

export function EmptyState({ isFiltered }: EmptyStateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const clearFilters = () => {
    router.push('/admin/user-management')
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {isFiltered ? (
        <div className="max-w-md mx-auto">
          <div className="bg-muted rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No matching users found</h3>
          <p className="text-muted-foreground mb-4">
            No users match your current search criteria. Try adjusting your filters or search terms.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={clearFilters} variant="default">
              <XCircle className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
            <Button 
              onClick={() => router.refresh()}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            {searchParams.has('search') && (
              <div>Search: "{searchParams.get('search')}"</div>
            )}
            {searchParams.has('role') && (
              <div>Role filter: {searchParams.get('role')}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="bg-muted rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <UserRound className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">
            There are no users in the system yet. When users sign up, they'll appear here.
          </p>
          <Button 
            onClick={() => router.refresh()}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      )}
    </div>
  )
}