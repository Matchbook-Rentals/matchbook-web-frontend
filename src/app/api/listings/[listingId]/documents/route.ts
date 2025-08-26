import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = params.listingId;

    // Get all PdfTemplates for this listing
    const templates = await prisma.pdfTemplate.findMany({
      where: { listingId: listingId },
      orderBy: { createdAt: 'desc' }
    });

    // Get all DocumentInstances created from templates for this listing
    const documents = await prisma.documentInstance.findMany({
      where: {
        template: {
          listingId: listingId
        }
      },
      include: {
        template: true,
        signingSessions: true,
        fieldValues: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      templates, 
      documents,
      summary: {
        totalTemplates: templates.length,
        totalDocuments: documents.length,
        documentsAwaitingSignature: documents.filter(d => d.currentStep !== 'completed').length,
        documentsCompleted: documents.filter(d => d.currentStep === 'completed').length
      }
    });
    
  } catch (error) {
    console.error('Error fetching listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}