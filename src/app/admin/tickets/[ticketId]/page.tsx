import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import prismadb from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import ClientTicketPage from './client-ticket-page'
import { createOrGetTicketConversation } from '@/app/actions/tickets'

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
  const { userId } = auth()
  
  if (!userId) {
    redirect('/unauthorized')
  }
  
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
    redirect('/admin/tickets')
  }

  // Get the current admin user
  const adminUser = await prismadb.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      imageUrl: true,
    }
  })

  // Try to get existing conversation if the ticket has a user
  let conversation = null
  if (ticket.userId) {
    try {
      conversation = await createOrGetTicketConversation(ticketId)
    } catch (error) {
      console.error('Failed to get/create conversation:', error)
    }
  }

  return (
    <ClientTicketPage 
      ticket={ticket} 
      user={adminUser} 
      conversation={conversation}
    />
  )
}
