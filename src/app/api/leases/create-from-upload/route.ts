import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'
import { calculateRent } from '@/lib/calculate-rent';
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
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/platform/host/${housingRequest.listingId}/applications/${housingRequestId}/lease-sent`,
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
          authenticationType: "EmailOTP",
          deliveryMode: "Email",
          locale: "EN",
          signerRole: "Host"
        },
        {
          name: `${tenant?.firstName} ${tenant?.lastName}`.trim(),
          emailAddress: tenant?.email || "",
          signerOrder: 2,
          signerType: "Signer",
          authenticationType: "EmailOTP",
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
    
    return NextResponse.json({ 
      success: true, 
      embedUrl: result.sendUrl,
      documentId: result.documentId,
      templateId: result.templateId
    });

    // COMMENTED OUT - REMAINING STEPS
    /*
    const monthlyRent = calculateRent({ listing: housingRequest.listing, trip: housingRequest.trip });

    // Create match first
    let match;
    try {
      match = await prisma.match.create({
        data: {
          tripId: housingRequest.trip.id,
          listingId: housingRequest.listing.id,
          monthlyRent,
        }
      });
    } catch (error) {
      console.log('Match Creation Failed - ', error);
      return NextResponse.json({ error: 'Match failed' }, { status: 500 });
    }

    // For now, use the existing default template workflow
    // TODO: Implement proper template creation from uploaded file
    const templateId = '1c447c5d-b082-4875-a6f3-4637db4205e9'; // Use default template

    // Create document from template
    const documentRequestData = {
      title: "Lease Agreement for " + housingRequest?.listing?.locationString,
      message: "Please review and sign the lease agreement.",
      roles: [
        {
          roleIndex: 1,
          signerName: `${landlord?.firstName} ${landlord?.lastName}`.trim(),
          signerEmail: landlord?.email || "",
          signerOrder: 1,
          signerType: "signer",
          existingFormFields: [
            {
              id: 'monthlyRent',
              value: `$${monthlyRent.toFixed(2)}`
            },
            {
              id: 'listingAddress',
              value: housingRequest.listing.locationString,
            },
            {
              id: 'startDate',
              value: formatDate(housingRequest.trip.startDate!)
            },
            {
              id: 'endDate',
              value: formatDate(housingRequest.trip.endDate!)
            },
          ]
        },
        {
          roleIndex: 2,
          signerName: `${tenant?.firstName} ${tenant?.lastName}`.trim(),
          signerEmail: tenant?.email,
          signerOrder: 2,
          signerType: "signer",
        }
      ],
      reminderSettings: {
        enableAutoReminder: true,
        reminderDays: 3,
        reminderCount: 5
      },
      expiryDays: 30,
      expiryDateType: "Days",
      expiryValue: 30,
      disableExpiryAlert: false,
      enablePrintAndSign: true,
      enableReassign: false,
      showToolbar: true,
      sendViewOption: "PreparePage",
      showSaveButton: true,
      showSendButton: true,
      showPreviewButton: true,
      showNavigationButtons: true,
      sendLinkValidTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    const documentResponse = await fetch(`${API_BASE_URL}/v1/template/send?templateId=${templateId}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': BOLDSIGN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentRequestData),
    });

    if (!documentResponse.ok) {
      const documentError = await documentResponse.json();
      console.error('BoldSign document creation failed:', documentError);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    const document = await documentResponse.json();

    // Step 3: Create BoldSignLease record
    const boldSignLease = await prisma?.boldSignLease.create({
      data: {
        id: document.documentId,
        matchId: match.id,
        landlordId: landlord.id,
        primaryTenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Step 4: Update housing request with the boldSignLeaseId
    await prisma.housingRequest.update({
      where: { id: housingRequestId },
      data: { boldSignLeaseId: boldSignLease.id }
    });

    return NextResponse.json({ 
      success: true, 
      boldSignLeaseId: boldSignLease.id,
      templateId: templateId,
      documentId: document.documentId 
    });
    */

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