import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb'
import { headers } from 'next/headers';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const ISOFTPULL_API_URL = 'https://app.isoftpull.com/api/v2/reports';
// FORCED MOCK MODE - Always use mock responses for iSoftPull credit checks
// Set to false to use real API
const MOCK_MODE = true;

export async function POST(request: Request) {
  try {
    // Get the auth session
    const { userId: authUserId } = auth();

    // Check for internal request from verification submit route
    const headersList = headers();
    const isInternalRequest = headersList.get("x-internal-request") === "true";
    const internalUserId = headersList.get("x-user-id");

    // Use auth userId or internal userId
    const userId = authUserId || (isInternalRequest ? internalUserId : null);

    // Check if user is authenticated
    if (!userId) {
      console.log('❌ [iSoftPull] Unauthorized - no userId found');
      console.log('  authUserId:', authUserId);
      console.log('  isInternalRequest:', isInternalRequest);
      console.log('  internalUserId:', internalUserId);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`✅ [iSoftPull] Authenticated user: ${userId} (internal: ${isInternalRequest})`);

    console.log('\n' + '='.repeat(60));
    console.log('🚀 iSOFTPULL CREDIT CHECK STARTED');
    console.log('='.repeat(60));
    console.log('🔧 MOCK_MODE:', MOCK_MODE);
    if (MOCK_MODE) {
      console.log('🎭 MODE: MOCK - Using fake credit check response');
    } else {
      console.log('🔥 MODE: REAL - Calling real iSoftPull API!');
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
    console.log('\n' + '='.repeat(60));
    console.log('✅ iSOFTPULL RESPONSE RECEIVED');
    console.log('='.repeat(60));
    console.log('FULL RESPONSE:', JSON.stringify(creditData, null, 2));
    console.log('='.repeat(60) + '\n');

    // Save full response to file for creating TypeScript interface
    try {
      const filePath = join(process.cwd(), 'isoftpull-response.json');
      await writeFile(filePath, JSON.stringify(creditData, null, 2));
      console.log(`📁 Response saved to: ${filePath}`);
    } catch (fileError) {
      console.error('❌ Failed to save iSoftPull response to file:', fileError);
    }



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
