'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import { createNotification } from './notifications'
import { buildNotificationEmailData } from '@/lib/notification-builders'
import { createBookingFromCompletedMatch } from './bookings'
import { approveHousingRequest } from './housing-requests'

// Handle completion of a signer's portion of the document
export async function handleSignerCompletion(
  documentId: string,
  currentSignerIndex: number,
  recipients: Array<{ id: string; name: string; email: string; role: string }>,
  housingRequestId?: string
) {
  try {
    console.log('🚀 handleSignerCompletion called with:', {
      documentId,
      currentSignerIndex,
      recipientsCount: recipients.length,
      housingRequestId: housingRequestId || 'UNDEFINED',
      hasHousingRequestId: !!housingRequestId
    });

    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Get the document with its current status
    const document = await prisma.documentInstance.findUnique({
      where: { id: documentId },
      include: {
        template: true
      }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Parse document data to get current state
    const documentData = document.documentData as any
    const totalSigners = recipients.length

    console.log(`📋 Signer ${currentSignerIndex + 1} completed signing document ${documentId}`)

    // If this is the host (signer1) signing, approve the housing request
    if (currentSignerIndex === 0 && housingRequestId) {
      console.log('🏠 Host signing detected - approving housing request:', housingRequestId);
      await handleHostSigningCompletion(documentId, recipients, housingRequestId)
    } else if (currentSignerIndex === 0) {
      console.log('⚠️ Host signing detected but NO housingRequestId provided!');
    }

    // Check if this was the last signer
    if (currentSignerIndex === totalSigners - 1) {
      // Document is fully signed - but DON'T create booking yet
      // Booking should be created after payment is completed
      console.log('✅ Document fully signed - awaiting payment before creating booking')
      
    } else {
      // Send notification to next signer
      const nextSignerIndex = currentSignerIndex + 1
      const nextSigner = recipients[nextSignerIndex]
      
      if (nextSigner) {
        console.log(`📤 Sending notification to next signer: ${nextSigner.name}`)
        
        await sendNextSignerNotification(documentId, nextSigner, document.template.title)
      }
    }

    console.log('✅ handleSignerCompletion completed successfully');
    return { success: true }
  } catch (error) {
    console.error('❌ Error in handleSignerCompletion:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Send notification to the next signer
async function sendNextSignerNotification(
  documentId: string,
  nextSigner: { id: string; name: string; email: string; role: string },
  documentTitle: string
) {
  try {
    // Find the user ID for the next signer based on their email
    const user = await prisma.user.findUnique({
      where: { email: nextSigner.email },
      select: { id: true }
    })

    if (!user) {
      console.log(`⚠️ User not found for email: ${nextSigner.email}`)
      return
    }

    // Find the match associated with this document to get the URL
    const match = await prisma.match.findFirst({
      where: { leaseDocumentId: documentId },
      include: {
        listing: { select: { title: true, userId: true } }
      }
    })

    if (!match) {
      console.log(`⚠️ No match found for document: ${documentId}`)
      return
    }

    // Get host name for the email
    const host = await prisma.user.findUnique({
      where: { id: match.listing.userId },
      select: { firstName: true, lastName: true }
    })
    const hostName = host ? `${host.firstName || ''} ${host.lastName || ''}`.trim() : 'the host'

    // Send notification to the renter that the lease is ready for signing
    await createNotification({
      userId: user.id,
      content: `You have a Match!`,
      url: `/app/rent/match/${match.id}/lease-signing`,
      actionType: 'application_approved',
      actionId: documentId,
      emailData: buildNotificationEmailData('application_approved', {
        listingTitle: match.listing.title,
        hostName
      })
    })

    console.log(`✅ Sent signing notification to ${nextSigner.name}`)
  } catch (error) {
    console.error('❌ Error sending next signer notification:', error)
  }
}

// Send notifications when document is fully signed (but don't create booking yet)

// Handle document completion - create booking and send notifications
async function handleDocumentCompletion(
  documentId: string,
  recipients: Array<{ id: string; name: string; email: string; role: string }>,
  document: any
) {
  try {
    // Find the associated match for this document
    // We'll need to look up the match based on the document or recipients
    const matchId = await findMatchForDocument(documentId, recipients)
    
    if (matchId) {
      // Create booking from the completed match (housing request flow)
      const bookingResult = await createBookingFromHousingRequestMatch(matchId)
      
      if (bookingResult.success) {
        console.log('✅ Booking created from completed document')
        
        // Send completion notifications to both parties
        await sendCompletionNotifications(
          recipients, 
          document.template.title, 
          bookingResult.booking?.id
        )
      } else {
        console.error('❌ Failed to create booking:', bookingResult.error)
        // Try fallback method
        const fallbackResult = await createBookingFromCompletedMatch(matchId)
        if (fallbackResult.success) {
          console.log('✅ Booking created using fallback method')
          await sendCompletionNotifications(
            recipients, 
            document.template.title, 
            fallbackResult.booking?.id
          )
        }
      }
    } else {
      console.log('⚠️ No associated match found for document')
      
      // Still send completion notifications even without booking
      await sendCompletionNotifications(recipients, document.template.title)
    }
  } catch (error) {
    console.error('❌ Error in handleDocumentCompletion:', error)
  }
}

// Find the match associated with this document
async function findMatchForDocument(
  documentId: string, 
  recipients: Array<{ id: string; name: string; email: string; role: string }>
): Promise<string | null> {
  try {
    // Get host and renter emails
    const hostRecipient = recipients.find(r => r.role === 'HOST')
    const renterRecipient = recipients.find(r => r.role === 'RENTER')
    
    if (!hostRecipient || !renterRecipient) {
      console.log('⚠️ Could not find both host and renter in recipients')
      return null
    }

    // Find users by email
    const [hostUser, renterUser] = await Promise.all([
      prisma.user.findUnique({ where: { email: hostRecipient.email } }),
      prisma.user.findUnique({ where: { email: renterRecipient.email } })
    ])

    if (!hostUser || !renterUser) {
      console.log('⚠️ Could not find users for host/renter emails')
      return null
    }

    // Find match where:
    // - Listing belongs to host user
    // - Trip belongs to renter user  
    // - No booking exists yet (payment authorization check removed for housing request flow)
    const match = await prisma.match.findFirst({
      where: {
        AND: [
          { listing: { userId: hostUser.id } },
          { trip: { userId: renterUser.id } },
          { booking: null }
        ]
      },
      orderBy: { createdAt: 'desc' } // Get most recent match
    })

    return match?.id || null
  } catch (error) {
    console.error('❌ Error finding match for document:', error)
    return null
  }
}

// Send completion notifications to all parties
async function sendCompletionNotifications(
  recipients: Array<{ id: string; name: string; email: string; role: string }>,
  documentTitle: string,
  bookingId?: string
) {
  try {
    for (const recipient of recipients) {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: recipient.email },
        select: { id: true }
      })

      if (!user) {
        console.log(`⚠️ User not found for email: ${recipient.email}`)
        continue
      }

      const isHost = recipient.role === 'HOST'
      const content = isHost
        ? `Lease agreement "${documentTitle}" has been fully executed. Your property is now booked!`
        : `Lease agreement "${documentTitle}" has been fully executed. Your booking is confirmed!`

      const url = bookingId
        ? (isHost ? `/app/host-dashboard/${bookingId}?tab=bookings` : `/app/renter/bookings/${bookingId}`)
        : `/app/documents`

      await createNotification({
        actionType: 'lease_fully_executed',
        actionId: bookingId || documentTitle,
        content,
        url,
        unread: true,
        userId: user.id,
      })

      console.log(`✅ Sent completion notification to ${recipient.name}`)
    }
  } catch (error) {
    console.error('❌ Error sending completion notifications:', error)
  }
}

// Handle when host (signer1) completes signing - approve housing request
async function handleHostSigningCompletion(
  documentId: string,
  recipients: Array<{ id: string; name: string; email: string; role: string }>,
  housingRequestId: string
) {
  try {
    console.log('🏠 Host signed document, approving housing request:', {
      documentId,
      housingRequestId,
      recipientsCount: recipients.length
    });
    
    // Approve the housing request (this creates the match and notifies the applicant)
    console.log('🔄 Calling approveHousingRequest with ID:', housingRequestId);
    const result = await approveHousingRequest(housingRequestId)
    
    console.log('📋 approveHousingRequest result:', result);
    
    if (result.success) {
      console.log('✅ Housing request approved, match created:', {
        housingRequestStatus: result.housingRequest?.status,
        matchId: result.match?.id,
        matchLeaseDocumentId: result.match?.leaseDocumentId
      });
      // Note: Booking will be created only when both parties have signed the document
    } else {
      console.error('❌ Failed to approve housing request - no result.success');
    }
  } catch (error) {
    console.error('❌ Error handling host signing completion:', error);
    throw error; // Re-throw to bubble up the error
  }
}

// Find housing request associated with this document
async function findHousingRequestForDocument(
  documentId: string,
  recipients: Array<{ id: string; name: string; email: string; role: string }>
): Promise<string | null> {
  try {
    // Get host and renter emails
    const hostRecipient = recipients.find(r => r.role === 'HOST')
    const renterRecipient = recipients.find(r => r.role === 'RENTER')
    
    if (!hostRecipient || !renterRecipient) {
      console.log('⚠️ Could not find both host and renter in recipients')
      return null
    }

    // Find users by email
    const [hostUser, renterUser] = await Promise.all([
      prisma.user.findUnique({ where: { email: hostRecipient.email } }),
      prisma.user.findUnique({ where: { email: renterRecipient.email } })
    ])

    if (!hostUser || !renterUser) {
      console.log('⚠️ Could not find users for host/renter emails')
      return null
    }

    // Find housing request where:
    // - Listing belongs to host user
    // - User is the renter user
    // - Status is pending (not yet approved)
    const housingRequest = await prisma.housingRequest.findFirst({
      where: {
        AND: [
          { listing: { userId: hostUser.id } },
          { userId: renterUser.id },
          { status: 'pending' }
        ]
      },
      orderBy: { createdAt: 'desc' } // Get most recent request
    })

    return housingRequest?.id || null
  } catch (error) {
    console.error('❌ Error finding housing request for document:', error)
    return null
  }
}

// Create booking from match (housing request flow - doesn't require payment authorization)
async function createBookingFromHousingRequestMatch(matchId: string) {
  try {
    console.log('📋 Creating booking from housing request match:', matchId)
    
    // Get the match with all required data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: true,
        listing: true,
        booking: true
      }
    })

    if (!match) {
      throw new Error(`Match ${matchId} not found`)
    }

    // Check if booking already exists
    if (match.booking) {
      console.log('Booking already exists for match:', matchId)
      return { success: true, booking: match.booking }
    }

    // Create the booking without requiring payment authorization (housing request flow)
    const booking = await prisma.booking.create({
      data: {
        userId: match.trip.userId,
        listingId: match.listingId,
        tripId: match.tripId,
        matchId: match.id,
        startDate: match.trip.startDate!,
        endDate: match.trip.endDate!,
        monthlyRent: match.monthlyRent,
        status: 'confirmed' // Status can be updated later when payment is processed
      }
    })

    console.log('✅ Booking created from housing request match:', booking.id)

    // Create notification for the host
    await createNotification({
      actionType: 'booking',
      actionId: booking.id,
      content: `You have a new booking for ${match.listing.title} from ${new Date(match.trip.startDate!).toLocaleDateString()} to ${new Date(match.trip.endDate!).toLocaleDateString()}`,
      url: `/app/host-dashboard/${match.listing.id}?tab=bookings`,
      unread: true,
      userId: match.listing.userId,
    })

    console.log('✅ Host booking notification sent')

    return { success: true, booking }
  } catch (error) {
    console.error('❌ Error creating booking from housing request match:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
