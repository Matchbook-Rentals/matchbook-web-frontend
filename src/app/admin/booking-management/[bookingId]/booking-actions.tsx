'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import BrandModal from '@/components/BrandModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  MoreVertical,
  Edit,
  XCircle,
  RotateCcw,
  ExternalLink,
  Info,
  Copy
} from 'lucide-react'
import Link from 'next/link'
import { cancelBooking, revertBookingToMatch } from '../_actions'

interface BookingActionsProps {
  bookingId: string;
  currentStatus: string;
  isPending?: boolean;
  matchInfo?: {
    id: string;
    paymentStatus?: string;
  };
  tripInfo?: {
    id: string;
  };
}

export default function BookingActions({
  bookingId,
  currentStatus,
  isPending = false,
  matchInfo,
  tripInfo
}: BookingActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [revertReason, setRevertReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await cancelBooking(bookingId, cancelReason);
      toast({
        title: "Success",
        description: "Booking has been cancelled successfully"
      });
      setShowCancelDialog(false);
      setCancelReason('');
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevertToMatch = async () => {
    if (!revertReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reverting to match",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await revertBookingToMatch(bookingId, revertReason);
      toast({
        title: "Success",
        description: "Booking has been reverted to match successfully"
      });
      setShowRevertDialog(false);
      setRevertReason('');
      router.push('/admin/booking-management');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revert booking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const canModify = currentStatus !== 'cancelled';

  // Handle URL fragments to auto-open dialogs
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#cancel') {
      setShowCancelDialog(true);
      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname);
    } else if (hash === '#revert') {
      setShowRevertDialog(true);
      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Edit Action */}
          {!isPending && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/booking-management/${bookingId}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Booking
              </Link>
            </DropdownMenuItem>
          )}

          {/* Copy Actions */}
          {(matchInfo || tripInfo) && (
            <>
              <DropdownMenuSeparator />
              {matchInfo && (
                <DropdownMenuItem onClick={() => copyToClipboard(matchInfo.id, 'Match ID')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Match ID
                </DropdownMenuItem>
              )}
              {tripInfo && (
                <DropdownMenuItem onClick={() => copyToClipboard(tripInfo.id, 'Trip ID')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Trip ID
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Related Items */}
          {(matchInfo || tripInfo) && (
            <>
              <DropdownMenuSeparator />
              {matchInfo && (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/match-management/${matchInfo.id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Match Details
                  </Link>
                </DropdownMenuItem>
              )}
              {tripInfo && (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/trip-management/${tripInfo.id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Trip Details
                  </Link>
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Destructive Actions */}
          {canModify && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isPending ? 'Cancel Match' : 'Cancel Booking'}
              </DropdownMenuItem>

              {/* Only show revert for actual bookings */}
              {!isPending && (
                <DropdownMenuItem
                  className="text-orange-600 focus:text-orange-600"
                  onClick={() => setShowRevertDialog(true)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Revert to Match
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cancel Dialog */}
      <BrandModal
        isOpen={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Cancel Booking</h2>
            <p className="text-muted-foreground mt-2">
              This action will cancel the booking and notify both the guest and host.
              Unpaid rent payments will remain for audit purposes but will not be processed.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Explain why this booking is being cancelled..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={isLoading || !cancelReason.trim()}
            >
              {isLoading ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </div>
        </div>
      </BrandModal>

      {/* Revert Dialog */}
      <BrandModal
        isOpen={showRevertDialog}
        onOpenChange={setShowRevertDialog}
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Revert Booking to Match</h2>
            <p className="text-muted-foreground mt-2">
              This action will delete the booking and revert it back to a match state.
              This is irreversible. Any unpaid rent payments will be deleted.
              Paid rent payments must be handled separately before reverting.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="revert-reason">Reason for Reverting *</Label>
              <Textarea
                id="revert-reason"
                placeholder="Explain why this booking should be reverted to a match..."
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-orange-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Warning: This action is irreversible
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>The booking will be permanently deleted</li>
                      <li>Unpaid rent payments will be deleted</li>
                      <li>Both guest and host will be notified</li>
                      <li>The associated match will remain active</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRevertDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevertToMatch}
              disabled={isLoading || !revertReason.trim()}
            >
              {isLoading ? "Reverting..." : "Revert to Match"}
            </Button>
          </div>
        </div>
      </BrandModal>
    </>
  );
}