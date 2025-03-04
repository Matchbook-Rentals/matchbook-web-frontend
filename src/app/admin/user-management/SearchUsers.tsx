'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export const SearchUsers = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [isSearching, setIsSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'name')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  // Update URL when filters change
  const updateSearch = (
    search: string, 
    role: string = roleFilter, 
    sortBy: string = sort, 
    pageNum: number = page
  ) => {
    setIsSearching(true)
    
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role && role !== 'all') params.set('role', role)
    if (sortBy && sortBy !== 'name') params.set('sort', sortBy)
    if (pageNum > 1) params.set('page', pageNum.toString())
    
    router.push(`${pathname}?${params.toString()}`)
    
    // Simulate loading state
    setTimeout(() => {
      setIsSearching(false)
    }, 500)
  }

  // Reset search filters
  const clearSearch = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setSort('name')
    setPage(1)
    router.push(pathname)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearch(searchTerm, roleFilter, sort, 1) // Reset to page 1 on new search
  }

  // Update URL when role filter changes
  const handleRoleChange = (value: string) => {
    setRoleFilter(value)
    updateSearch(searchTerm, value, sort, 1) // Reset to page 1 on filter change
  }

  // Update URL when sort option changes
  const handleSortChange = (value: string) => {
    setSort(value)
    updateSearch(searchTerm, roleFilter, value)
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col md:flex-row gap-3 items-start"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1 flex-1 w-full">
          <label htmlFor="search" className="text-sm font-medium sr-only">
            Search for users
          </label>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="search" 
              name="search" 
              type="text" 
              placeholder="Search by email, name, or ID..." 
              className="pl-9 pr-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search for users by email, name, or ID"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  if (searchParams.has('search')) {
                    updateSearch('', roleFilter, sort)
                  }
                }}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center w-full md:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-[180px]">
                  <Select value={roleFilter} onValueChange={handleRoleChange}>
                    <SelectTrigger aria-label="Filter by role">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="beta_user">Beta User</SelectItem>
                      <SelectItem value="none">No role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter by user role</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-[180px]">
                  <Select value={sort} onValueChange={handleSortChange}>
                    <SelectTrigger aria-label="Sort users">
                      <SelectValue placeholder="Sort by name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by name</SelectItem>
                      <SelectItem value="email">Sort by email</SelectItem>
                      <SelectItem value="role">Sort by role</SelectItem>
                      <SelectItem value="created">Sort by date joined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sort user list</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSearching} aria-label="Search">
              {isSearching ? "Searching..." : "Search"}
            </Button>

            {(searchTerm || roleFilter || sort !== 'name' || page > 1) && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearSearch}
                aria-label="Clear all filters"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <SlidersHorizontal className="h-4 w-4" />
          <span>
            {roleFilter && roleFilter !== 'all' ? `Filtering by: ${roleFilter}` : "All roles"} • 
            {` Sorting by: ${sort}`}
          </span>
        </div>
        
        {searchParams.has('search') && (
          <div>Showing results for: "{searchParams.get('search')}"</div>
        )}
      </div>
    </div>
  )
}