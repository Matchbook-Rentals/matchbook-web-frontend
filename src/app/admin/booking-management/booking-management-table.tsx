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
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { CombinedBookingData, BookingWithDetails, PendingBookingFromMatch } from './_actions'
import { calculateRent } from '@/lib/calculate-rent'

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


  return (
    <div className="w-full space-y-6">
      {/* Filters */}
      <div className="w-full bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by guest, host, or listing..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 lg:flex-shrink-0">
            <Select value={status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
                className="w-full sm:w-40"
              />
              <Input
                type="date"
                placeholder="End date"
                value={endDate || ''}
                onChange={(e) => handleEndDateFilter(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Table */}
      <div className="w-full rounded-md border overflow-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Guest</TableHead>
              <TableHead className="w-[180px]">Host</TableHead>
              <TableHead className="min-w-[200px]">Listing</TableHead>
              <TableHead className="w-[160px]">Dates</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">Monthly Rent</TableHead>
              <TableHead className="w-[120px]">Created</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No bookings found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => {
                return (
                <TableRow key={booking.id}>
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
                      <span className="font-medium">{booking.listing.title}</span>
                      <span className="text-sm text-gray-500">
                        {booking.listing.city}, {booking.listing.state}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(booking.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(booking.endDate)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(booking.status)}>
                      {booking.status === 'awaiting_signature' ? 'Awaiting Signature' : booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${(() => {
                        // Utility function to format currency properly (cents to dollars)
                        const formatCurrency = (amountInCents: number | null) => {
                          if (!amountInCents) return 'Not Set';
                          const dollars = amountInCents / 100;
                          // Only show decimals if they exist
                          return dollars % 1 === 0
                            ? dollars.toLocaleString()
                            : dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        };

                        // Get effective monthly rent using proper calculation
                        // First try stored monthlyRent if valid
                        if (booking.monthlyRent && booking.monthlyRent !== 77777) {
                          return formatCurrency(booking.monthlyRent);
                        }

                        // Calculate using the proper function
                        if (booking.trip && booking.listing) {
                          const calculated = calculateRent({
                            listing: booking.listing as any, // Will have monthlyPricing
                            trip: booking.trip
                          });
                          if (calculated !== 77777) {
                            return formatCurrency(calculated);
                          }
                        }

                        // Last fallback: use largest rent payment
                        const allPayments = booking.rentPayments || [];
                        if (allPayments.length > 0) {
                          const largestPayment = Math.max(...allPayments.map(payment => payment.amount));
                          return formatCurrency(largestPayment);
                        }

                        return 'Not Set';
                      })()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDate(booking.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {booking.id ? (
                      <Button asChild size="sm">
                        <Link href={`/admin/booking-management/${booking.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Booking
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        <Eye className="w-4 h-4 mr-2" />
                        Invalid ID
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                );
              })
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