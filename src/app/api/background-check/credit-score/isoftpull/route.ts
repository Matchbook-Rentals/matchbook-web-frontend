import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb'
import { headers } from 'next/headers';

const ISOFTPULL_API_URL = 'https://app.isoftpull.com/api/v2/reports';
// FORCED MOCK MODE - Always use mock responses for iSoftPull credit checks
// Set to false to use real API
const MOCK_MODE = true;

export async function POST(request: Request) {
  try {
    // Get the auth session
    const { userId } = auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting iSoftPull credit score check...');
    console.log('🔧 MOCK_MODE value:', MOCK_MODE);
    if (MOCK_MODE) {
      console.log('🎭 MOCK MODE: Using mock credit check response');
    } else {
      console.log('⚠️ REAL MODE: Will call real iSoftPull API');
    }

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

    // Mock response for development/testing
    if (MOCK_MODE) {
      console.log('✅ Returning mock credit data (passed)');
      const creditData = {
        intelligence: {
          result: 'passed',
          name: 'good',
          score: 720,
        },
        firstName: body.first_name,
        lastName: body.last_name,
      };

      // Still update the database
      try {
        const creditReport = await prisma.creditReport.upsert({
          where: {
            userId: userId
          },
          update: {
            creditBucket: creditData.intelligence.name,
            creditUpdatedAt: new Date(),
          },
          create: {
            userId: userId,
            creditBucket: creditData.intelligence.name,
            creditUpdatedAt: new Date(),
          },
        });
        console.log('Successfully created/updated mock credit report', creditReport.creditBucket);
      } catch (dbError) {
        console.error('Database update error:', dbError);
        return NextResponse.json(
          { error: 'Failed to update credit report', details: dbError },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Credit check completed (MOCK MODE)',
        creditData,
      });
    }

    // Real API call
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

    const creditData = await response.json();
    console.log('Successfully received iSoftPull API response');
    console.log('ISOFTPULL DATA:', creditData);



    if (creditData.intelligence.result === 'passed') {
      try {
        const creditReport = await prisma.creditReport.upsert({
          where: {
            userId: userId
          },
          update: {
            creditBucket: creditData.intelligence.name,
            creditUpdatedAt: new Date(),
          },
          create: {
            userId: userId,
            creditBucket: creditData.intelligence.name,
            creditUpdatedAt: new Date(),
          },
        });
        console.log('Successfully created/updated credit report', creditReport.creditBucket);
      } catch (dbError) {
        console.error('Database update error:', dbError);
        return NextResponse.json(
          { error: 'Failed to update credit report', details: dbError },
          { status: 500 }
        );
      }
    }


    return NextResponse.json({
      message: 'Credit check completed and user record updated',
      creditData,
    });
  } catch (error) {
    console.error('iSoftPull API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
