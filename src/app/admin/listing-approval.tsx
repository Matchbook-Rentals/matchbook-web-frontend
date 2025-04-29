'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ListingData {
  id: string
  title: string
  createdAt: Date
  locationString: string | null
  userId: string
  user: {
    fullName: string | null
    email: string | null
  }
  listingImages: {
    url: string
  }[]
}

interface ListingApprovalProps {
  listings: ListingData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export default function ListingApproval({
  listings,
  totalCount,
  currentPage,
  pageSize
}: ListingApprovalProps) {
  const router = useRouter()
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      router.push(`/admin/listing-approval?page=${page}`);
    }
  };

  return (
    <div className="w-full">
      {/* Header removed as it's now in the parent CardHeader */}
      {/* <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Listings ({totalCount})</h1>
      </div> */}

      {listings.length === 0 && currentPage === 1 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground py-8">
              No listings pending approval at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative w-full h-48">
                {listing.listingImages.length > 0 ? (
                  <Image
                    src={listing.listingImages[0].url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No image</p>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {listing.locationString || 'Unknown location'}
                </p>
                <div className="mt-2 mb-3">
                  <p className="text-sm">
                    <span className="font-medium">Host:</span>{' '}
                    {listing.user.fullName || listing.user.email || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/admin/listing-approval/${listing.id}`)}
                >
                  Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={currentPage > 1 ? `/admin/listing-approval?page=${currentPage - 1}` : undefined}
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : undefined
                  }
                />
              </PaginationItem>

              {/* Basic Pagination Logic - Consider a more robust implementation for many pages */}
              {[...Array(totalPages)].map((_, i) => {
                 const pageNum = i + 1;
                 // Simple logic: show first, last, current, and adjacent pages
                 const showPage = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;
                 // Add ellipsis logic if needed for large page counts
                 // const showEllipsis = Math.abs(pageNum - currentPage) === 2 && totalPages > 5;

                 if (showPage) {
                   return (
                     <PaginationItem key={pageNum}>
                       <PaginationLink
                         href={`/admin/listing-approval?page=${pageNum}`}
                         isActive={currentPage === pageNum}
                       >
                         {pageNum}
                       </PaginationLink>
                     </PaginationItem>
                   );
                 }
                 // Basic ellipsis placeholder - enhance if needed
                 if (Math.abs(pageNum - currentPage) === 2 && totalPages > 5) {
                    return <PaginationItem key={`ellipsis-${pageNum}`}><PaginationEllipsis /></PaginationItem>;
                 }
                 return null;
              })}


              <PaginationItem>
                <PaginationNext
                  href={currentPage < totalPages ? `/admin/listing-approval?page=${currentPage + 1}` : undefined}
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={
                    currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
