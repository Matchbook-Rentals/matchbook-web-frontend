'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Loader2, XIcon } from 'lucide-react'
import { adminDeleteListing, DeletionResponse } from '../../listing-management-actions'

interface DeleteListingButtonProps {
  listingId: string
  listingTitle: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  showText?: boolean
}

type ModalState = 'checking' | 'confirmation' | 'blocked' | 'deleting'

export default function DeleteListingButton({
  listingId,
  listingTitle,
  size = 'sm',
  variant = 'destructive',
  showText = true
}: DeleteListingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalState, setModalState] = useState<ModalState>('checking')
  const [confirmationText, setConfirmationText] = useState('')
  const [deletionResponse, setDeletionResponse] = useState<DeletionResponse | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Reset state and start checking
      setModalState('checking')
      setConfirmationText('')
      setDeletionResponse(null)
      checkDeletion()
    }
  }

  const checkDeletion = async () => {
    try {
      const response = await adminDeleteListing(listingId, false)
      setDeletionResponse(response)

      if (!response.success) {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
        setIsOpen(false)
        return
      }

      if (response.canDelete) {
        setModalState('confirmation')
      } else {
        setModalState('blocked')
      }
    } catch (error) {
      console.error('Error checking deletion:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check deletion constraints.",
        variant: "destructive",
      })
      setIsOpen(false)
    }
  }

  const handleConfirmDelete = async () => {
    setModalState('deleting')

    try {
      const response = await adminDeleteListing(listingId, true)

      if (response.success && response.canDelete) {
        toast({
          title: "Listing Deleted",
          description: "The listing has been successfully deleted.",
        })
        setIsOpen(false)
        // Navigate back to listing management page
        router.push('/admin/listing-management')
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete listing.",
          variant: "destructive",
        })
        setModalState('confirmation')
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete listing.",
        variant: "destructive",
      })
      setModalState('confirmation')
    }
  }

  const isDeleteButtonDisabled = confirmationText.toLowerCase() !== listingTitle.toLowerCase()

  // Calculate counts for blocking reasons
  const applicationsCount = deletionResponse?.blockingReasons
    ?.filter(reason => reason.type === 'openMatches' || reason.type === 'pendingHousingRequests')
    .reduce((sum, reason) => sum + reason.count, 0) || 0

  const bookingsCount = deletionResponse?.blockingReasons
    ?.filter(reason => reason.type === 'activeStays' || reason.type === 'futureBookings')
    .reduce((sum, reason) => sum + reason.count, 0) || 0

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {showText && "Delete Listing"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {modalState === 'checking' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Checking Deletion Constraints</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
                  <p className="text-center">
                    Checking if this listing can be deleted...
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        )}

        {modalState === 'confirmation' && (
          <>
            <AlertDialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <AlertDialogTitle className="text-center">Delete this listing?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p className="text-center">
                  This action cannot be undone. The listing will be soft-deleted and can be restored later if needed.
                </p>

                {deletionResponse?.entityCounts && deletionResponse.entityCounts.total > 1 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">
                      This will affect {deletionResponse.entityCounts.total} database record(s):
                    </p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      {deletionResponse.entityCounts.images > 0 && (
                        <li>• {deletionResponse.entityCounts.images} image(s)</li>
                      )}
                      {deletionResponse.entityCounts.monthlyPricing > 0 && (
                        <li>• {deletionResponse.entityCounts.monthlyPricing} pricing tier(s)</li>
                      )}
                      {deletionResponse.entityCounts.favorites > 0 && (
                        <li>• {deletionResponse.entityCounts.favorites} user favorite(s)</li>
                      )}
                      {deletionResponse.entityCounts.bedrooms > 0 && (
                        <li>• {deletionResponse.entityCounts.bedrooms} bedroom(s)</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="confirmation-input" className="block text-sm font-medium text-gray-700">
                    To confirm, type <strong>{listingTitle}</strong> below:
                  </label>
                  <Input
                    id="confirmation-input"
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={listingTitle}
                    className="w-full"
                    autoComplete="off"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleteButtonDisabled}
                className="bg-red-600 hover:bg-red-700 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Listing
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {modalState === 'blocked' && (
          <>
            <AlertDialogHeader>
              <div className="flex items-center justify-between">
                <AlertDialogTitle>Cannot Delete This Listing</AlertDialogTitle>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Listings with active bookings, future bookings, open matches, or pending housing requests cannot be deleted.
                </p>

                {deletionResponse?.blockingReasons && deletionResponse.blockingReasons.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-900 mb-2">Blocking Issues:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {deletionResponse.blockingReasons.map((reason, idx) => (
                        <li key={idx}>• {reason.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  Please resolve these issues before attempting to delete this listing.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2">
              {bookingsCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push('/admin/booking-management')
                    setIsOpen(false)
                  }}
                >
                  View Bookings ({bookingsCount})
                </Button>
              )}
              {applicationsCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push('/admin/listing-management')
                    setIsOpen(false)
                  }}
                >
                  View Applications ({applicationsCount})
                </Button>
              )}
              <AlertDialogCancel onClick={() => setIsOpen(false)}>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        )}

        {modalState === 'deleting' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Deleting Listing</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                  <p className="text-center">
                    Please wait while we delete your listing...
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
