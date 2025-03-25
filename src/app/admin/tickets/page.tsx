"use client";

import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTickets } from '@/app/actions/tickets'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PageProps {
  searchParams?: { 
    page?: string
    status?: string 
    category?: string
  }
}

export default function TicketsPage({ searchParams = {} }: PageProps) {
  const router = useRouter()
  const params = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 10 })
  
  const page = searchParams.page ? parseInt(searchParams.page) : 1
  const status = searchParams.status || ''
  const category = searchParams.category || ''
  
  useEffect(() => {
    async function loadTickets() {
      setLoading(true)
      try {
        const result = await getTickets({ 
          page, 
          limit: 10, 
          status, 
          category 
        })
        
        if (result.error) {
          setError(result.error)
        } else {
          setTickets(result.tickets)
          setPagination(result.pagination)
        }
      } catch (e) {
        setError('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    
    loadTickets()
  }, [page, status, category])
  
  function handlePageChange(newPage: number) {
    const url = new URL(window.location.href)
    url.searchParams.set('page', newPage.toString())
    router.push(url.toString())
  }
  
  function handleStatusChange(newStatus: string) {
    const url = new URL(window.location.href)
    if (newStatus) {
      url.searchParams.set('status', newStatus)
    } else {
      url.searchParams.delete('status')
    }
    url.searchParams.delete('page') // Reset to page 1
    router.push(url.toString())
  }
  
  function handleCategoryChange(newCategory: string) {
    const url = new URL(window.location.href)
    if (newCategory) {
      url.searchParams.set('category', newCategory)
    } else {
      url.searchParams.delete('category')
    }
    url.searchParams.delete('page') // Reset to page 1
    router.push(url.toString())
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'in-progress':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'resolved':
        return 'bg-green-500 hover:bg-green-600';
      case 'closed':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Support Tickets</CardTitle>
          <div className="flex gap-4">
            <select 
              className="px-2 py-1 border rounded-md"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select 
              className="px-2 py-1 border rounded-md"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="bug">Bug</option>
              <option value="feature-request">Feature Request</option>
              <option value="account">Account</option>
              <option value="billing">Billing</option>
              <option value="other">Other</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-xs">{ticket.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          {ticket.name || ticket.email.split('@')[0]}
                        </TableCell>
                        <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.category ? (
                            <Badge variant="outline">
                              {ticket.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/tickets/${ticket.id}`}>
                            <Button size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * pagination.limit + 1, pagination.total)} to{" "}
                    {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={page === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                      Page {page} of {pagination.pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.pages)}
                      disabled={page >= pagination.pages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}