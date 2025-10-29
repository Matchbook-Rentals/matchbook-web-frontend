'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ExternalLink, AlertTriangle, DollarSign } from 'lucide-react'

interface DisputeData {
  id: string
  stripeDisputeId: string
  stripeChargeId: string
  stripePaymentIntentId: string | null
  amount: number
  currency: string
  reason: string
  status: string
  dueBy: Date | null
  createdAt: Date
  resolvedAt: Date | null
  matchId: string | null
  bookingId: string | null
  userId: string
  adminNotifiedAt: Date | null
  adminAssignedTo: string | null
  adminNotes: string | null
  booking?: {
    id: string
    status: string
  } | null
  user: {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
  }
}

interface RefundData {
  id: string
  stripeRefundId: string
  stripeChargeId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  reason: string | null
  status: string
  refundType: string
  createdAt: Date
  processedAt: Date | null
  matchId: string | null
  bookingId: string | null
  userId: string
  initiatedBy: string
  initiatorId: string | null
  booking?: {
    id: string
    status: string
  } | null
  user: {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
  }
}

interface PaymentIssuesTableProps {
  disputes: DisputeData[]
  refunds: RefundData[]
}

function getDisputeStatusBadge(status: string) {
  const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    'warning_needs_response': { variant: 'destructive', label: 'Needs Response' },
    'needs_response': { variant: 'destructive', label: 'Needs Response' },
    'under_review': { variant: 'secondary', label: 'Under Review' },
    'charge_refunded': { variant: 'outline', label: 'Refunded' },
    'won': { variant: 'default', label: 'Won' },
    'lost': { variant: 'destructive', label: 'Lost' },
  }

  const config = statusMap[status] || { variant: 'outline' as const, label: status }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function getRefundStatusBadge(status: string) {
  const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    'pending': { variant: 'secondary', label: 'Pending' },
    'succeeded': { variant: 'default', label: 'Succeeded' },
    'failed': { variant: 'destructive', label: 'Failed' },
    'canceled': { variant: 'outline', label: 'Canceled' },
  }

  const config = statusMap[status] || { variant: 'outline' as const, label: status }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function PaymentIssuesTable({ disputes, refunds }: PaymentIssuesTableProps) {
  const [activeTab, setActiveTab] = useState<'disputes' | 'refunds'>('disputes')

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const openInStripe = (disputeId: string, isLiveMode: boolean = true) => {
    const baseUrl = isLiveMode
      ? 'https://dashboard.stripe.com'
      : 'https://dashboard.stripe.com/test'
    window.open(`${baseUrl}/disputes/${disputeId}`, '_blank')
  }

  const openRefundInStripe = (paymentIntentId: string, isLiveMode: boolean = true) => {
    const baseUrl = isLiveMode
      ? 'https://dashboard.stripe.com'
      : 'https://dashboard.stripe.com/test'
    window.open(`${baseUrl}/payments/${paymentIntentId}`, '_blank')
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'disputes' | 'refunds')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="disputes" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Disputes ({disputes.length})
        </TabsTrigger>
        <TabsTrigger value="refunds" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Refunds ({refunds.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="disputes" className="pt-4 md:pt-8 space-y-4">
        {disputes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No disputes found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Due By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-xs">
                      {dispute.stripeDisputeId.substring(0, 12)}...
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(dispute.amount, dispute.currency)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {dispute.reason.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      {getDisputeStatusBadge(dispute.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {dispute.user.firstName} {dispute.user.lastName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {dispute.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dispute.bookingId ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => window.open(`/admin/booking-management/${dispute.bookingId}`, '_blank')}
                        >
                          {dispute.bookingId.substring(0, 8)}...
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {dispute.dueBy ? (
                        <div className="text-sm">
                          {new Date(dispute.dueBy).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInStripe(dispute.stripeDisputeId)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Stripe
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="refunds" className="pt-4 md:pt-8 space-y-4">
        {refunds.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No refunds found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refund ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Initiated By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell className="font-mono text-xs">
                      {refund.stripeRefundId.substring(0, 12)}...
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(refund.amount, refund.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={refund.refundType === 'full' ? 'default' : 'secondary'}>
                        {refund.refundType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getRefundStatusBadge(refund.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {refund.user.firstName} {refund.user.lastName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {refund.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {refund.bookingId ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => window.open(`/admin/booking-management/${refund.bookingId}`, '_blank')}
                        >
                          {refund.bookingId.substring(0, 8)}...
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">
                      {refund.initiatedBy}
                    </TableCell>
                    <TableCell>
                      {new Date(refund.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRefundInStripe(refund.stripePaymentIntentId)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Stripe
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
