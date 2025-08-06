import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { nanoid } from 'nanoid';

// POST /api/signing-sessions - Create signing session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, signerIndex, signerEmail, signerName } = body;

    if (!documentId || signerIndex === undefined || !signerEmail || !signerName) {
      return NextResponse.json({ 
        error: 'Document ID, signer index, email, and name are required' 
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

    // Create signing session with unique access token
    const signingSession = await prisma.signingSession.create({
      data: {
        documentId,
        signerIndex,
        signerEmail,
        signerName,
        accessToken: nanoid(32), // Unique token for accessing this session
        status: 'PENDING'
      }
    });

    return NextResponse.json({ signingSession }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating signing session:', error);
    return NextResponse.json(
      { error: 'Failed to create signing session' },
      { status: 500 }
    );
  }
}