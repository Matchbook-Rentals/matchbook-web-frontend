import { NextRequest, NextResponse } from 'next/server';
import { updateHousingRequest } from '@/app/actions/housing-requests';
import { updateMatch, getMatch } from '@/app/actions/matches';
import { getHousingRequestById } from '@/app/actions/housing-requests';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const housingRequestId = formData.get('housingRequestId') as string;
    const listingId = formData.get('listingId') as string;
    const leaseFile = formData.get('leaseFile') as File;

    if (!housingRequestId) {
      return NextResponse.json(
        { success: false, error: 'Housing request ID is required' },
        { status: 400 }
      );
    }

    // Get OAuth access token
    const clientId = process.env.SIGNNOW_CLIENT_ID;
    const clientSecret = process.env.SIGNNOW_SECRET_KEY;
    const apiKey = process.env.SIGNNOW_API_KEY;

    let accessToken;
    try {
      const authResponse = await fetch('https://api.signnow.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        accessToken = authData.access_token;
      } else {
        // Fallback to API key
        accessToken = apiKey;
      }
    } catch (authError) {
      accessToken = apiKey;
    }

    if (!accessToken) {
      console.error('No valid authentication token available');
      return NextResponse.json(
        { success: false, error: 'SignNow authentication not configured' },
        { status: 500 }
      );
    }

    // Get housing request details for document naming
    const housingRequest = await getHousingRequestById(housingRequestId);
    const userName = housingRequest.user.firstName && housingRequest.user.lastName 
      ? `${housingRequest.user.firstName} ${housingRequest.user.lastName}`
      : housingRequest.user.email;
    const listingTitle = housingRequest.listing.title;

    let documentId: string;

    if (leaseFile) {
      // Step 1: Upload the file to SignNow
      const uploadFormData = new FormData();
      uploadFormData.append('file', leaseFile);

      const uploadResponse = await fetch('https://api.signnow.com/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('SignNow upload error:', errorText);
        return NextResponse.json(
          { success: false, error: 'Failed to upload document to SignNow' },
          { status: 500 }
        );
      }

      const uploadData = await uploadResponse.json();
      documentId = uploadData.id;

      // Note: Fields can be added to the document later through SignNow's interface
      // or by using pre-configured templates. For now, we'll just upload the document
      // and let the host configure fields through SignNow's UI.
      
      console.log(`Document uploaded successfully with ID: ${documentId}`);

    } else {
      // Create a document from a template (if no file uploaded)
      const createDocumentResponse = await fetch('https://api.signnow.com/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_name: `Lease Agreement - ${userName} - ${listingTitle}`,
          template_id: process.env.SIGNNOW_LEASE_TEMPLATE_ID || '', // You can set a default template ID
        }),
      });

      if (!createDocumentResponse.ok) {
        const errorText = await createDocumentResponse.text();
        console.error('SignNow API error:', errorText);
        return NextResponse.json(
          { success: false, error: 'Failed to create document with SignNow' },
          { status: 500 }
        );
      }

      const documentData = await createDocumentResponse.json();
      documentId = documentData.id;
    }

    // Save the document ID to the housing request
    const updateResult = await updateHousingRequest(housingRequestId, {
      leaseDocumentId: documentId,
    });

    if (!updateResult.success) {
      console.error('Failed to update housing request:', updateResult.error);
    }

    // Also save to match if it exists
    try {
      const matchResult = await getMatch(housingRequestId);
      if (matchResult.success && matchResult.match) {
        await updateMatch(matchResult.match.id, {
          leaseDocumentId: documentId,
        });
      }
    } catch (error) {
      console.error('Error updating match with lease document ID:', error);
      // Don't fail the whole operation if match update fails
    }

    // Generate SignNow document URL for editing/sending
    const documentUrl = `https://app.signnow.com/editor/${documentId}`;

    return NextResponse.json({
      success: true,
      documentId: documentId,
      documentUrl: documentUrl,
      message: 'Document created successfully. You can now add signature fields and send it for signing.',
    });

  } catch (error) {
    console.error('Error in create-document API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}