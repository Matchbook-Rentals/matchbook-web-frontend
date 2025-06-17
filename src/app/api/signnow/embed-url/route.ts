import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // First, let's get an OAuth access token
    const clientId = process.env.SIGNNOW_CLIENT_ID;
    const clientSecret = process.env.SIGNNOW_SECRET_KEY;
    const apiKey = process.env.SIGNNOW_API_KEY;

    if (!clientId || !clientSecret) {
      console.error('SIGNNOW_CLIENT_ID or SIGNNOW_SECRET_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'SignNow OAuth credentials not configured' },
        { status: 500 }
      );
    }

    // Get OAuth access token
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
        console.log('Successfully obtained OAuth access token');
      } else {
        const authError = await authResponse.text();
        console.error('OAuth token request failed:', authError);
        // Fallback to API key
        accessToken = apiKey;
      }
    } catch (authError) {
      console.error('OAuth error, falling back to API key:', authError);
      accessToken = apiKey;
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'No valid authentication token available' },
        { status: 500 }
      );
    }

    // First, let's check if the document exists and get its details
    const documentResponse = await fetch(`https://api.signnow.com/document/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!documentResponse.ok) {
      const errorText = await documentResponse.text();
      console.error('SignNow document fetch error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    const documentData = await documentResponse.json();

    // Try to create an embedded editor link using SignNow v2 API
    let embedUrl = null;
    try {
      const embedResponse = await fetch(`https://api.signnow.com/v2/documents/${documentId}/embedded-editor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/platform/host`,
          link_expiration: 45, // 45 minutes (maximum allowed)
          redirect_target: "self" // Open redirect in same tab
        }),
      });

      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        // The response structure is { data: { url: "..." } }
        embedUrl = embedData.data?.url;
        console.log('Successfully created embedded editor URL:', embedUrl);
      } else {
        let errorData;
        try {
          errorData = await embedResponse.json();
        } catch {
          errorData = await embedResponse.text();
        }
        console.log('Embedded editor creation failed:', errorData);
        console.log('Response status:', embedResponse.status);
        console.log('Request body was:', JSON.stringify({
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/platform/host`,
          link_expiration: 60,
          redirect_target: "self"
        }));
      }
    } catch (embedError) {
      console.log('Embed URL creation failed:', embedError);
    }

    // Fallback to direct SignNow URLs
    const directUrls = {
      editor: `https://app.signnow.com/editor/${documentId}`,
      viewer: `https://app.signnow.com/document/${documentId}`,
    };

    return NextResponse.json({
      success: true,
      documentId: documentId,
      documentData: {
        id: documentData.id,
        document_name: documentData.document_name,
        page_count: documentData.page_count,
        created: documentData.created,
      },
      urls: {
        embed: embedUrl,
        editor: directUrls.editor,
        viewer: directUrls.viewer,
      },
      debug: {
        embedAttempted: true,
        embedSuccess: !!embedUrl,
        authMethod: accessToken === apiKey ? 'api_key' : 'oauth_token',
        hasOAuthCreds: !!(clientId && clientSecret),
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      }
    });

  } catch (error) {
    console.error('Error in embed-url API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}