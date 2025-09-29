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
  Search,
  Eye,
  Edit,
  Copy
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import CopyListingButton from './[listingId]/copy-listing-button'

interface ListingData {
  id: string;
  title: string;
  createdAt: Date;
  lastModified: Date;
  locationString: string | null;
  city: string | null;
  state: string | null;
  approvalStatus: string;
  isApproved: boolean;
  markedActiveByUser: boolean;
  status: string;
  roomCount: number;
  bathroomCount: number;
  category: string | null;
  userId: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  listingImages: Array<{
    url: string;
  }>;
  monthlyPricing: Array<{
    months: number;
    price: number;
    utilitiesIncluded: boolean;
  }>;
}

interface ListingManagementTableProps {
  listings: ListingData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  status: string;
  active: string;
  showOrphaned: boolean;
}

export default function ListingManagementTable({
  listings,
  totalCount,
  currentPage,
  pageSize,
  search,
  status,
  active,
  showOrphaned
}: ListingManagementTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [searchInput, setSearchInput] = useState(search)
  const [isLoading, setIsLoading] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)

  // Update URL with new search/filter params
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

  // Client-side filtering for orphaned listings
  const filteredListings = showOrphaned
    ? listings.filter(listing => listing.user === null)  // Show ONLY orphaned listings
    : listings.filter(listing => listing.user !== null)  // Show listings WITH users

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by title, location, or host..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Select value={status} onValueChange={(value) => updateSearchParams('status', value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pendingReview">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={active} onValueChange={(value) => updateSearchParams('active', value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Information note for orphaned filtering */}
      {showOrphaned && (
        <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-3">
          <strong>Note:</strong> Showing all listings including orphaned ones (listings without valid users).
          Orphaned listings are marked with a red indicator.
        </div>
      )}
      {!showOrphaned && listings.length !== filteredListings.length && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
          <strong>Note:</strong> {listings.length - filteredListings.length} orphaned listing(s) hidden on this page.
          Select "Show Orphaned" to view them.
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Photo</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price Range</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredListings.map((listing) => (
              <TableRow key={listing.id}>
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
                    {listing.id ? (
                      <Link
                        href={`/admin/listing-management/${listing.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {listing.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-500">{listing.title}</span>
                    )}
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
                  <div className="text-sm">
                    {listing.user ? (
                      <>
                        <div className="font-medium">
                          {listing.user.firstName} {listing.user.lastName}
                        </div>
                        <div className="text-gray-600">{listing.user.email}</div>
                      </>
                    ) : (
                      <div className="text-red-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        No User (Orphaned)
                      </div>
                    )}
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
                  <div className="flex gap-2">
                    {listing.id ? (
                      <>
                        <Link href={`/admin/listing-management/${listing.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/listing-management/${listing.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <CopyListingButton
                          listingId={listing.id}
                          listingTitle={listing.title}
                          size="sm"
                          showText={false}
                        />
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" disabled>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </>
                    )}
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

      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No listings found</div>
          {(search || status !== 'all' || active !== 'all' || showOrphaned) && (
            <Button 
              variant="link" 
              onClick={() => router.push('/admin/listing-management')}
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}