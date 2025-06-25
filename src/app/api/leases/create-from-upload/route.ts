import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'
import { calculateRent } from '@/lib/calculate-rent';
import { createNotification } from '@/app/actions/notifications';
import prisma from '@/lib/prismadb'

const API_BASE_URL = 'https://api.boldsign.com';
const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;

export async function POST(request: NextRequest) {
  const { userId } = auth();
  
  console.log('=== API ROUTE START ===');
  
  try {
    const formData = await request.formData();
    const housingRequestId = formData.get('housingRequestId') as string;
    const listingId = formData.get('listingId') as string;
    const leaseFile = formData.get('leaseFile') as File;

    console.log('API Route received:', {
      housingRequestId,
      listingId,
      fileName: leaseFile?.name,
      fileSize: leaseFile?.size,
      userId
    });

    if (!housingRequestId || !leaseFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // STEP 1: Basic validation successful
    console.log('Step 1 passed: Basic validation successful');
    
    // STEP 2: Get housing request data
    console.log('Step 2: Fetching housing request data...');
    const housingRequest = await prisma?.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        trip: true,
        listing: {
          include: {
            user: true,
            monthlyPricing: true
          }
        },
        user: true,
      },
    });

    if (!housingRequest) {
      return NextResponse.json({ error: 'Housing request not found' }, { status: 404 });
    }

    console.log('Step 2 passed: Housing request found', {
      id: housingRequest.id,
      hasTrip: !!housingRequest.trip,
      hasListing: !!housingRequest.listing,
      hasUser: !!housingRequest.user,
      hasListingUser: !!housingRequest.listing?.user
    });

    const tenant = housingRequest.user;
    const landlord = housingRequest.listing.user;

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant user not found' }, { status: 404 });
    }

    if (!landlord) {
      return NextResponse.json({ error: 'Landlord user not found' }, { status: 404 });
    }

    // STEP 3: Convert file to base64 with proper data URI format
    console.log('Step 3: Converting file to base64 with data URI format...');
    const fileBuffer = await leaseFile.arrayBuffer();
    const base64Content = Buffer.from(fileBuffer).toString('base64');
    const base64File = `data:${leaseFile.type};base64,${base64Content}`;
    console.log('Step 3 passed: File converted', {
      originalSize: base64Content.length,
      withDataURI: base64File.length,
      fileType: leaseFile.type
    });

    // STEP 4: Create BoldSign document request
    console.log('Step 4: Preparing BoldSign API request...');
    
    const documentRequestData = {
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/lease-success?listingId=${housingRequest.listingId}&housingRequestId=${housingRequestId}&documentId={{DocumentId}}`,
      showToolbar: true,
      sendViewOption: "PreparePage",
      showSaveButton: true,
      locale: "EN",
      showSendButton: true,
      showPreviewButton: true,
      showNavigationButtons: true,
      showTooltip: false,
      embeddedSendLinkValidTill: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      files: [base64File],
      title: `Lease Agreement for ${housingRequest.listing.locationString}`,
      message: "Please review and sign the lease agreement.",
      signers: [
        {
          name: `${landlord?.firstName} ${landlord?.lastName}`.trim(),
          emailAddress: landlord?.email || "",
          signerOrder: 1,
          signerType: "Signer",
          deliveryMode: "Email",
          locale: "EN",
          signerRole: "Host"
        },
        {
          name: `${tenant?.firstName} ${tenant?.lastName}`.trim(),
          emailAddress: tenant?.email || "",
          signerOrder: 2,
          signerType: "Signer",
          deliveryMode: "Email",
          locale: "EN",
          signerRole: "Tenant"
        }
      ],
      enableSigningOrder: false,
      expiryDateType: "Days",
      expiryValue: 30,
      reminderSettings: {
        enableAutoReminder: true,
        reminderDays: 3,
        reminderCount: 5
      },
      disableEmails: false,
      enablePrintAndSign: true,
      enableReassign: true,
      disableExpiryAlert: false,
      documentInfo: [
        {
          locale: "EN",
          title: `Lease Agreement - ${housingRequest.listing.locationString}`,
          description: `Lease agreement for ${housingRequest.listing.locationString}`
        }
      ],
      AutoDetectFields: true,
      documentDownloadOption: "Combined"
    };

    console.log('Step 4: Sending request to BoldSign API...');
    const response = await fetch(`${API_BASE_URL}/v1/document/createEmbeddedRequestUrl`, {
      method: 'POST',
      headers: {
        'X-API-KEY': BOLDSIGN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentRequestData),
    });

    console.log('Step 4: BoldSign API response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('BoldSign document creation failed:', error);
      return NextResponse.json({ error: `BoldSign API error (${response.status}): ${JSON.stringify(error)}` }, { status: 500 });
    }

    const result = await response.json();
    console.log('Step 4 passed: Document embed URL created');
    console.log('BoldSign result keys:', Object.keys(result));
    
    // STEP 5: Find existing Match and update with leaseDocumentId, or create BoldSignLease
    console.log('Step 5: Finding existing Match and updating with leaseDocumentId...');
    
    // Find existing match for this housing request
    let match = await prisma.match.findFirst({
      where: {
        tripId: housingRequest.trip.id,
        listingId: housingRequest.listing.id,
      }
    });

    if (!match) {
      // If no match exists, create one (fallback for edge cases)
      const monthlyRent = calculateRent({ listing: housingRequest.listing, trip: housingRequest.trip });
      match = await prisma.match.create({
        data: {
          tripId: housingRequest.trip.id,
          listingId: housingRequest.listing.id,
          monthlyRent,
          leaseDocumentId: result.documentId
        }
      });
      console.log('Step 5a: Created new match (no existing match found)', { matchId: match.id });
    } else {
      // Update existing match with leaseDocumentId
      match = await prisma.match.update({
        where: { id: match.id },
        data: { leaseDocumentId: result.documentId }
      });
      console.log('Step 5a passed: Updated existing match with leaseDocumentId', { matchId: match.id, leaseDocumentId: result.documentId });
    }

    // Create BoldSignLease record
    const boldSignLease = await prisma?.boldSignLease.create({
      data: {
        id: result.documentId,
        matchId: match.id,
        landlordId: landlord.id,
        primaryTenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    if (!boldSignLease) {
      console.error('Failed to create BoldSignLease record');
      return NextResponse.json({ error: 'Failed to create lease record' }, { status: 500 });
    }

    console.log('Step 5b passed: BoldSignLease created', { leaseId: boldSignLease.id });

    // Update housing request with the boldSignLeaseId and approve it
    await prisma.housingRequest.update({
      where: { id: housingRequestId },
      data: { 
        boldSignLeaseId: boldSignLease.id,
        status: 'approved'
      }
    });

    console.log('Step 5c passed: Housing request updated and approved');
    // Note: Notifications will be sent by the webhook when the "Sent" event is received
    
    return NextResponse.json({ 
      success: true, 
      embedUrl: result.sendUrl,
      documentId: result.documentId,
      templateId: result.templateId,
      matchId: match.id,
      boldSignLeaseId: boldSignLease.id
    });

  } catch (error) {
    console.error('Error creating lease from upload:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function formatDate(dateString: Date | string) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}