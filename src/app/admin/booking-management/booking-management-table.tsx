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
  XCircle,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreVertical
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
import { useToast } from '@/components/ui/use-toast'
import { CombinedBookingData, BookingWithDetails, PendingBookingFromMatch } from './_actions'

interface BookingManagementTableProps {
  bookings: CombinedBookingData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

function getStatusBadgeColor(status: string) {
  switch (status.toLowerCase()) {
    case 'reserved':
      return 'bg-blue-100 text-blue-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'awaiting_signature':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Type guard to check if booking is a pending booking
function isPendingBooking(booking: CombinedBookingData): booking is PendingBookingFromMatch {
  return 'type' in booking && booking.type === 'pending_signature';
}

export default function BookingManagementTable({
  bookings,
  totalCount,
  currentPage,
  pageSize,
  search,
  status,
  startDate,
  endDate
}: BookingManagementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // URL update helper
  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to first page when filtering
    router.push(`?${params.toString()}`);
  };

  // Handle search
  const handleSearch = (value: string) => {
    updateSearchParams('search', value);
  };

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    updateSearchParams('status', value);
  };

  // Handle date filters
  const handleStartDateFilter = (value: string) => {
    updateSearchParams('startDate', value);
  };

  const handleEndDateFilter = (value: string) => {
    updateSearchParams('endDate', value);
  };

  // Handle pagination
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  // Handle checkbox selection
  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map(booking => booking.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by guest, host, or listing..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={status} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="awaiting_signature">Awaiting Signature</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="Start date"
            value={startDate || ''}
            onChange={(e) => handleStartDateFilter(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            placeholder="End date"
            value={endDate || ''}
            onChange={(e) => handleEndDateFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // For now, redirect to first selected booking's details page
                  // In a full implementation, you'd want a bulk action modal
                  if (selectedBookings.length === 1) {
                    router.push(`/admin/booking-management/${selectedBookings[0]}#cancel`);
                  } else {
                    toast({
                      title: "Bulk Operations",
                      description: "For multiple selections, please cancel bookings individually for now",
                    });
                  }
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedBookings.length === bookings.length && bookings.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No bookings found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={() => toggleBookingSelection(booking.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {booking.user.firstName} {booking.user.lastName}
                      </span>
                      <span className="text-sm text-gray-500">{booking.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {booking.listing.user.firstName} {booking.listing.user.lastName}
                      </span>
                      <span className="text-sm text-gray-500">{booking.listing.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link 
                        href={`/admin/listing-management/${booking.listing.id}`}
                        className="font-medium hover:underline"
                      >
                        {booking.listing.title}
                      </Link>
                      <span className="text-sm text-gray-500">
                        {booking.listing.city}, {booking.listing.state}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{formatDate(booking.startDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{formatDate(booking.endDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(booking.status)}>
                      {booking.status === 'awaiting_signature' ? 'Awaiting Signature' : booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${booking.monthlyRent?.toLocaleString() || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDate(booking.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/booking-management/${booking.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        
                        {/* Only show edit for actual bookings, not pending ones */}
                        {!isPendingBooking(booking) && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/booking-management/${booking.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Booking
                            </Link>
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {booking.status !== 'cancelled' && (
                          <>
                            {/* Cancel action - different behavior for pending vs actual bookings */}
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                if (isPendingBooking(booking)) {
                                  // For pending bookings, we cancel the match
                                  router.push(`/admin/match-management/${booking.matchId}#cancel`);
                                } else {
                                  router.push(`/admin/booking-management/${booking.id}#cancel`);
                                }
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {isPendingBooking(booking) ? 'Cancel Match' : 'Cancel Booking'}
                            </DropdownMenuItem>
                            
                            {/* Only show revert for actual bookings */}
                            {!isPendingBooking(booking) && (
                              <DropdownMenuItem 
                                className="text-orange-600 focus:text-orange-600"
                                onClick={() => router.push(`/admin/booking-management/${booking.id}#revert`)}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Revert to Match
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} bookings
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pageNumber = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNumber <= totalPages) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNumber)}
                      className="w-8"
                    >
                      {pageNumber}
                    </Button>
                  );
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}