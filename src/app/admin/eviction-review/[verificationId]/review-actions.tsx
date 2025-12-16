'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { markEvictionReviewed, markEvictionPendingReview } from '../_actions'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Clock } from 'lucide-react'

interface ReviewActionsProps {
  verificationId: string
  currentStatus: string
}

export function ReviewActions({ verificationId, currentStatus }: ReviewActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleMarkReviewed() {
    setIsLoading(true)
    try {
      await markEvictionReviewed(verificationId)
      router.refresh()
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkPending() {
    setIsLoading(true)
    try {
      await markEvictionPendingReview(verificationId)
      router.refresh()
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStatus === 'pending_review') {
    return (
      <Button onClick={handleMarkReviewed} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        )}
        Mark as Reviewed
      </Button>
    )
  }

  return (
    <Button variant="outline" onClick={handleMarkPending} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Clock className="h-4 w-4 mr-2" />
      )}
      Reopen for Review
    </Button>
  )
}
