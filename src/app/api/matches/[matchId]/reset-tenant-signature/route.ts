import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// POST /api/matches/[matchId]/reset-tenant-signature - Reset tenant signature for debugging
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 });
    }

    const matchId = params.matchId;

    // Find the match and verify user has access (either as tenant or host)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: true,
        listing: true
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is either the tenant (trip owner) or host (listing owner)
    if (match.trip.userId !== userId && match.listing.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Reset tenant signature timestamp
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        tenantSignedAt: null
      }
    });

    console.log(`🔄 DEBUG: Reset tenant signature for match ${matchId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Tenant signature reset successfully',
      match: updatedMatch
    });
    
  } catch (error) {
    console.error('Error resetting tenant signature:', error);
    return NextResponse.json(
      { error: 'Failed to reset tenant signature' },
      { status: 500 }
    );
  }
}