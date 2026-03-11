'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PayoutData, PayoutStats, markPayoutPaid, unmarkPayoutPaid, exportPayoutsCsv } from './_actions'
import { Download, Info } from 'lucide-react'

interface PayoutsTableProps {
  payouts: PayoutData[]
  stats: PayoutStats
  quarters: string[]
  quarter: string
  status: string
}

export default function PayoutsTable({
  payouts,
  stats,
  quarters,
  quarter,
  status: initialStatus,
}: PayoutsTableProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  // Mark Paid dialog state
  const [markingPaidPayout, setMarkingPaidPayout] = useState<PayoutData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  // Unmark Paid dialog state
  const [unmarkingPaidPayout, setUnmarkingPaidPayout] = useState<PayoutData | null>(null)
  const [isUnmarkingPaid, setIsUnmarkingPaid] = useState(false)

  const updateParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams()
    const currentQuarter = quarter
    const currentStatus = initialStatus

    // Keep existing params
    if (currentQuarter && currentQuarter !== 'all') newParams.set('quarter', currentQuarter)
    if (currentStatus && currentStatus !== 'all') newParams.set('status', currentStatus)

    // Apply new params
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })

    router.push(`/admin/payouts?${newParams.toString()}`)
  }

  const handleQuarterChange = (value: string) => {
    updateParams({ quarter: value })
  }

  const handleStatusChange = (value: string) => {
    updateParams({ status: value })
  }

  const handleOpenMarkPaid = (payout: PayoutData) => {
    setMarkingPaidPayout(payout)
    setPaymentMethod('')
    setPaymentReference('')
    setNotes('')
  }

  const handleConfirmMarkPaid = async () => {
    if (!markingPaidPayout) return

    setIsMarkingPaid(true)
    try {
      await markPayoutPaid({
        userId: markingPaidPayout.user.id,
        quarter: markingPaidPayout.quarter,
        paymentMethod: paymentMethod || undefined,
        paymentReference: paymentReference || undefined,
        notes: notes || undefined,
      })
      router.refresh()
    } finally {
      setIsMarkingPaid(false)
      setMarkingPaidPayout(null)
    }
  }

  const handleConfirmUnmarkPaid = async () => {
    if (!unmarkingPaidPayout?.id) return

    setIsUnmarkingPaid(true)
    try {
      await unmarkPayoutPaid(unmarkingPaidPayout.id)
      router.refresh()
    } finally {
      setIsUnmarkingPaid(false)
      setUnmarkingPaidPayout(null)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await exportPayoutsCsv({ quarter, status: initialStatus })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Users Pending Payout</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.totalPendingUsers}</div>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Total Pending Amount</div>
          <div className="text-2xl font-bold text-yellow-600">
            {formatCurrency(stats.totalPendingAmount)}
          </div>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Users Paid</div>
          <div className="text-2xl font-bold text-green-600">{stats.totalPaidUsers}</div>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Total Paid Amount</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalPaidAmount)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="w-[180px]">
          <label className="text-sm font-medium mb-1 block">Quarter</label>
          <Select value={quarter} onValueChange={handleQuarterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select quarter" />
            </SelectTrigger>
            <SelectContent>
              {quarters.map(q => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[150px]">
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select value={initialStatus} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Table */}
      <TooltipProvider>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Referrer
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>The user receiving the payout for their referrals</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Quarter
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>The payout quarter for these referrals</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    # Referrals
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Number of qualified referrals in this payout</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Amount Due
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Total payout amount ($50 per qualified referral)</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Status
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Pending = awaiting payment, Paid = payment sent</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Paid Date
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>When the payout was marked as paid</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Payment Method
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>How the payment was sent (check, Venmo, etc.)</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Actions
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Mark payout as paid or revert payment status</TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No payouts found
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout, index) => (
                  <TableRow key={payout.id || `${payout.user.id}-${payout.quarter}`}>
                    <TableCell>
                      <div className="font-medium">
                        {payout.user.firstName} {payout.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.user.email}
                      </div>
                    </TableCell>
                    <TableCell>{payout.quarter}</TableCell>
                    <TableCell>{payout.referralCount}</TableCell>
                    <TableCell>{formatCurrency(payout.amount)}</TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell>{formatDate(payout.paidAt)}</TableCell>
                    <TableCell>{payout.paymentMethod || '-'}</TableCell>
                    <TableCell>
                      {payout.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenMarkPaid(payout)}
                        >
                          Mark Paid
                        </Button>
                      )}
                      {payout.status === 'paid' && payout.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUnmarkingPaidPayout(payout)}
                        >
                          Unmark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {/* Mark Paid Dialog */}
      <Dialog open={!!markingPaidPayout} onOpenChange={(open) => !open && setMarkingPaidPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for {markingPaidPayout?.user.firstName} {markingPaidPayout?.user.lastName}&apos;s{' '}
              {markingPaidPayout?.quarter} payout of {markingPaidPayout && formatCurrency(markingPaidPayout.amount)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select method..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Reference # (optional)</Label>
              <Input
                id="paymentReference"
                placeholder="Check number, transaction ID, etc."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkingPaidPayout(null)} disabled={isMarkingPaid}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMarkPaid} disabled={isMarkingPaid}>
              {isMarkingPaid ? 'Marking...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unmark Paid Confirmation Dialog */}
      <AlertDialog open={!!unmarkingPaidPayout} onOpenChange={(open) => !open && setUnmarkingPaidPayout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmark Payout as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert this payout back to &quot;pending&quot; status? This should only be done if the payment was made in error.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnmarkingPaid}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnmarkPaid}
              disabled={isUnmarkingPaid}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnmarkingPaid ? 'Reverting...' : 'Unmark as Paid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
