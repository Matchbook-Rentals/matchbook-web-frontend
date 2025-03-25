"use client";

import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getTickets, 
  updateTicketsStatus, 
  updateTicketsCategory, 
  deleteTickets 
} from '@/app/actions/tickets'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Trash,
  Tag,
  AlertTriangle
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
  const [tickets, setTickets] = useState<any[]>([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 10 })
  
  // Multi-select state
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  
  // Dialogs state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Action values
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
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
          // Reset selection when tickets change
          setSelectedTickets([])
          setIsAllSelected(false)
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
  
  // Multi-select handlers
  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedTickets([]);
      setIsAllSelected(false);
    } else {
      setSelectedTickets(tickets.map(ticket => ticket.id));
      setIsAllSelected(true);
    }
  }
  
  function toggleSelectTicket(id: string) {
    if (selectedTickets.includes(id)) {
      setSelectedTickets(selectedTickets.filter(ticketId => ticketId !== id));
      setIsAllSelected(false);
    } else {
      const newSelected = [...selectedTickets, id];
      setSelectedTickets(newSelected);
      // Check if all tickets are now selected
      setIsAllSelected(newSelected.length === tickets.length);
    }
  }
  
  // Batch actions
  async function handleUpdateStatus() {
    if (selectedTickets.length === 0 || !selectedStatus) return;
    
    setStatusDialogOpen(false);
    setLoading(true);
    
    try {
      const result = await updateTicketsStatus(selectedTickets, selectedStatus);
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Success",
          description: `Updated ${result.count} tickets to status: ${selectedStatus}`,
        });
        
        // Refresh the tickets list
        const refreshResult = await getTickets({ page, limit: 10, status, category });
        if (!refreshResult.error) {
          setTickets(refreshResult.tickets);
          setPagination(refreshResult.pagination);
        }
        
        // Reset selection
        setSelectedTickets([]);
        setIsAllSelected(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tickets",
      });
    } finally {
      setLoading(false);
    }
  }
  
  async function handleUpdateCategory() {
    if (selectedTickets.length === 0 || !selectedCategory) return;
    
    setCategoryDialogOpen(false);
    setLoading(true);
    
    try {
      const result = await updateTicketsCategory(selectedTickets, selectedCategory);
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Success",
          description: `Updated ${result.count} tickets to category: ${selectedCategory}`,
        });
        
        // Refresh the tickets list
        const refreshResult = await getTickets({ page, limit: 10, status, category });
        if (!refreshResult.error) {
          setTickets(refreshResult.tickets);
          setPagination(refreshResult.pagination);
        }
        
        // Reset selection
        setSelectedTickets([]);
        setIsAllSelected(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tickets",
      });
    } finally {
      setLoading(false);
    }
  }
  
  async function handleDeleteTickets() {
    if (selectedTickets.length === 0) return;
    
    setDeleteDialogOpen(false);
    setLoading(true);
    
    try {
      const result = await deleteTickets(selectedTickets);
      
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Success",
          description: `Deleted ${result.count} tickets`,
        });
        
        // Refresh the tickets list
        const refreshResult = await getTickets({ page, limit: 10, status, category });
        if (!refreshResult.error) {
          setTickets(refreshResult.tickets);
          setPagination(refreshResult.pagination);
        }
        
        // Reset selection
        setSelectedTickets([]);
        setIsAllSelected(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete tickets",
      });
    } finally {
      setLoading(false);
    }
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
              {/* Bulk actions toolbar */}
              {selectedTickets.length > 0 && (
                <div className="bg-muted rounded-md p-2 mb-4 flex items-center justify-between">
                  <div className="font-medium text-sm">
                    {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setStatusDialogOpen(true)}
                    >
                      Update Status
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      Update Category
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash className="h-4 w-4 mr-1" /> 
                      Delete
                    </Button>
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all tickets"
                      />
                    </TableHead>
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
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket: any) => (
                      <TableRow key={ticket.id} className={selectedTickets.includes(ticket.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedTickets.includes(ticket.id)}
                            onCheckedChange={() => toggleSelectTicket(ticket.id)}
                            aria-label={`Select ticket ${ticket.id}`}
                          />
                        </TableCell>
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
              
              {/* Status Update Dialog */}
              <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Ticket Status</DialogTitle>
                    <DialogDescription>
                      Change the status for {selectedTickets.length} selected ticket{selectedTickets.length !== 1 ? 's' : ''}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="" disabled>Select a status</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateStatus} disabled={!selectedStatus}>Update</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Category Update Dialog */}
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Ticket Category</DialogTitle>
                    <DialogDescription>
                      Change the category for {selectedTickets.length} selected ticket{selectedTickets.length !== 1 ? 's' : ''}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="" disabled>Select a category</option>
                      <option value="bug">Bug</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="account">Account</option>
                      <option value="billing">Billing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateCategory} disabled={!selectedCategory}>Update</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Tickets
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''}? 
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteTickets}>
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}