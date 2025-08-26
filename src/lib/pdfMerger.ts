import { PDFDocument } from 'pdf-lib';
import { PdfTemplate } from '@prisma/client';
import type { FieldFormType } from '@/components/pdf-editor/types';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';

export interface MergedPDFResult {
  file: File;
  fields: FieldFormType[];
  recipients: Recipient[];
  pageCount: number;
  templateCount: number;
}

export interface TemplateMergeOptions {
  fileName?: string;
  includeMetadata?: boolean;
}

/**
 * Merges multiple PDF templates into a single PDF file with combined fields
 */
export async function mergePDFTemplates(
  templates: PdfTemplate[],
  options: TemplateMergeOptions = {}
): Promise<MergedPDFResult> {
  if (templates.length === 0) {
    throw new Error('No templates provided for merging');
  }

  // If only one template, convert it to the expected format without merging
  if (templates.length === 1) {
    const template = templates[0];
    const templateData = template.templateData as any;
    
    const pdfResponse = await fetch(template.pdfFileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${template.pdfFileUrl}`);
    }
    
    const pdfBytes = await pdfResponse.arrayBuffer();
    const file = new File([pdfBytes], options.fileName || `${template.title}.pdf`, {
      type: 'application/pdf'
    });

    // Get page count
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    return {
      file,
      fields: convertTemplateFields(templateData?.fields || [], 0),
      recipients: convertTemplateRecipients(templateData?.recipients || []),
      pageCount,
      templateCount: 1
    };
  }

  // Multiple templates - merge them
  const mergedPdf = await PDFDocument.create();
  const mergedFields: FieldFormType[] = [];
  const mergedRecipients: Recipient[] = [];
  let currentPageOffset = 0;

  // Sort templates: leases first, then addendums in selection order
  const sortedTemplates = [...templates].sort((a, b) => {
    const aIsLease = a.title.toLowerCase().includes('lease');
    const bIsLease = b.title.toLowerCase().includes('lease');
    
    if (aIsLease && !bIsLease) return -1;
    if (!aIsLease && bIsLease) return 1;
    
    // If both are leases or both are addendums, maintain selection order
    return templates.indexOf(a) - templates.indexOf(b);
  });

  // Process each template in sorted order
  for (let templateIndex = 0; templateIndex < sortedTemplates.length; templateIndex++) {
    const template = sortedTemplates[templateIndex];
    const templateData = template.templateData as any;

    try {
      // Fetch PDF bytes
      const response = await fetch(template.pdfFileUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch PDF for template ${template.title}: ${response.status}`);
        continue;
      }

      const pdfBytes = await response.arrayBuffer();
      const sourcePdf = await PDFDocument.load(pdfBytes);

      // Copy all pages from this PDF
      const pageIndices = sourcePdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

      // Add pages to merged document
      copiedPages.forEach(page => {
        mergedPdf.addPage(page);
      });

      // Convert and adjust fields for this template
      const templateFields = convertTemplateFields(
        templateData?.fields || [], 
        currentPageOffset
      );
      
      console.log(`Template "${template.title}":`, {
        rawFields: templateData?.fields?.length || 0,
        convertedFields: templateFields.length,
        pageOffset: currentPageOffset,
        templateFields: templateFields.map(f => ({
          formId: f.formId,
          type: f.type,
          pageNumber: f.pageNumber,
          position: `(${f.pageX}, ${f.pageY})`,
          size: `${f.pageWidth}x${f.pageHeight}`,
          signerEmail: f.signerEmail
        }))
      });
      
      mergedFields.push(...templateFields);

      // Merge recipients (avoid duplicates)
      const templateRecipients = convertTemplateRecipients(templateData?.recipients || []);
      templateRecipients.forEach(recipient => {
        const existingRecipient = mergedRecipients.find(r => r.email === recipient.email);
        if (!existingRecipient) {
          mergedRecipients.push(recipient);
        }
      });

      // Update page offset for next template
      currentPageOffset += pageIndices.length;

    } catch (error) {
      console.error(`Error processing template ${template.title}:`, error);
      throw new Error(`Failed to process template: ${template.title}`);
    }
  }

  // Generate merged PDF bytes
  const mergedPdfBytes = await mergedPdf.save();
  
  // Create File object
  const fileName = options.fileName || `merged_lease_package_${templates.length}_documents.pdf`;
  const file = new File([mergedPdfBytes], fileName, {
    type: 'application/pdf'
  });

  const totalPageCount = mergedPdf.getPageCount();

  console.log('Final merge result:', {
    totalFields: mergedFields.length,
    totalRecipients: mergedRecipients.length,
    totalPages: totalPageCount,
    templateCount: templates.length,
    fields: mergedFields.map(f => ({
      formId: f.formId,
      type: f.type,
      pageNumber: f.pageNumber,
      signerEmail: f.signerEmail
    }))
  });

  return {
    file,
    fields: mergedFields,
    recipients: mergedRecipients,
    pageCount: totalPageCount,
    templateCount: templates.length
  };
}

/**
 * Converts template field data to FieldFormType format with page offset
 */
function convertTemplateFields(templateFields: any[], pageOffset: number): FieldFormType[] {
  return templateFields.map((field: any, index: number) => ({
    nativeId: field.nativeId || index,
    formId: field.id || field.formId || `field_${index}_${Date.now()}`,
    pageNumber: (field.page || field.pageNumber || 1) + pageOffset,
    type: field.type || 'TEXT',
    pageX: field.x || field.pageX || 0,
    pageY: field.y || field.pageY || 0,
    pageWidth: field.width || field.pageWidth || 100,
    pageHeight: field.height || field.pageHeight || 20,
    signerEmail: field.recipientId || field.signerEmail || '',
    fieldMeta: {
      label: field.label || field.name || 'Field',
      placeholder: field.placeholder || '',
      required: field.required || false,
      readOnly: field.readOnly || false,
      ...field.fieldMeta
    },
    recipientIndex: field.recipientIndex || 0
  }));
}

/**
 * Converts template recipient data to Recipient format
 */
function convertTemplateRecipients(templateRecipients: any[]): Recipient[] {
  return templateRecipients.map((recipient: any, index: number) => ({
    id: recipient.id || `recipient_${index}`,
    name: recipient.name || recipient.title || `Recipient ${index + 1}`,
    email: recipient.email || '',
    role: mapRecipientRole(recipient.role || recipient.type),
    color: recipient.color || generateRecipientColor(index),
    title: recipient.title || (index === 0 ? 'Host' : index === 1 ? 'Primary Renter' : `Recipient ${index + 1}`)
  }));
}

/**
 * Maps template recipient role to PDF editor role
 */
function mapRecipientRole(role: string): 'signer' | 'viewer' | 'approver' {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes('signer') || normalizedRole.includes('renter') || normalizedRole.includes('host')) {
    return 'signer';
  }
  if (normalizedRole.includes('viewer')) {
    return 'viewer';
  }
  if (normalizedRole.includes('approver')) {
    return 'approver';
  }
  return 'signer'; // Default to signer
}

/**
 * Generates a color for recipients
 */
function generateRecipientColor(index: number): string {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red  
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#F97316'  // Orange
  ];
  return colors[index % colors.length];
}

/**
 * Utility function to estimate page count from a PDF URL (for progress tracking)
 */
export async function getPDFPageCount(pdfUrl: string): Promise<number> {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) return 5; // Default estimate
    
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.warn('Could not get page count, using estimate:', error);
    return 5; // Default estimate
  }
}