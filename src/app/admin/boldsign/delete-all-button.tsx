'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteAllButtonProps {
  totalDocuments: number
  deleteAction: () => Promise<{
    success: boolean
    message: string
    deletedLeases: number
    deletedTemplates: number
    totalDeleted: number
  }>
}

export function DeleteAllButton({ totalDocuments, deleteAction }: DeleteAllButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  const confirmationText = 'DELETE ALL DOCUMENTS'
  const isConfirmationValid = confirmText === confirmationText

  const handleDelete = async () => {
    if (!isConfirmationValid) return

    setIsDeleting(true)
    
    try {
      const result = await deleteAction()
      
      if (result.success) {
        toast.success(result.message)
        setIsOpen(false)
        setConfirmText('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  if (totalDocuments === 0) {
    return (
      <Button variant="destructive" disabled className="w-full">
        <Trash2 className="mr-2 h-4 w-4" />
        No Documents to Delete
      </Button>
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete All Documents ({totalDocuments})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action cannot be undone. This will permanently delete <strong>{totalDocuments}</strong> BoldSign documents 
              from the database, including all templates and leases.
            </p>
            <p>
              To confirm this action, please type <strong>{confirmationText}</strong> in the field below:
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="confirm-delete" className="text-sm font-medium">
            Confirmation
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmationText}
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Documents
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}