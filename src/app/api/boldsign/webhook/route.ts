import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { createNotification } from '@/app/actions/notifications';
import { createBookingFromCompletedMatch } from '@/app/actions/bookings';

interface BoldSignWebhookEvent {
  event: {
    id: string;
    created: number;
    eventType: string;
    clientId: string | null;
    environment: string;
  };
  data: {
    object: string;
    documentId: string;
    messageTitle: string;
    documentDescription: string;
    status: string;
    senderDetail: {
      name: string;
      emailAddress: string;
    };
    signerDetails: Array<{
      signerName: string;
      signerRole: string;
      signerEmail: string;
      phoneNumber: string | null;
      status: string;
      enableAccessCode: boolean;
      isAuthenticationFailed: boolean | null;
      enableEmailOTP: boolean;
      isDeliveryFailed: boolean;
      isViewed: boolean;
      order: number;
      signerType: string;
      isReassigned: boolean;
      reassignMessage: string | null;
      declineMessage: string | null;
      lastActivityDate: number | null;
      authenticationType: string;
      idVerification: any | null;
      allowFieldConfiguration: boolean;
      lastReminderSentOn: string | null;
      authenticationRetryCount: number | null;
      authenticationSettings: any | null;
    }>;
    ccDetails: any[];
    onBehalfOf: any | null;
    createdDate: number;
    expiryDate: number;
    enableSigningOrder: boolean;
    disableEmails: boolean;
    revokeMessage: string | null;
    errorMessage: string | null;
    labels: any[];
    isCombinedAudit: boolean;
    BrandId: string | null;
    documentDownloadOption: string;
    metaData: any;
  };
  document: any;
}

