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

    const { documentId } = await request.json();
    const matchId = params.matchId;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Verify the match exists and user has access (as host)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: {
          include: { user: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.listing.user?.id !== userId) {
      return NextResponse.json({ error: 'Only the host can link documents' }, { status: 403 });
    }

    // Verify the document exists and belongs to this listing
    const document = await prisma.documentInstance.findUnique({
      where: { id: documentId },
      include: { template: true }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.template.listingId !== match.listingId) {
      return NextResponse.json({ error: 'Document does not belong to this listing' }, { status: 400 });
    }

    // Update the match with the document ID
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { leaseDocumentId: documentId }
    });

    return NextResponse.json({ 
      success: true, 
      match: {
        id: updatedMatch.id,
        leaseDocumentId: updatedMatch.leaseDocumentId
      }
    });
    
  } catch (error) {
    console.error('Error linking document to match:', error);
    return NextResponse.json(
      { error: 'Failed to link document' },
      { status: 500 }
    );
  }
}