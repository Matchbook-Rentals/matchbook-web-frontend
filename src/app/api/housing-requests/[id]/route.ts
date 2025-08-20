import { NextRequest, NextResponse } from 'next/server';
import { getHousingRequestById } from '@/app/actions/housing-requests';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const housingRequestId = params.id;
    
    if (!housingRequestId) {
      return NextResponse.json(
        { error: 'Housing request ID is required' },
        { status: 400 }
      );
    }

    // Use the existing server action to get housing request data
    const housingRequest = await getHousingRequestById(housingRequestId);
    
    if (!housingRequest) {
      return NextResponse.json(
        { error: 'Housing request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(housingRequest);
  } catch (error) {
    console.error('Error fetching housing request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch housing request' },
      { status: 500 }
    );
  }
}