export async function POST(req: Request) {
  const startTime = Date.now();

  console.log('🔔 [BoldSign Webhook] Received webhook request');

  try {
    const body: BoldSignWebhookEvent = await req.json();

    console.log('📦 [BoldSign Webhook] Full payload:', JSON.stringify(body, null, 2).substring(0, 1000));
    console.log('🏷️ [BoldSign Webhook] Event type:', body.event.eventType);

    // Handle both "Signed" and "Sent" events
    if (body.event.eventType !== 'Signed' && body.event.eventType !== 'Sent') {
      console.log(`⚠️ [BoldSign Webhook] Ignoring event type: ${body.event.eventType}`);
      return NextResponse.json({ message: 'Event type not handled' }, { status: 200 });
    }

    const { documentId, signerDetails } = body.data;
    console.log('📄 [BoldSign Webhook] Document ID:', documentId);

    // Handle "Sent" event - document has been sent for signatures
    if (body.event.eventType === 'Sent') {
      console.log(`📤 [BoldSign Webhook] Processing "Sent" event for documentId: ${documentId}`);
      
      // Find the BoldSignLease by documentId
      const boldSignLease = await prisma.boldSignLease.findFirst({
        where: {
          id: documentId,
        },
        include: {
          match: {
            include: {
              trip: true,
              listing: true
            }
          },
          landlord: true
        }
      });

      if (!boldSignLease) {
        console.log(`❌ [BoldSign Webhook] No BoldSignLease found for documentId: ${documentId}`);
        return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
      }

      console.log(`✅ [BoldSign Webhook] Found BoldSignLease for "Sent" event:`, {
        leaseId: boldSignLease.id,
        matchId: boldSignLease.matchId,
        landlordId: boldSignLease.landlordId,
        primaryTenantId: boldSignLease.primaryTenantId
      });

      // Send combined approval and lease signing notifications
      const notifications = [];

      // Notify landlord
      console.log('📧 [BoldSign Webhook] Sending notification to landlord...');
      const landlordNotification = await createNotification({
        userId: boldSignLease.landlordId,
        content: `Application approved! Your lease agreement for ${body.data.messageTitle} is ready for your signature.`,
        url: `/app/host/match/${boldSignLease.matchId}`,
        actionType: 'application_approved_lease_ready',
        actionId: boldSignLease.id
      });
      
      if (landlordNotification.success) {
        notifications.push('landlord');
        console.log('✅ [BoldSign Webhook] Combined approval/lease notification sent to landlord');
      } else {
        console.error('❌ [BoldSign Webhook] Failed to send notification to landlord');
      }

      // Notify primary tenant
      if (boldSignLease.primaryTenantId) {
        console.log('📧 [BoldSign Webhook] Sending notification to primary tenant...');
        const tenantNotification = await createNotification({
          userId: boldSignLease.primaryTenantId,
          content: `Congratulations! Your application for ${body.data.messageTitle} has been approved and your lease is ready for signature.`,
          url: `/app/match/${boldSignLease.matchId}`,
          actionType: 'application_approved_lease_ready',
          actionId: boldSignLease.id
        });
        
        if (tenantNotification.success) {
          notifications.push('primary_tenant');
          console.log('✅ [BoldSign Webhook] Combined approval/lease notification sent to primary tenant');
        } else {
          console.error('❌ [BoldSign Webhook] Failed to send notification to primary tenant');
        }
      } else {
        console.log('ℹ️ [BoldSign Webhook] No primary tenant to notify');
      }

      const processingTime = Date.now() - startTime;
      console.log('✅ [BoldSign Webhook] "Sent" event processed successfully');
      console.log('⏱️ [BoldSign Webhook] Processing time:', processingTime, 'ms');

      return NextResponse.json({
        message: 'Sent event processed successfully',
        leaseId: boldSignLease.id,
        notificationsSent: notifications
      }, { status: 200 });
    }

    // Handle "Signed" event - continue with existing logic
    console.log(`✍️ [BoldSign Webhook] Processing "Signed" event for documentId: ${documentId}`);

    // Find the BoldSignLease by matching documentId stored in embedUrl or other field
    // Note: You may need to adjust this query based on how you store the documentId
    console.log('🔍 [BoldSign Webhook] Looking up BoldSignLease...');
    const boldSignLease = await prisma.boldSignLease.findFirst({
      where: {
        id: documentId,
      },
      include: {
        match: true,
        landlord: true
      }
    });

    if (!boldSignLease) {
      console.log(`❌ [BoldSign Webhook] No BoldSignLease found for documentId: ${documentId}`);
      return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
    }

    console.log(`✅ [BoldSign Webhook] Found BoldSignLease:`, {
      leaseId: boldSignLease.id,
      matchId: boldSignLease.matchId,
      landlordId: boldSignLease.landlordId,
      currentLandlordSigned: boldSignLease.landlordSigned,
      currentTenantSigned: boldSignLease.tenantSigned
    });

    // Track who signed and who still needs to sign
    let landlordSigned = boldSignLease.landlordSigned;
    let tenantSigned = boldSignLease.tenantSigned;
    let notificationsSent = [];

    // Check each signer's status
    console.log('🔍 [BoldSign Webhook] Checking signer statuses...');
    for (const signer of signerDetails) {
      console.log(`   Signer: ${signer.signerEmail} (${signer.signerRole}) - Status: ${signer.status}`);

      if (signer.status === 'Completed') {
        // Determine if this is landlord or tenant based on role or email
        if (signer.signerRole === 'Host' || signer.signerEmail === boldSignLease.landlord.email) {
          landlordSigned = true;
          console.log(`   ✅ Landlord signed: ${signer.signerEmail}`);
        } else if (signer.signerRole === 'Tenant') {
          tenantSigned = true;
          console.log(`   ✅ Tenant signed: ${signer.signerEmail}`);
        }
      }
    }

    // Update the lease signing status
    const updatedLease = await prisma.boldSignLease.update({
      where: { id: boldSignLease.id },
      data: {
        landlordSigned,
        tenantSigned,
        updatedAt: new Date()
      }
    });

    // Update Match timestamps based on who signed
    const matchUpdateData: any = {};
    if (tenantSigned && !boldSignLease.tenantSigned) {
      matchUpdateData.tenantSignedAt = new Date();
    }
    if (landlordSigned && !boldSignLease.landlordSigned) {
      matchUpdateData.landlordSignedAt = new Date();
    }
    
    if (Object.keys(matchUpdateData).length > 0) {
      await prisma.match.update({
        where: { id: boldSignLease.matchId },
        data: matchUpdateData
      });
      console.log(`Updated Match timestamps:`, matchUpdateData);
    }

    console.log(`✅ [BoldSign Webhook] Updated lease signing status:`, {
      landlordSigned,
      tenantSigned,
      fullyExecuted: landlordSigned && tenantSigned
    });

    // Send notifications to parties who still needs to sign
    if (!landlordSigned) {
      console.log('📧 [BoldSign Webhook] Sending signature reminder to landlord...');
      // Notify landlord that lease is ready for signature
      const notificationResult = await createNotification({
        userId: boldSignLease.landlordId,
        content: `Your lease agreement for ${body.data.messageTitle} is ready for your signature.`,
        url: `/app/host/match/${boldSignLease.matchId}`,
        actionType: 'lease_signature_required',
        actionId: boldSignLease.id
      });
      
      if (notificationResult.success) {
        notificationsSent.push('landlord');
        console.log('✅ [BoldSign Webhook] Notification sent to landlord');
      } else {
        console.error('❌ [BoldSign Webhook] Failed to send notification to landlord');
      }
    }

    if (!tenantSigned) {
      console.log('📧 [BoldSign Webhook] Sending signature reminder to tenant(s)...');
      // Get primary tenant ID - you may need to adjust this based on your data structure
      const primaryTenantId = boldSignLease.primaryTenantId;
      
      if (primaryTenantId) {
        const notificationResult = await createNotification({
          userId: primaryTenantId,
          content: `Your lease agreement for ${body.data.messageTitle} is ready for your signature.`,
          url: `/app/searches/book/${boldSignLease.matchId}`,
          actionType: 'lease_signature_required',
          actionId: boldSignLease.id
        });
        
        if (notificationResult.success) {
          notificationsSent.push('primary_tenant');
          console.log('Notification sent to primary tenant');
        }
      }

      // Also notify secondary tenant if exists
      if (boldSignLease.secondaryTenantId) {
        const notificationResult = await createNotification({
          userId: boldSignLease.secondaryTenantId,
          content: `Your lease agreement for ${body.data.messageTitle} is ready for your signature.`,
          url: `/app/searches/book/${boldSignLease.matchId}`,
          actionType: 'lease_signature_required',
          actionId: boldSignLease.id
        });
        
        if (notificationResult.success) {
          notificationsSent.push('secondary_tenant');
          console.log('Notification sent to secondary tenant');
        }
      }
    }

    // If both parties have signed, check if we should create a booking
    if (landlordSigned && tenantSigned) {
      console.log('🎉 [BoldSign Webhook] Lease fully executed - checking for booking creation');
      
      // Get the match with payment authorization status
      const matchWithPayment = await prisma.match.findUnique({
        where: { id: boldSignLease.matchId },
        include: {
          booking: true,
          trip: true,
          listing: true
        }
      });

      // If payment is authorized and no booking exists yet, create one
      if (matchWithPayment?.paymentAuthorizedAt && !matchWithPayment.booking) {
        console.log('💾 [BoldSign Webhook] Creating booking for fully completed match...');

        const result = await createBookingFromCompletedMatch(matchWithPayment.id);

        if (result.success) {
          console.log('✅ [BoldSign Webhook] Booking created successfully:', result.booking?.id);
        } else {
          console.error('❌ [BoldSign Webhook] Failed to create booking:', result.error);
          // Continue with notifications even if booking creation fails
        }
      } else if (!matchWithPayment?.paymentAuthorizedAt) {
        console.log('⚠️ [BoldSign Webhook] Payment not authorized yet, booking creation deferred');
      } else if (matchWithPayment.booking) {
        console.log('ℹ️ [BoldSign Webhook] Booking already exists:', matchWithPayment.booking.id);
      }
      
      // Notify all parties that lease is fully executed
      const completionNotifications = [
        {
          userId: boldSignLease.landlordId,
          content: `Congratulations! The lease agreement for ${body.data.messageTitle} has been fully executed by all parties.`,
          url: `/app/host/match/${boldSignLease.matchId}`,
          actionType: 'lease_fully_executed',
          actionId: boldSignLease.id
        },
        {
          userId: boldSignLease.primaryTenantId,
          content: `Congratulations! The lease agreement for ${body.data.messageTitle} has been fully executed by all parties.`,
          url: `/app/searches/book/${boldSignLease.matchId}`,
          actionType: 'lease_fully_executed',
          actionId: boldSignLease.id
        }
      ];

      if (boldSignLease.secondaryTenantId) {
        completionNotifications.push({
          userId: boldSignLease.secondaryTenantId,
          content: `Congratulations! The lease agreement for ${body.data.messageTitle} has been fully executed by all parties.`,
          url: `/app/searches/book/${boldSignLease.matchId}`,
          actionType: 'lease_fully_executed',
          actionId: boldSignLease.id
        });
      }

      console.log('📧 [BoldSign Webhook] Sending completion notifications to all parties...');
      for (const notification of completionNotifications) {
        const result = await createNotification(notification);
        console.log(`   ${result.success ? '✅' : '❌'} Notification to user ${notification.userId}`);
      }

      notificationsSent.push('all_parties_completion');
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ [BoldSign Webhook] Webhook processed successfully');
    console.log('⏱️ [BoldSign Webhook] Processing time:', processingTime, 'ms');

    return NextResponse.json({
      message: 'Webhook processed successfully',
      leaseId: boldSignLease.id,
      landlordSigned,
      tenantSigned,
      notificationsSent
    }, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [BoldSign Webhook] Error processing webhook:', error);
    console.error('   Error type:', error instanceof Error ? error.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('⏱️ [BoldSign Webhook] Failed after:', processingTime, 'ms');

    return NextResponse.json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
