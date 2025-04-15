'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveRejectListing } from '../../listing-approval-actions'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export function ApprovalActions({ listingId }: { listingId: string }) {
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Admin Decision</h3>
      
      <Textarea
        placeholder="Add a comment or reason for your decision (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px]"
      />
      
      <div className="flex gap-4 justify-end">
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