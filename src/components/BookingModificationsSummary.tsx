'use client'

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User } from "lucide-react"
import { DialogClose } from "@/components/brandDialog"

type BookingModification = {
  id: string
  originalStartDate: Date
  originalEndDate: Date
  newStartDate: Date
  newEndDate: Date
  reason?: string
  status: string
  requestedAt: Date
  viewedAt?: Date | null
  approvedAt?: Date | null
  rejectedAt?: Date | null
  rejectionReason?: string | null
  requestor: {
    fullName?: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  }
  recipient: {
    fullName?: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  }
}

interface BookingModificationsSummaryProps {
  modifications: BookingModification[]
  bookingTitle: string
}

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]'
    case 'pending':
      return 'bg-[#fff3cd] text-[#e67e22] border-[#e67e22]'
    case 'rejected':
      return 'bg-[#f8d7da] text-[#dc3545] border-[#dc3545]'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-400'
  }
}

const formatDateRange = (startDate: Date, endDate: Date) => {
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }
  return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`
}

const getRequestorName = (requestor: BookingModification['requestor']) => {
  return requestor.fullName || 
    `${requestor.firstName || ''} ${requestor.lastName || ''}`.trim() || 
    'Unknown User'
}

export default function BookingModificationsSummary({ 
  modifications, 
  bookingTitle 
}: BookingModificationsSummaryProps) {
  const modificationCount = modifications.length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#484a54]">
            Booking Changes
          </h2>
          <p className="text-sm text-[#777b8b] mt-1">
            {bookingTitle}
          </p>
        </div>
        <DialogClose asChild>
          <Button variant="outline" size="sm">
            Close
          </Button>
        </DialogClose>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-[#777b8b]">
          <Calendar className="w-4 h-4" />
          <span>
            {modificationCount === 1 
              ? '1 change requested' 
              : `${modificationCount} changes requested`
            }
          </span>
        </div>
      </div>

      {/* Modifications List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {modifications.map((modification, index) => (
          <div 
            key={modification.id} 
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            {/* Header with status and requester */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#777b8b]" />
                  <span className="text-sm font-medium text-[#484a54]">
                    {getRequestorName(modification.requestor)}
                  </span>
                </div>
                <Badge className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeStyle(modification.status)}`}>
                  {modification.status.charAt(0).toUpperCase() + modification.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#777b8b]">
                <Clock className="w-3 h-3" />
                <span>
                  {modification.requestedAt.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Date Changes */}
            <div className="space-y-2">
              <div className="text-xs text-[#777b8b] font-medium uppercase tracking-wide">
                Date Changes
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="mb-2">
                  <span className="text-[#777b8b]">From: </span>
                  <span className="text-[#484a54]">
                    {formatDateRange(modification.originalStartDate, modification.originalEndDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[#777b8b]">To: </span>
                  <span className="text-[#484a54] font-medium">
                    {formatDateRange(modification.newStartDate, modification.newEndDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reason */}
            {modification.reason && (
              <div className="mt-3">
                <div className="text-xs text-[#777b8b] font-medium uppercase tracking-wide mb-1">
                  Reason
                </div>
                <p className="text-sm text-[#484a54] bg-gray-50 rounded p-2">
                  {modification.reason}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {modification.status === 'rejected' && modification.rejectionReason && (
              <div className="mt-3">
                <div className="text-xs text-[#777b8b] font-medium uppercase tracking-wide mb-1">
                  Rejection Reason
                </div>
                <p className="text-sm text-[#dc3545] bg-red-50 rounded p-2">
                  {modification.rejectionReason}
                </p>
              </div>
            )}

            {/* Status Timestamps */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-xs text-[#777b8b]">
                {modification.viewedAt && (
                  <div>
                    <span className="font-medium">Viewed: </span>
                    {modification.viewedAt.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                {modification.approvedAt && (
                  <div>
                    <span className="font-medium text-[#1ca34e]">Approved: </span>
                    {modification.approvedAt.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                {modification.rejectedAt && (
                  <div>
                    <span className="font-medium text-[#dc3545]">Rejected: </span>
                    {modification.rejectedAt.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}