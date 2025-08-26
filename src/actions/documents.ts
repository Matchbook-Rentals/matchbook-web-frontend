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
  housingRequestId?: string; // Add housing request ID to link to match
}

export async function createMergedDocument(data: CreateMergedDocumentData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const { templateIds, documentData, status = 'DRAFT', currentStep = 'document', pdfFileName, housingRequestId } = data;

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

    // If housingRequestId is provided, link the document to both housing request and any existing match
    if (housingRequestId) {
      try {
        console.log(`🔍 Attempting to link document ${document.id} to housing request ${housingRequestId}`);
        
        // First, update the housing request with the document ID
        const updatedHousingRequest = await prisma.housingRequest.update({
          where: { id: housingRequestId },
          data: { leaseDocumentId: document.id },
          include: {
            trip: true,
            listing: true
          }
        });

        console.log('✅ Linked document to housing request:', {
          housingRequestId: updatedHousingRequest.id,
          leaseDocumentId: updatedHousingRequest.leaseDocumentId,
          status: updatedHousingRequest.status
        });

        // Then, try to find and update any existing match (fallback for when match already exists)
        const match = await prisma.match.findFirst({
          where: {
            tripId: updatedHousingRequest.tripId,
            listingId: updatedHousingRequest.listingId
          }
        });

        if (match) {
          const updatedMatch = await prisma.match.update({
            where: { id: match.id },
            data: { leaseDocumentId: document.id }
          });

          console.log(`✅ Also linked document ${document.id} to existing match ${match.id}`, {
            previousLeaseDocumentId: match.leaseDocumentId,
            newLeaseDocumentId: updatedMatch.leaseDocumentId
          });
        } else {
          console.log(`🔍 No existing match found - document will be linked when match is created during approval`);
        }
      } catch (error) {
        console.error('Error linking document:', error);
        // Don't fail the whole operation if linking fails
      }
    } else {
      console.log('🔍 No housingRequestId provided - skipping match linking');
    }

    return { success: true, document };
    
  } catch (error) {
    console.error('Error creating merged document:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create merged document' 
    };
  }
}