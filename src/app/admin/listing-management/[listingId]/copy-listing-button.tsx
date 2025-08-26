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
import { useToast } from '@/components/ui/use-toast'
import { Copy, Loader2 } from 'lucide-react'
import { copyListingToAdmin } from '../../listing-management-actions'
import Link from 'next/link'

interface CopyListingButtonProps {
  listingId: string
  listingTitle: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  showText?: boolean
}

export default function CopyListingButton({ 
  listingId, 
  listingTitle,
  size = 'sm',
  variant = 'outline',
  showText = true
}: CopyListingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [newListingId, setNewListingId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleCopyListing = async () => {
    setIsLoading(true)
    try {
      const result = await copyListingToAdmin(listingId)
      
      if (result.success) {
        setNewListingId(result.newListingId)
        toast({
          title: "Listing Copied Successfully",
          description: (
            <div className="space-y-2">
              <p>The listing has been copied to your admin account for troubleshooting.</p>
              <Link 
                href={`/admin/listing-management/${result.newListingId}`}
                className="text-blue-600 hover:text-blue-800 underline block"
              >
                View copied listing →
              </Link>
            </div>
          ),
        })
        
        // Refresh the current page to reflect any changes
        router.refresh()
      }
    } catch (error) {
      console.error('Error copying listing:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to copy listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {showText && (isLoading ? "Copying..." : "Copy to Admin")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Copy Listing to Admin Account?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This will create a complete copy of "<strong>{listingTitle}</strong>" and assign it to your admin account.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium">⚠️ Troubleshooting Only</p>
              <p className="text-sm text-yellow-700 mt-1">
                This feature is intended for troubleshooting purposes. The copied listing will be:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Prefixed with "[ADMIN COPY]" in the title</li>
                <li>• Marked as a test listing</li>
                <li>• Set to pending review status</li>
                <li>• Assigned to your admin account</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              All images, pricing, and property details will be copied. The original listing will remain unchanged.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCopyListing}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Listing
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}