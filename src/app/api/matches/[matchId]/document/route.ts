import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchId = params.matchId;

    // Get the match and verify user access
    const match = await prisma.match.findUnique({
      where: { id: matchId },
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

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if user has access (either tenant or host)
    const isTenant = match.trip.user?.id === userId;
    const isHost = match.listing.user?.id === userId;

    if (!isTenant && !isHost) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the document if it exists
    if (!match.leaseDocumentId) {
      return NextResponse.json({ error: 'No lease document found for this match' }, { status: 404 });
    }

    const document = await prisma.documentInstance.findUnique({
      where: { id: match.leaseDocumentId },
      include: {
        template: true,
        signingSessions: true,
        fieldValues: true,
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
    
  } catch (error) {
    console.error('Error fetching match document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}