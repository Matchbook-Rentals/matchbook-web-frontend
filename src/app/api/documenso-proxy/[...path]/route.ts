import { NextRequest, NextResponse } from 'next/server';

const DOCUMENSO_BASE_URL = process.env.DOCUMENSO_API_URL || 'http://localhost:3000';
const DOCUMENSO_API_KEY = process.env.DOCUMENSO_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/');
    const url = `${DOCUMENSO_BASE_URL}/api/${path}`;
    
    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const queryString = searchParams.toString();
    const finalUrl = queryString ? `${url}?${queryString}` : url;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key from environment or request
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (DOCUMENSO_API_KEY) {
      headers['Authorization'] = `Bearer ${DOCUMENSO_API_KEY}`;
    }

    // Prepare request body for non-GET requests
    let body: string | FormData | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('multipart/form-data')) {
        // Handle file uploads
        body = await request.formData();
        // Remove content-type header to let fetch set it with boundary
        delete headers['Content-Type'];
      } else {
        const requestBody = await request.text();
        if (requestBody) {
          body = requestBody;
        }
      }
    }

    // Make the request to Documenso
    const response = await fetch(finalUrl, {
      method,
      headers,
      body,
    });

    // Get response data
    const data = await response.text();
    
    // Return response with CORS headers
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error: any) {
    console.error('Documenso proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', message: error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}