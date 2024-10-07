import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'

const API_BASE_URL = 'https://api.boldsign.com';
const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');
  const signerEmail = searchParams.get('signerEmail');
  const signLinkValidTill = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString(); // 60 days from now 

  const response = await fetch(`${API_BASE_URL}/v1/document/getEmbeddedSignLink?documentId=${documentId}&signerEmail=${signerEmail}&signLinkValidTill=${signLinkValidTill}`, {
    headers: {
      'X-API-KEY': BOLDSIGN_API_KEY!
    }
  });

  if (!response.ok) {
    console.log("BoldSign API FAIL response:", response);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("BoldSign API GET DOCUMENT response:", data);

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    // Get the templateId from query parameters
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const url = `${API_BASE_URL}/v1/template/createEmbeddedRequestUrl?templateId=${templateId}`;

    // Get the request body
    const body = await request.json();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': BOLDSIGN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.log("BoldSign API FAIL response:", response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("BoldSign API response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating embedded request URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}







const requestBodySample = {
      showToolbar: true,
      sendViewOption: "PreparePage",
      showSaveButton: true,
      showSendButton: true,
      showPreviewButton: true,
      showNavigationButtons: true,
      sendLinkValidTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      title: "Lease Agreement for " + currListing.locationString,
      message: "Please review and sign the lease agreement.",
      roles: [
        {
          roleIndex: 1,
          signerName: currListing.user?.firstName + " " + currListing.user?.lastName || "",
          signerEmail: currListing.user?.email || "",
          signerOrder: 1,
          signerType: "signer",
          existingFormFields: [
            {
              id: 'monthlyRent',
              value: '$99899.00'
            }
          ]
        },
        {
          roleIndex: 2,
          signerName: currApplication?.firstName + " " + currApplication?.lastName || "",
          signerEmail: currApplication?.email || "tyler.bennett@matchbookrentals.com",
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
      enableReassign: true
    }
