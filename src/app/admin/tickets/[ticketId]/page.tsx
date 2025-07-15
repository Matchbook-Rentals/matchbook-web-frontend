import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import prismadb from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import ClientTicketPage from './client-ticket-page'
// Removed createOrGetTicketConversation - now using Customer Support functions
import { getTicketConversation } from '@/app/actions/customer-support'

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

  // Try to get existing Customer Support conversation if the ticket has a user
  let conversation = null
  if (ticket.userId) {
    try {
      console.log('🎫 Server-side: Getting Customer Support conversation for ticket', { ticketId })
      const result = await getTicketConversation(ticketId)
      if (result.success) {
        conversation = result.conversation
        console.log('✅ Server-side: Customer Support conversation loaded', { 
          found: !!conversation,
          messageCount: conversation?.messages?.length 
        })
      } else {
        console.log('❌ Server-side: Failed to get Customer Support conversation', result.error)
      }
    } catch (error) {
      console.error('Failed to get Customer Support conversation:', error)
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
