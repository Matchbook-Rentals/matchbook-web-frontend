
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'
import { calculateRent } from '@/lib/calculate-rent';
import prisma from '@/lib/prismadb'

const API_BASE_URL = 'https://api.boldsign.com';
const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;
const defaultLease = '1c447c5d-b082-4875-a6f3-4637db4205e9';

export async function POST(request: NextRequest) {
  const { userId } = auth();
  console.log('HITTING')
  prisma.match.delete({
    where: {
      id: '12d0ea42-8ae4-46b8-92ef-375976c879f3'
    }
  })
  try {
    // This will need to be a switch based on lease location and num tenants
    const templateId = defaultLease;

    const url = `${API_BASE_URL}/v1/template/send?templateId=${templateId}`

    // Get the request body
    const body = await request.json();

    const housingRequest = await prisma?.housingRequest.findUnique({
      where: { id: body.housingRequestId },
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
      throw new Error('No housingRequest found');
    }
    let monthlyRent = calculateRent({ listing: housingRequest.listing, trip: housingRequest.trip })
    let tenant = housingRequest.user;
    let landlord = housingRequest.listing.user;


    let match;
    try {
      match = await prisma.match.create({
        data: {
          tripId: housingRequest.trip.id,
          listingId: housingRequest.trip.id,
          monthlyRent,
        }
      })
      console.log('MATCH', match);
    } catch (error) {
      console.log('Match Creation Failed - ', error);
      return NextResponse.json({ error: 'Match failed' })

    }

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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': BOLDSIGN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentRequestData),
    });

    const document = await response.json();
    console.log('DOCUMENT', document);

    // Create BoldSignLease record
    const boldSignLease = await prisma?.boldSignLease.create({
      data: {
        id: document.documentId, // Assuming 'id' from the BoldSign response is 'documentId'
        matchId: match.id,
        landlordId: landlord.id,
        primaryTenantId: tenant.id,
        createdAt: new Date(), // Add creation timestamp
        updatedAt: new Date(), // Add update timestamp
      }
    });

    // Error handling
    if (!boldSignLease) {
      console.error('Failed to create BoldSignLease record');
      return NextResponse.json({ error: 'Failed to create lease record' }, { status: 500 });
    }

    // Update housing request with the boldSignLeaseId
    await prisma.housingRequest.update({
      where: { id: body.housingRequestId },
      data: { boldSignLeaseId: boldSignLease.id }
    });

    if (!response.ok) {
      let message = await response.json();
      console.log("BoldSign API FAIL response:", message);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return NextResponse.json(userId);
  } catch (error) {
    console.error('Error creating document from template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}




function formatDate(dateString: Date | string) {
  console.log(dateString);
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based in JavaScript
  const year = date.getFullYear();

  const newDate = `${month}/${day}/${year}`
  console.log(newDate);
  return newDate;
}

