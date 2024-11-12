import { NextResponse } from 'next/server';

const ISOFTPULL_API_URL = 'https://app.isoftpull.com/api/v2/reports';

export async function POST(request: Request) {
  try {
    console.log('Starting iSoftPull credit score check...');

    // Get the request body
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'address', 'city', 'state', 'zip', 'ssn'];
    console.log('Validating required fields...');
    for (const field of requiredFields) {
      if (!body[field]) {
        console.warn(`Validation failed: Missing required field '${field}'`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    console.log('All required fields validated successfully');

    // Create form data
    const formData = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    console.log('Form data prepared for iSoftPull API');

    // Make request to iSoftPull API
    console.log('Making request to iSoftPull API...');
    const response = await fetch(ISOFTPULL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'api-key': process.env.ISOFTPULL_API_ID!,
        'api-secret': process.env.ISOFTPULL_API_TOKEN!,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('iSoftPull API error response:', errorData);
      return NextResponse.json(
        { error: 'iSoftPull API error', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully received iSoftPull API response');
    console.log('ISOFTPULL DATA:', data)
    return NextResponse.json(data);

  } catch (error) {
    console.error('iSoftPull API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
