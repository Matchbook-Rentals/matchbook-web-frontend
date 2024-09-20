import { NextRequest, NextResponse } from 'next/server';

const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;
const BOLDSIGN_API_URL = 'https://api.boldsign.com/v1/template/createEmbeddedTemplateUrl';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(BOLDSIGN_API_URL, {
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
