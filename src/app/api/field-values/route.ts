import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// POST /api/field-values - Save signed field value
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, fieldId, fieldType, signerIndex, signerEmail, value } = body;

    if (!documentId || !fieldId || !fieldType || signerIndex === undefined || !signerEmail || value === undefined) {
      return NextResponse.json({ 
        error: 'All field data is required' 
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

    // Create or update field value (upsert)
    const fieldValue = await prisma.fieldValue.upsert({
      where: {
        documentId_fieldId: {
          documentId,
          fieldId
        }
      },
      update: {
        value,
        signedAt: new Date()
      },
      create: {
        documentId,
        fieldId,
        fieldType,
        signerIndex,
        signerEmail,
        value
      }
    });

    return NextResponse.json({ fieldValue }, { status: 201 });
    
  } catch (error) {
    console.error('Error saving field value:', error);
    return NextResponse.json(
      { error: 'Failed to save field value' },
      { status: 500 }
    );
  }
}