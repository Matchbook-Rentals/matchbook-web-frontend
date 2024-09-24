import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.boldsign.com';
const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;

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
