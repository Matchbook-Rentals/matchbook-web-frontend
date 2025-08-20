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
    console.log('🔄 [SERVER ACTION] Starting createMergedDocument...');
    console.log('📋 Input data:', {
      templateIds: data.templateIds,
      fieldsCount: data.documentData?.fields?.length || 0,
      recipientsCount: data.documentData?.recipients?.length || 0,
      status: data.status,
      currentStep: data.currentStep,
      pdfFileName: data.pdfFileName
    });

    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ [AUTH] No user ID found');
      throw new Error('Unauthorized');
    }
    console.log('✅ [AUTH] User authenticated:', userId);

    const { templateIds, documentData, status = 'DRAFT', currentStep = 'document', pdfFileName } = data;

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      console.error('❌ [VALIDATION] Invalid template IDs:', templateIds);
      throw new Error('Template IDs are required');
    }

    if (!documentData) {
      console.error('❌ [VALIDATION] No document data provided');
      throw new Error('Document data is required');
    }

    console.log('✅ [VALIDATION] Input validation passed');

    // Verify all templates exist and belong to the user
    console.log('🔍 [DB] Fetching templates from database...');
    const templates = await prisma.pdfTemplate.findMany({
      where: { 
        id: { in: templateIds },
        userId // Ensure user owns all templates
      }
    });

    console.log('📊 [DB] Templates found:', {
      requested: templateIds.length,
      found: templates.length,
      templates: templates.map(t => ({ id: t.id, title: t.title }))
    });

    if (templates.length !== templateIds.length) {
      console.error('❌ [DB] Template count mismatch:', {
        requested: templateIds,
        found: templates.map(t => t.id)
      });
      throw new Error('One or more templates not found');
    }

    console.log('✅ [DB] All templates verified and belong to user');

    // Create document instance for merged templates
    console.log('💾 [DB] Creating DocumentInstance...');
    const documentCreateData = {
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
    };

    console.log('📋 [DB] Document create data:', {
      templateId: documentCreateData.templateId,
      userId: documentCreateData.userId,
      status: documentCreateData.status,
      currentStep: documentCreateData.currentStep,
      pdfFileName: documentCreateData.pdfFileName,
      fieldsCount: documentCreateData.documentData.fields?.length || 0,
      recipientsCount: documentCreateData.documentData.recipients?.length || 0,
      mergedTemplatesCount: documentCreateData.documentData.mergedTemplates?.length || 0
    });

    const document = await prisma.documentInstance.create({
      data: documentCreateData,
      include: {
        template: true
      }
    });

    console.log('✅ [DB] DocumentInstance created successfully:', {
      documentId: document.id,
      templateId: document.templateId,
      status: document.status,
      currentStep: document.currentStep,
      pdfFileName: document.pdfFileName,
      createdAt: document.createdAt
    });

    console.log('🎉 [SUCCESS] createMergedDocument completed successfully');
    return { success: true, document };
    
  } catch (error) {
    console.error('💥 [ERROR] createMergedDocument failed:', error);
    console.error('📊 [ERROR] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create merged document' 
    };
  }
}