'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Search,
  Eye,
  UserX,
  XCircle,
  AlertTriangle,
  Loader2,
  Checkbox
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { setListingInactive, setListingRejected, bulkUpdateOrphanedListings } from '../orphaned-listings-actions'
import type { OrphanedListingData } from '../orphaned-listings-actions'

interface OrphanedListingsTableProps {
  listings: OrphanedListingData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
}

export default function OrphanedListingsTable({
  listings,
  totalCount,
  currentPage,
  pageSize,
  search
}: OrphanedListingsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [searchInput, setSearchInput] = useState(search)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedListings, setSelectedListings] = useState<string[]>([])
  const [rejectComment, setRejectComment] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  // Update URL with new search params
  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to first page on filter change
    router.push(`?${params.toString()}`)
  }

  // Handle search
  const handleSearch = () => {
    updateSearchParams('search', searchInput)
  }

  // Pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    router.push(`?${params.toString()}`)
  }

  const handleSelectListing = (listingId: string, checked: boolean) => {
    if (checked) {
      setSelectedListings(prev => [...prev, listingId])
    } else {
      setSelectedListings(prev => prev.filter(id => id !== listingId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedListings(listings.map(l => l.id))
    } else {
      setSelectedListings([])
    }
  }

  const handleSetInactive = async (listingId: string) => {
    setActioningId(listingId)
    try {
      await setListingInactive(listingId)
      toast({
        title: 'Success',
        description: 'Listing marked as inactive',
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update listing status',
      })
    } finally {
      setActioningId(null)
    }
  }

  const handleSetRejected = async (listingId: string, comment: string) => {
    setActioningId(listingId)
    try {
      await setListingRejected(listingId, comment)
      toast({
        title: 'Success',
        description: 'Listing marked as rejected',
      })
      router.refresh()
      setRejectComment('')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject listing',
      })
    } finally {
      setActioningId(null)
    }
  }

  const handleBulkAction = async (action: 'inactive' | 'rejected') => {
    if (selectedListings.length === 0) return

    setIsLoading(true)
    try {
      await bulkUpdateOrphanedListings(selectedListings, action)
      toast({
        title: 'Success',
        description: `${selectedListings.length} listings updated`,
      })
      setSelectedListings([])
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update listings',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getApprovalBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'pendingReview':
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getActiveBadge = (active: boolean) => {
    return active ?
      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge> :
      <Badge variant="outline" className="text-gray-600">Inactive</Badge>
  }

  const getPriceRange = (monthlyPricing: any[]) => {
    if (!monthlyPricing || monthlyPricing.length === 0) return 'N/A'
    const prices = monthlyPricing.map(p => p.price).sort((a, b) => a - b)
    const min = prices[0]
    const max = prices[prices.length - 1]
    return min === max ? `$${min.toLocaleString()}` : `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by title, location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedListings.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('inactive')}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark Selected Inactive ({selectedListings.length})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('rejected')}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Selected ({selectedListings.length})
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedListings.length === listings.length && listings.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </TableHead>
              <TableHead className="w-24">Photo</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Orphaned User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price Range</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedListings.includes(listing.id)}
                    onChange={(e) => handleSelectListing(listing.id, e.target.checked)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  {listing.listingImages[0] ? (
                    <div className="relative w-16 h-16 rounded overflow-hidden">
                      <Image
                        src={listing.listingImages[0].url}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      {listing.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {listing.category} • {listing.roomCount}BR/{listing.bathroomCount}BA
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.locationString || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-mono text-red-600 bg-red-50 px-2 py-1 rounded">
                    {listing.userId}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {getApprovalBadge(listing.approvalStatus)}
                    {getActiveBadge(listing.markedActiveByUser)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {getPriceRange(listing.monthlyPricing)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {formatDate(listing.lastModified)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/admin/listing-management/${listing.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetInactive(listing.id)}
                      disabled={actioningId === listing.id}
                      title="Mark as Inactive"
                    >
                      {actioningId === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actioningId === listing.id}
                          title="Reject Listing"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Orphaned Listing</DialogTitle>
                          <DialogDescription>
                            This will mark the listing as rejected. You can optionally add a comment explaining the reason.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reject-comment">Comment (Optional)</Label>
                            <Textarea
                              id="reject-comment"
                              value={rejectComment}
                              onChange={(e) => setRejectComment(e.target.value)}
                              placeholder="Enter reason for rejection..."
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleSetRejected(listing.id, rejectComment)}
                            disabled={actioningId === listing.id}
                          >
                            {actioningId === listing.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Reject Listing
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = currentPage <= 3 ? i + 1 :
                                currentPage >= totalPages - 2 ? totalPages - 4 + i :
                                currentPage - 2 + i;

              if (pageNumber < 1 || pageNumber > totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {listings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No orphaned listings found</div>
          {search && (
            <Button
              variant="link"
              onClick={() => router.push('/admin/orphaned-listings')}
              className="mt-2"
            >
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}