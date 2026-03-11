'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ReferralData, ReferralStats, exportReferralsCsv } from './_actions'
import { ChevronLeft, ChevronRight, Download, Search, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'

interface ReferralsTableProps {
  referrals: ReferralData[]
  totalCount: number
  currentPage: number
  pageSize: number
  stats: ReferralStats
  quarters: string[]
  status: string
  quarter: string
  search: string
}

export default function ReferralsTable({
  referrals,
  totalCount,
  currentPage,
  pageSize,
  stats,
  quarters,
  status,
  quarter,
  search: initialSearch
}: ReferralsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [isExporting, setIsExporting] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)

  const updateParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    router.push(`/admin/referrals?${newParams.toString()}`)
  }

  const handleSearch = () => {
    updateParams({ search, page: '1' })
  }

  const handleStatusChange = (value: string) => {
    updateParams({ status: value, page: '1' })
  }

  const handleQuarterChange = (value: string) => {
    updateParams({ quarter: value, page: '1' })
  }

  const handlePageChange = (page: number) => {
    updateParams({ page: page.toString() })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await exportReferralsCsv({ status, quarter })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'qualified':
        return <Badge variant="default" className="bg-green-500">Qualified</Badge>
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
          <div className="text-sm text-gray-500">Total Referrals</div>
          <div className="text-2xl font-bold">{stats.totalReferrals}</div>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Qualified</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.qualifiedReferrals}
          </div>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Total Value</div>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.pendingPayoutAmount)}
          </div>
          <Link href="/admin/payouts" className="text-sm text-blue-600 hover:underline">
            Manage Payouts
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Search</label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="w-[150px]">
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[150px]">
          <label className="text-sm font-medium mb-1 block">Quarter</label>
          <Select value={quarter} onValueChange={handleQuarterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Quarters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              {quarters.map(q => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
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
                    <TooltipContent>The user who shared their referral link</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Referred Host
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>The new host who signed up using the referral link</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Signup Date
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>When the referred host created their account</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Qualified Date
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>When the referred host received their first booking</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Booking
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>The first booking that qualified this referral</TooltipContent>
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
                    <TooltipContent>Pending = awaiting first booking, Qualified = ready for payout</TooltipContent>
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
                    <TooltipContent>The payout quarter when the reward is due</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Amount
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>The reward amount to be paid to the referrer</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No referrals found
                </TableCell>
              </TableRow>
            ) : (
              referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div className="font-medium">
                      {referral.referrer.firstName} {referral.referrer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {referral.referrer.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {referral.referredUser.firstName} {referral.referredUser.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {referral.referredUser.email}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(referral.createdAt)}</TableCell>
                  <TableCell>{formatDate(referral.qualifiedAt)}</TableCell>
                  <TableCell>
                    {referral.qualifyingBookingId ? (
                      <Link
                        href={`/admin/bookings/${referral.qualifyingBookingId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(referral.status)}</TableCell>
                  <TableCell>{referral.payoutQuarter || '-'}</TableCell>
                  <TableCell>{formatCurrency(referral.rewardAmount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </TooltipProvider>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} referrals
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
