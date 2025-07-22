'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { approveLocationChange, rejectLocationChange } from '../_actions'
import { toast } from '@/components/ui/use-toast'

interface ApprovalActionsProps {
  listingId: string
  approvalStatus: string
  isApproved: boolean
  lastDecisionComment?: string | null
}

export function ApprovalActions({ 
  listingId, 
  approvalStatus, 
  isApproved,
  lastDecisionComment 
}: ApprovalActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await approveLocationChange(listingId)
      toast({
        title: "Location Changes Approved",
        description: "The listing location changes have been approved successfully.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve location changes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting the location changes.",
        variant: "destructive"
      })
      return
    }

    setIsRejecting(true)
    try {
      await rejectLocationChange(listingId, rejectionReason)
      toast({
        title: "Location Changes Rejected",
        description: "The listing location changes have been rejected.",
      })
      setShowRejectForm(false)
      setRejectionReason('')
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject location changes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsRejecting(false)
    }
  }

  const getStatusBadge = () => {
    if (approvalStatus === 'approved' && isApproved) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      )
    }
    if (approvalStatus === 'rejected') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      )
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Pending Review
      </Badge>
    )
  }

  const isPending = approvalStatus === 'pendingReview' || (!isApproved && approvalStatus !== 'rejected')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Approval Actions</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show previous decision comment if exists */}
        {lastDecisionComment && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="text-sm font-medium text-gray-600">Previous Decision:</span>
            <div className="text-sm text-gray-700 mt-1">{lastDecisionComment}</div>
          </div>
        )}

        {isPending ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Review the location changes and take action:
            </p>
            
            {!showRejectForm ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-1"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isApproving ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="destructive"
                  className="flex-1"
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Rejection Reason *
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejecting these location changes..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReject}
                    disabled={isRejecting || !rejectionReason.trim()}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectionReason('')
                    }}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            {approvalStatus === 'approved' ? 
              'These location changes have been approved.' : 
              'These location changes have been rejected.'
            }
          </div>
        )}
      </CardContent>
    </Card>
  )
}