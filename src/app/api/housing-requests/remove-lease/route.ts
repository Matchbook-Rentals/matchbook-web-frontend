import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function DELETE(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { housingRequestId, boldSignLeaseId } = body;

    if (!housingRequestId) {
      return NextResponse.json({ error: 'Housing request ID is required' }, { status: 400 });
    }

    // Verify the housing request belongs to the current user's listing
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId },
      include: {
        listing: true,
        boldSignLease: {
          include: {
            match: true
          }
        }
      }
    });

    if (!housingRequest) {
      return NextResponse.json({ error: 'Housing request not found' }, { status: 404 });
    }

    if (housingRequest.listing.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not your listing' }, { status: 403 });
    }

    // If there's a BoldSign lease, clean up related records
    if (housingRequest.boldSignLease) {
      const leaseId = housingRequest.boldSignLease.id;
      const matchId = housingRequest.boldSignLease.matchId;

      // TODO: Cancel the BoldSign document via API if needed
      // const API_BASE_URL = 'https://api.boldsign.com';
      // const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;
      // You might want to call BoldSign API to cancel/delete the document

      // Delete the BoldSignLease record (this will cascade due to foreign key)
      await prisma.boldSignLease.delete({
        where: { id: leaseId }
      });

      // Delete the associated Match record
      if (matchId) {
        try {
          await prisma.match.delete({
            where: { id: matchId }
          });
        } catch (error) {
          console.warn('Failed to delete match:', error);
          // Continue even if match deletion fails
        }
      }
    }

    // Update the housing request to remove the boldSignLeaseId
    await prisma.housingRequest.update({
      where: { id: housingRequestId },
      data: { boldSignLeaseId: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing lease:', error);
    return NextResponse.json({ 
      error: 'Failed to remove lease', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}