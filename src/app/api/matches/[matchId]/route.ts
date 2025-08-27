import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the match with all related data
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        listing: {
          include: { 
            user: true,
            listingImages: true,
            bedrooms: true
          }
        },
        trip: {
          include: { user: true }
        },
        BoldSignLease: true,
        booking: true
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is involved in this match (either renter or host)
    const isRenter = match.trip.userId === userId;
    const isHost = match.listing.userId === userId;
    
    if (!isRenter && !isHost) {
      return NextResponse.json({ error: 'Unauthorized - not involved in this match' }, { status: 403 });
    }

    return NextResponse.json(match);

  } catch (error) {
    console.error('❌ Error fetching match:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch match',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}