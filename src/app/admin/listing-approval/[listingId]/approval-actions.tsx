'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveRejectListing, deleteListing } from '../../listing-approval-actions'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'

export function ApprovalActions({ listingId, listingTitle }: { listingId: string, listingTitle?: string }) {
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const router = useRouter()
  const confirmationInputRef = useRef<HTMLInputElement>(null)

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(true)
    try {
      await approveRejectListing(listingId, action, comment)
      toast({
        title: `Listing ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        description: `The listing has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: `Failed to ${action} listing. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteListing(listingId)
      toast({
        title: 'Listing deleted successfully',
        description: 'The listing has been permanently deleted.',
      })
      router.push('/admin/listing-approval')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to delete listing. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setDeleteConfirmation('')
    }
  }

  const isDeleteConfirmed = deleteConfirmation.trim() === listingTitle?.trim()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Admin Decision</h3>
      
      <Textarea
        placeholder="Add a comment or reason for your decision (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px]"
      />
      
      <div className="flex flex-wrap gap-4 justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-100 hover:text-red-700" disabled={isLoading}>
              Delete Listing
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Permanently Delete Listing</AlertDialogTitle>
              <AlertDialogDescription>
                <p className="mb-4">This action will permanently delete the listing and all associated data. This cannot be undone.</p>
                <p className="font-medium mb-2">To confirm, please type the exact listing title:</p>
                <p className="text-sm italic mb-2">{listingTitle}</p>
                <Input
                  ref={confirmationInputRef}
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type listing title here"
                  className="mt-2"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={!isDeleteConfirmed}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading}>
              Reject Listing
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will reject the listing and notify the host. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleAction('reject')}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button 
          onClick={() => handleAction('approve')}
          disabled={isLoading}
        >
          Approve Listing
        </Button>
      </div>
    </div>
  )
}