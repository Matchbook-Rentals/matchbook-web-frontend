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
  Check,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Clock,
  DollarSign
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  PaymentModificationWithDetails,
  adminApprovePaymentModification,
  adminRejectPaymentModification
} from './_actions'

interface PaymentModificationTableProps {
  modifications: PaymentModificationWithDetails[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  status: string;
}

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRequestorType = (modification: PaymentModificationWithDetails) => {
  return modification.requestor.id === modification.rentPayment.booking.userId ? 'Guest' : 'Host';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100); // Assuming amounts are in cents
};

export default function PaymentModificationTable({
  modifications,
  totalCount,
  currentPage,
  pageSize,
  search,
  status
}: PaymentModificationTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Modal states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedModification, setSelectedModification] = useState<PaymentModificationWithDetails | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    params.set('tab', 'payment-modifications'); // Ensure we stay on this tab
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

  // Handle pagination
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('tab', 'payment-modifications'); // Ensure we stay on this tab
    router.push(`?${params.toString()}`);
  };

  // Handle approve modification
  const handleApprove = async () => {
    if (!selectedModification) return;

    setIsProcessing(true);
    try {
      await adminApprovePaymentModification(selectedModification.id, adminReason || undefined);
      toast({
        title: "Modification Approved",
        description: "The payment modification has been approved successfully.",
      });
      setApproveDialogOpen(false);
      setAdminReason('');
      setSelectedModification(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve modification",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject modification
  const handleReject = async () => {
    if (!selectedModification || !rejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      await adminRejectPaymentModification(selectedModification.id, rejectionReason);
      toast({
        title: "Modification Rejected",
        description: "The payment modification has been rejected.",
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedModification(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject modification",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-4 md:pt-8 space-y-4">
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>Requestor</TableHead>
              <TableHead>Original Payment</TableHead>
              <TableHead>New Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No payment modifications found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              modifications.map((modification) => (
                <TableRow key={modification.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/admin/booking-management/${modification.rentPayment.booking.id}`}
                        className="font-medium hover:underline"
                      >
                        {modification.rentPayment.booking.listing.title}
                      </Link>
                      <span className="text-sm text-gray-500">
                        Guest: {modification.rentPayment.booking.user.firstName} {modification.rentPayment.booking.user.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        Host: {modification.rentPayment.booking.listing.user.firstName} {modification.rentPayment.booking.listing.user.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {modification.requestor.firstName} {modification.requestor.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getRequestorType(modification)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatCurrency(modification.originalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(modification.originalDueDate)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(modification.newAmount)}
                        </span>
                        {modification.newAmount !== modification.originalAmount && (
                          <span className="text-xs text-gray-500">
                            ({modification.newAmount > modification.originalAmount ? '+' : ''}
                            {formatCurrency(modification.newAmount - modification.originalAmount)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-600">
                          {formatDate(modification.newDueDate)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(modification.status)}>
                      {modification.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {formatDate(modification.requestedAt)}
                      </span>
                    </div>
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
                          <Link href={`/admin/booking-management/${modification.rentPayment.booking.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Booking
                          </Link>
                        </DropdownMenuItem>

                        {modification.status === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-green-600 focus:text-green-600"
                              onClick={() => {
                                setSelectedModification(modification);
                                setApproveDialogOpen(true);
                              }}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setSelectedModification(modification);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
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
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} modifications
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment Modification</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this payment modification? This will update the payment amount and due date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedModification && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Original:</strong> {formatCurrency(selectedModification.originalAmount)} due {formatDate(selectedModification.originalDueDate)}
                </p>
                <p className="text-sm">
                  <strong>New:</strong> {formatCurrency(selectedModification.newAmount)} due {formatDate(selectedModification.newDueDate)}
                </p>
                {selectedModification.reason && (
                  <p className="text-sm mt-2">
                    <strong>Reason:</strong> {selectedModification.reason}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Admin Reason (Optional)</label>
              <Textarea
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                placeholder="Optional reason for approval..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Modification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this modification. This will be communicated to both parties.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedModification && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Original:</strong> {formatCurrency(selectedModification.originalAmount)} due {formatDate(selectedModification.originalDueDate)}
                </p>
                <p className="text-sm">
                  <strong>Requested:</strong> {formatCurrency(selectedModification.newAmount)} due {formatDate(selectedModification.newDueDate)}
                </p>
                {selectedModification.reason && (
                  <p className="text-sm mt-2">
                    <strong>Requestor&apos;s Reason:</strong> {selectedModification.reason}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}