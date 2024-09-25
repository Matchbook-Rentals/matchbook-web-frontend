import { NextRequest, NextResponse } from 'next/server';

const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;
//const BOLDSIGN_API_URL = 'https://api.boldsign.com/v1/template/createEmbeddedTemplateUrl';
const BOLDSIGN_API_BASE_URL = 'https://api.boldsign.com/v1';

export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const response = await fetch(`${BOLDSIGN_API_BASE_URL}/template/properties?templateId=${templateId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-KEY': BOLDSIGN_API_KEY!
      }
    });

    if (!response.ok) {
      throw new Error(`BoldSign API responded with status: ${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response from BoldSign API', responseText: text },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching template properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template properties', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(BOLDSIGN_API_BASE_URL + '/template/createEmbeddedTemplateUrl', {
      method: 'POST',
      headers: {
        'X-API-KEY': BOLDSIGN_API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`BoldSign API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("BoldSign API response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
