import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { tripId } = params;
  
  if (!tripId) {
    return new NextResponse(JSON.stringify({ error: 'Trip ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });
    
    if (!trip) {
      return new NextResponse(JSON.stringify({ error: 'Trip not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Ensure the user has permission to access this trip
    if (trip.userId !== userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized access to this trip' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch trip data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}