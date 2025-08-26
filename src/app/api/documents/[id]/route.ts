import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// GET /api/documents/[id] - Get specific document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the document first without user restriction
    const document = await prisma.documentInstance.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        signingSessions: true,
        fieldValues: true,
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user owns the document
    if (document.userId === userId) {
      return NextResponse.json({ document });
    }

    // If user doesn't own it, check if they're a recipient
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ document });
    
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update document
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentData, status, currentStep, completedAt } = body;

    console.log('🔍 PATCH /api/documents/[id] - attempting to update document:', {
      documentId: params.id,
      userId,
      requestBody: { status, currentStep, hasDocumentData: !!documentData }
    });

    // First check if document exists and user has access
    const existingDocument = await prisma.documentInstance.findUnique({
      where: { id: params.id }
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access (owner or recipient)
    let hasAccess = existingDocument.userId === userId;
    
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (user?.email) {
        const documentData = existingDocument.documentData as any;
        const recipients = documentData?.recipients || [];
        hasAccess = recipients.some((r: any) => r.email === user.email);
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    if (documentData) updateData.documentData = documentData;
    if (status) updateData.status = status;
    if (currentStep) updateData.currentStep = currentStep;
    if (completedAt) updateData.completedAt = new Date(completedAt);

    const document = await prisma.documentInstance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        template: true,
        signingSessions: true,
        fieldValues: true,
      }
    });

    return NextResponse.json({ document });
    
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.documentInstance.delete({
      where: { 
        id: params.id,
        userId // Ensure user owns the document
      }
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}