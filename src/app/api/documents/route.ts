import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { nanoid } from 'nanoid';

// POST /api/documents - Create document from template
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, documentData, status, currentStep } = body;

    if (!templateId || !documentData) {
      return NextResponse.json({ error: 'Template ID and document data are required' }, { status: 400 });
    }

    // Get the template to copy PDF file info
    const template = await prisma.pdfTemplate.findUnique({
      where: { 
        id: templateId,
        userId // Ensure user owns the template
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create document instance
    const document = await prisma.documentInstance.create({
      data: {
        templateId,
        userId,
        status: status || 'DRAFT', // Allow status to be set at creation
        currentStep: currentStep || 'document', // Allow currentStep to be set at creation
        documentData,
        // Copy PDF file info from template
        pdfFileUrl: template.pdfFileUrl,
        pdfFileName: template.pdfFileName,
        pdfFileKey: template.pdfFileKey,
      }
    });

    return NextResponse.json({ document }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

// GET /api/documents - List user's documents
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.documentInstance.findMany({
      where: { userId },
      include: {
        template: true,
        signingSessions: true,
        fieldValues: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documents });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}