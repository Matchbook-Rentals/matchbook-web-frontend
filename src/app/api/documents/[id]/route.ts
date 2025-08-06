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

    const document = await prisma.documentInstance.findUnique({
      where: { 
        id: params.id,
        userId // Ensure user owns the document
      },
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

    // Build update data
    const updateData: any = {};
    if (documentData) updateData.documentData = documentData;
    if (status) updateData.status = status;
    if (currentStep) updateData.currentStep = currentStep;
    if (completedAt) updateData.completedAt = new Date(completedAt);

    const document = await prisma.documentInstance.update({
      where: { 
        id: params.id,
        userId // Ensure user owns the document
      },
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