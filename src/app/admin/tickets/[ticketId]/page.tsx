import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import prismadb from '@/lib/prismadb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { updateTicketStatus } from '@/app/actions/tickets'
import { ArrowLeft, Clock } from 'lucide-react'
import { SupportNotes } from './support-notes'

interface PageProps {
  params: { 
    ticketId: string 
  }
}

export default async function TicketDetailPage({ params }: PageProps) {
  if (!checkRole('admin')) {
    redirect('/unauthorized')
  }

  const { ticketId } = params
  
  const ticket = await prismadb.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        }
      }
    }
  })
  
  if (!ticket) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested ticket could not be found.</p>
            <Link href="/admin/tickets">
              <Button className="mt-4">Back to Tickets</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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

  async function handleStatusChange(newStatus: string) {
    'use server'
    await updateTicketStatus(ticketId, newStatus)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/admin/tickets">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted {formatDate(ticket.createdAt)}
                    </span>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                </div>
                
                <div>
                  <SupportNotes ticketId={ticket.id} defaultNotes={ticket.supportNotes || ''} />
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ticket ID</h3>
                  <p className="font-mono text-sm mt-1">{ticket.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Submitted By</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {ticket.user ? (
                      <>
                        {ticket.user.imageUrl && (
                          <img 
                            src={ticket.user.imageUrl} 
                            alt={`${ticket.user.firstName} ${ticket.user.lastName}`}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span>{ticket.user.firstName} {ticket.user.lastName}</span>
                      </>
                    ) : (
                      <span>{ticket.name || ticket.email}</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{ticket.email}</p>
                </div>
                
                {ticket.category && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Category</h3>
                    <Badge variant="outline" className="mt-1">
                      {ticket.category}
                    </Badge>
                  </div>
                )}
                
                {ticket.priority && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    <Badge variant="outline" className="mt-1">
                      {ticket.priority}
                    </Badge>
                  </div>
                )}
                
                {ticket.pageUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Page URL</h3>
                    <a 
                      href={ticket.pageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block mt-1 truncate"
                    >
                      {ticket.pageUrl}
                    </a>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <form action={handleStatusChange.bind(null, 'in-progress')}>
                      <Button 
                        type="submit"
                        className="w-full"
                        disabled={ticket.status === 'in-progress'}
                        variant={ticket.status === 'in-progress' ? 'outline' : 'default'}
                      >
                        In Progress
                      </Button>
                    </form>
                    <form action={handleStatusChange.bind(null, 'resolved')}>
                      <Button 
                        type="submit"
                        className="w-full"
                        disabled={ticket.status === 'resolved'}
                        variant={ticket.status === 'resolved' ? 'outline' : 'default'}
                      >
                        Resolved
                      </Button>
                    </form>
                    <form action={handleStatusChange.bind(null, 'open')}>
                      <Button 
                        type="submit"
                        className="w-full"
                        disabled={ticket.status === 'open'}
                        variant={ticket.status === 'open' ? 'outline' : 'default'}
                      >
                        Reopen
                      </Button>
                    </form>
                    <form action={handleStatusChange.bind(null, 'closed')}>
                      <Button 
                        type="submit"
                        className="w-full"
                        disabled={ticket.status === 'closed'}
                        variant={ticket.status === 'closed' ? 'outline' : 'default'}
                      >
                        Close
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
