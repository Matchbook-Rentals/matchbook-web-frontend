import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { nanoid } from 'nanoid';

// POST /api/documents/merged - Create document from multiple templates
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateIds, documentData, status, currentStep, pdfFileUrl, pdfFileName, pdfFileKey, title } = body;

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return NextResponse.json({ error: 'Template IDs are required' }, { status: 400 });
    }

    if (!documentData) {
      return NextResponse.json({ error: 'Document data is required' }, { status: 400 });
    }

    // Verify all templates exist and belong to the user
    const templates = await prisma.pdfTemplate.findMany({
      where: { 
        id: { in: templateIds },
        userId // Ensure user owns all templates
      }
    });

    if (templates.length !== templateIds.length) {
      return NextResponse.json({ error: 'One or more templates not found' }, { status: 404 });
    }

    // Create document instance for merged templates
    const document = await prisma.documentInstance.create({
      data: {
        // Use the first template as the primary template (for compatibility)
        templateId: templateIds[0],
        userId,
        status: status || 'DRAFT',
        currentStep: currentStep || 'document',
        documentData: {
          ...documentData,
          // Add metadata about merged templates
          mergedTemplates: templateIds,
          templateTitles: templates.map(t => t.title)
        },
        // Use provided PDF file info (from merged PDF)
        pdfFileUrl: pdfFileUrl || templates[0].pdfFileUrl,
        pdfFileName: pdfFileName || `merged_lease_package_${templates.length}_documents.pdf`,
        pdfFileKey: pdfFileKey || templates[0].pdfFileKey,
      }
    });

    return NextResponse.json({ document }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating merged document:', error);
    return NextResponse.json(
      { error: 'Failed to create merged document' },
      { status: 500 }
    );
  }
}