'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export interface CreateMergedDocumentData {
  templateIds: string[];
  documentData: {
    fields: any[];
    recipients: any[];
    metadata?: any;
  };
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentStep?: string;
  pdfFileName?: string;
}

export async function createMergedDocument(data: CreateMergedDocumentData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const { templateIds, documentData, status = 'DRAFT', currentStep = 'document', pdfFileName } = data;

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      throw new Error('Template IDs are required');
    }

    if (!documentData) {
      throw new Error('Document data is required');
    }

    // Verify all templates exist and belong to the user
    const templates = await prisma.pdfTemplate.findMany({
      where: { 
        id: { in: templateIds },
        userId // Ensure user owns all templates
      }
    });

    if (templates.length !== templateIds.length) {
      throw new Error('One or more templates not found');
    }

    // Create document instance for merged templates
    const document = await prisma.documentInstance.create({
      data: {
        // Use the first template as the primary template (for compatibility)
        templateId: templateIds[0],
        userId,
        status,
        currentStep,
        documentData: {
          ...documentData,
          // Add metadata about merged templates
          mergedTemplates: templateIds,
          templateTitles: templates.map(t => t.title)
        },
        // Use the first template's PDF info as base (will be replaced with merged PDF)
        pdfFileUrl: templates[0].pdfFileUrl,
        pdfFileName: pdfFileName || `merged_lease_package_${templates.length}_documents.pdf`,
        pdfFileKey: templates[0].pdfFileKey,
      },
      include: {
        template: true
      }
    });

    return { success: true, document };
    
  } catch (error) {
    console.error('Error creating merged document:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create merged document' 
    };
  }
}