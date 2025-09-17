'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Receipt,
  Calendar,
  DollarSign,
  XCircle,
  CheckCircle,
  Eye
} from 'lucide-react'

interface PaymentActionsProps {
  paymentId: string
  isPaid: boolean
  amount: number
  dueDate: Date
  onViewReceipt: () => void
  onReschedule: () => void
  onEditAmount: () => void
  onCancel: () => void
  onTogglePaid: () => void
}

export default function PaymentActions({
  paymentId,
  isPaid,
  amount,
  dueDate,
  onViewReceipt,
  onReschedule,
  onEditAmount,
  onCancel,
  onTogglePaid
}: PaymentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* View Actions */}
        <DropdownMenuItem onClick={onViewReceipt}>
          <Receipt className="w-4 h-4 mr-2" />
          View Itemized Receipt
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Modification Actions */}
        {!isPaid && (
          <>
            <DropdownMenuItem onClick={onReschedule}>
              <Calendar className="w-4 h-4 mr-2" />
              Reschedule Payment
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onEditAmount}>
              <DollarSign className="w-4 h-4 mr-2" />
              Edit Amount
            </DropdownMenuItem>
          </>
        )}

        {/* Status Actions */}
        <DropdownMenuItem onClick={onTogglePaid}>
          {isPaid ? (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Mark as Unpaid
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </>
          )}
        </DropdownMenuItem>

        {/* Destructive Actions */}
        {!isPaid && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCancel}
              className="text-red-600 focus:text-red-600"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Payment
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}