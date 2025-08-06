import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// POST /api/signing-sessions/complete - Mark signing session as completed
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, signerIndex } = body;

    if (!documentId || signerIndex === undefined) {
      return NextResponse.json({ 
        error: 'Document ID and signer index are required' 
      }, { status: 400 });
    }

    // Verify user owns the document
    const document = await prisma.documentInstance.findUnique({
      where: { 
        id: documentId,
        userId
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update signing session status
    const signingSession = await prisma.signingSession.updateMany({
      where: {
        documentId,
        signerIndex
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, signingSession });
    
  } catch (error) {
    console.error('Error completing signing session:', error);
    return NextResponse.json(
      { error: 'Failed to complete signing session' },
      { status: 500 }
    );
  }
}