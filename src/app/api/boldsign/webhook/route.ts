import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { createNotification } from '@/app/actions/notifications';

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
  console.log('Received BoldSign webhook request');
  
  try {
    const body: BoldSignWebhookEvent = await req.json();
    console.log('BoldSign webhook body:', JSON.stringify(body, null, 2));

    // Handle both "Signed" and "Sent" events
    if (body.event.eventType !== 'Signed' && body.event.eventType !== 'Sent') {
      console.log(`Ignoring event type: ${body.event.eventType}`);
      return NextResponse.json({ message: 'Event type not handled' }, { status: 200 });
    }

    const { documentId, signerDetails } = body.data;

    // Handle "Sent" event - document has been sent for signatures
    if (body.event.eventType === 'Sent') {
      console.log(`Processing "Sent" event for documentId: ${documentId}`);
      
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
          landlord: true,
          primaryTenant: true
        }
      });

      if (!boldSignLease) {
        console.log(`No BoldSignLease found for documentId: ${documentId}`);
        return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
      }

      console.log(`Found BoldSignLease for "Sent" event: ${boldSignLease.id}`);

      // Send combined approval and lease signing notifications
      const notifications = [];

      // Notify landlord
      const landlordNotification = await createNotification({
        userId: boldSignLease.landlordId,
        content: `Application approved! Your lease agreement for ${body.data.messageTitle} is ready for your signature.`,
        url: `/platform/host/match/${boldSignLease.matchId}`,
        actionType: 'application_approved_lease_ready',
        actionId: boldSignLease.id
      });
      
      if (landlordNotification.success) {
        notifications.push('landlord');
        console.log('Combined approval/lease notification sent to landlord');
      }

      // Notify primary tenant
      if (boldSignLease.primaryTenantId) {
        const tenantNotification = await createNotification({
          userId: boldSignLease.primaryTenantId,
          content: `Congratulations! Your application for ${body.data.messageTitle} has been approved and your lease is ready for signature.`,
          url: `/platform/match/${boldSignLease.matchId}`,
          actionType: 'application_approved_lease_ready',
          actionId: boldSignLease.id
        });
        
        if (tenantNotification.success) {
          notifications.push('primary_tenant');
          console.log('Combined approval/lease notification sent to primary tenant');
        }
      }

      return NextResponse.json({
        message: 'Sent event processed successfully',
        leaseId: boldSignLease.id,
        notificationsSent: notifications
      }, { status: 200 });
    }

    // Handle "Signed" event - continue with existing logic
    // Find the BoldSignLease by matching documentId stored in embedUrl or other field
    // Note: You may need to adjust this query based on how you store the documentId
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
      console.log(`No BoldSignLease found for documentId: ${documentId}`);
      return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
    }

    console.log(`Found BoldSignLease: ${boldSignLease.id}`);

    // Track who signed and who still needs to sign
    let landlordSigned = boldSignLease.landlordSigned;
    let tenantSigned = boldSignLease.tenantSigned;
    let notificationsSent = [];

    // Check each signer's status
    for (const signer of signerDetails) {
      if (signer.status === 'Completed') {
        // Determine if this is landlord or tenant based on role or email
        if (signer.signerRole === 'Host' || signer.signerEmail === boldSignLease.landlord.email) {
          landlordSigned = true;
          console.log(`Landlord signed: ${signer.signerEmail}`);
        } else if (signer.signerRole === 'Tenant') {
          tenantSigned = true;
          console.log(`Tenant signed: ${signer.signerEmail}`);
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

    console.log(`Updated lease signing status - Landlord: ${landlordSigned}, Tenant: ${tenantSigned}`);

    // Send notifications to parties who still need to sign
    if (!landlordSigned) {
      // Notify landlord that lease is ready for signature
      const notificationResult = await createNotification({
        userId: boldSignLease.landlordId,
        content: `Your lease agreement for ${body.data.messageTitle} is ready for your signature.`,
        url: `/platform/host/${boldSignLease.match.listingId}/applications/${boldSignLease.match.housingRequestId}/lease`,
        actionType: 'lease_signature_required',
        actionId: boldSignLease.id
      });
      
      if (notificationResult.success) {
        notificationsSent.push('landlord');
        console.log('Notification sent to landlord');
      }
    }

    if (!tenantSigned) {
      // Get primary tenant ID - you may need to adjust this based on your data structure
      const primaryTenantId = boldSignLease.primaryTenantId;
      
      if (primaryTenantId) {
        const notificationResult = await createNotification({
          userId: primaryTenantId,
          content: `Your lease agreement for ${body.data.messageTitle} is ready for your signature.`,
          url: `/platform/searches/book/${boldSignLease.matchId}`,
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
          url: `/platform/searches/book/${boldSignLease.matchId}`,
          actionType: 'lease_signature_required',
          actionId: boldSignLease.id
        });
        
        if (notificationResult.success) {
          notificationsSent.push('secondary_tenant');
          console.log('Notification sent to secondary tenant');
        }
      }
    }

    // If both parties have signed, send completion notifications
    if (landlordSigned && tenantSigned) {
      console.log('Lease fully executed - sending completion notifications');
      
      // Notify all parties that lease is fully executed
      const completionNotifications = [
        {
          userId: boldSignLease.landlordId,
          content: `Congratulations! The lease agreement for ${body.data.messageTitle} has been fully executed by all parties.`,
          url: `/platform/host/${boldSignLease.match.listingId}/applications/${boldSignLease.match.housingRequestId}/lease`,
          actionType: 'lease_fully_executed',
          actionId: boldSignLease.id
        },
        {
          userId: boldSignLease.primaryTenantId,
          content: `Congratulations! The lease agreement for ${body.data.messageTitle} has been fully executed by all parties.`,
          url: `/platform/searches/book/${boldSignLease.matchId}`,
          actionType: 'lease_fully_executed',
          actionId: boldSignLease.id
        }
      ];

      if (boldSignLease.secondaryTenantId) {
        completionNotifications.push({
          userId: boldSignLease.secondaryTenantId,
          content: `Congratulations! The lease agreement for ${body.data.messageTitle} has been fully executed by all parties.`,
          url: `/platform/searches/book/${boldSignLease.matchId}`,
          actionType: 'lease_fully_executed',
          actionId: boldSignLease.id
        });
      }

      for (const notification of completionNotifications) {
        await createNotification(notification);
      }
      
      notificationsSent.push('all_parties_completion');
    }

    return NextResponse.json({
      message: 'Webhook processed successfully',
      leaseId: boldSignLease.id,
      landlordSigned,
      tenantSigned,
      notificationsSent
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing BoldSign webhook:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
