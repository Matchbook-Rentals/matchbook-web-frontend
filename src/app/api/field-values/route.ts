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

    // Verify user has access to the document (either owns it or is a recipient)
    const document = await prisma.documentInstance.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user owns the document
    if (document.userId === userId) {
      // User owns the document, allow access
    } else {
      // Check if user is a recipient
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!user?.email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 404 });
      }

      // Check if user's email is in the recipients array
      const documentData = document.documentData as any;
      const recipients = documentData?.recipients || [];
      const isRecipient = recipients.some((r: any) => r.email === user.email);

      if (!isRecipient) {
        return NextResponse.json({ error: 'Access denied - not a document owner or recipient' }, { status: 403 });
      }
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