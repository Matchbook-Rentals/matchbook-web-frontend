'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ChevronLeft, ChevronRight, ExternalLink, MapPin } from 'lucide-react'

interface LocationChange {
  id: string
  createdAt: Date
  changedFields: string[]
  oldStreetAddress1: string | null
  oldStreetAddress2: string | null
  oldCity: string | null
  oldState: string | null
  oldPostalCode: string | null
  newStreetAddress1: string | null
  newStreetAddress2: string | null
  newCity: string | null
  newState: string | null
  newPostalCode: string | null
  listing: {
    id: string
    title: string
    status: string
    approvalStatus: string
    isApproved: boolean
  }
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
}

interface LocationChangesTableProps {
  locationChanges: LocationChange[]
  totalPages: number
  currentPage: number
  sortBy: string
  sortOrder: string
}

export function LocationChangesTable({
  locationChanges,
  totalPages,
  currentPage,
  sortBy,
  sortOrder,
}: LocationChangesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const formatAddress = (
    streetAddress1: string | null,
    streetAddress2: string | null,
    city: string | null,
    state: string | null,
    postalCode: string | null
  ) => {
    const parts = [
      streetAddress1,
      streetAddress2,
      city,
      state,
      postalCode
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : 'No address'
  }

  const getApprovalStatusBadge = (approvalStatus: string, isApproved: boolean) => {
    if (approvalStatus === 'approved' && isApproved) {
      return <Badge variant="success">Approved</Badge>
    }
    if (approvalStatus === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>
    }
    return <Badge variant="warning">Pending Review</Badge>
  }

  const updateSort = (newSortBy: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (sortBy === newSortBy) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sortBy', newSortBy)
      params.set('sortOrder', 'desc')
    }
    
    router.push(`?${params.toString()}`)
  }

  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => updateSort('createdAt')}
            >
              Date Changed
              {sortBy === 'createdAt' && (
                <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Changed By</TableHead>
            <TableHead>Fields Changed</TableHead>
            <TableHead>Old Address</TableHead>
            <TableHead>New Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locationChanges.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No location changes found
              </TableCell>
            </TableRow>
          ) : (
            locationChanges.map((change) => (
              <TableRow key={change.id}>
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(change.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{change.listing.title}</div>
                  <div className="text-xs text-gray-500">{change.listing.id}</div>
                </TableCell>
                <TableCell>
                  {change.user ? (
                    <div>
                      <div className="font-medium">
                        {change.user.firstName} {change.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {change.user.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Unknown user</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {(change.changedFields as string[]).map((field) => (
                      <Badge key={field} variant="outline" className="text-xs mr-1">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-48">
                  <div className="text-sm truncate">
                    {formatAddress(
                      change.oldStreetAddress1,
                      change.oldStreetAddress2,
                      change.oldCity,
                      change.oldState,
                      change.oldPostalCode
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-48">
                  <div className="text-sm truncate">
                    {formatAddress(
                      change.newStreetAddress1,
                      change.newStreetAddress2,
                      change.newCity,
                      change.newState,
                      change.newPostalCode
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getApprovalStatusBadge(change.listing.approvalStatus, change.listing.isApproved)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/admin/address-change-approvals/${change.id}`}>
                      <Button size="sm" variant="outline">
                        <MapPin className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </Link>
                    <Link href={`/admin/listing-approval/${change.listing.id}`}>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}