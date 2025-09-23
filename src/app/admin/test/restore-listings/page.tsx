'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { fetchSoftDeletedListings, restoreSoftDeletedListing } from '@/app/actions/listings'
import { format } from 'date-fns'

interface SoftDeletedListing {
  id: string;
  title: string | null;
  streetAddress1: string | null;
  city: string | null;
  state: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export default function RestoreListingsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState<SoftDeletedListing[]>([])
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      const userRole = user.publicMetadata?.role as string
      const hasAdminAccess = userRole?.includes('admin')
      if (!hasAdminAccess) {
        router.push('/unauthorized')
        return
      }
    }
    setIsLoading(false)
    loadSoftDeletedListings()
  }, [user, router])

  const loadSoftDeletedListings = async () => {
    try {
      const result = await fetchSoftDeletedListings()
      if (result.success && result.listings) {
        setListings(result.listings)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load listings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load soft-deleted listings' })
    }
  }

  const handleRestore = async (listingId: string) => {
    setRestoringId(listingId)
    setMessage(null)

    try {
      const result = await restoreSoftDeletedListing(listingId)
      if (result.success) {
        setMessage({ type: 'success', text: 'Listing restored successfully!' })
        // Remove the restored listing from the list
        setListings(prev => prev.filter(l => l.id !== listingId))
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to restore listing' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to restore listing' })
    } finally {
      setRestoringId(null)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  const formatAddress = (listing: SoftDeletedListing) => {
    const parts = [listing.streetAddress1, listing.city, listing.state].filter(Boolean)
    return parts.join(', ') || 'No address'
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/test">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Test Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSoftDeletedListings}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Restore Soft-Deleted Listings</h1>
        <p className="text-muted-foreground">
          View and restore listings that have been soft-deleted for testing purposes
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No soft-deleted listings found</h3>
            <p className="text-muted-foreground">
              All your listings are currently active, or you haven&apos;t soft-deleted any listings yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {listing.title || 'Untitled Listing'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatAddress(listing)}
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>ID: {listing.id}</p>
                      {listing.deletedAt && (
                        <p>Deleted: {format(new Date(listing.deletedAt), 'PPp')}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRestore(listing.id)}
                    disabled={restoringId === listing.id}
                    size="sm"
                  >
                    {restoringId === listing.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      'Restore'
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}