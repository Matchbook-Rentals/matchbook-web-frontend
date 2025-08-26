import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchId = params.matchId;

    // Update match record with tenant signature timestamp
    const match = await prisma.match.update({
      where: { 
        id: matchId,
        trip: {
          userId: userId // Ensure the user owns this match through their trip
        }
      },
      data: {
        tenantSignedAt: new Date()
      },
      include: {
        trip: {
          include: {
            user: true
          }
        },
        listing: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`✅ Match ${matchId} updated - tenant signed at ${match.tenantSignedAt}`);

    return NextResponse.json({ 
      success: true, 
      match: {
        id: match.id,
        tenantSignedAt: match.tenantSignedAt,
        landlordSignedAt: match.landlordSignedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating match with tenant signature:', error);
    return NextResponse.json(
      { error: 'Failed to update match record' },
      { status: 500 }
    );
  }
}