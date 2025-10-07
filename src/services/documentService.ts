import { FieldFormType } from '@/components/pdf-editor/types';
import { Recipient } from '@/components/pdf-editor/RecipientManager';

/**
 * Create document and start signing workflow
 * Extracted from PDFEditor.tsx (lines ~1172-1280)
 */
export async function saveDocumentAndStartSigning(params: {
  isMergedDocument?: boolean;
  mergedTemplateIds?: string[];
  fields: FieldFormType[];
  recipients: Recipient[];
  signedFields: Record<string, any>;
  pageWidth: number;
  sessionStorage: Storage;
  brandAlert: (message: string, type: 'success' | 'error' | 'warning', title: string) => void;
  workflowDispatch: (action: any) => void;
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const {
    isMergedDocument,
    mergedTemplateIds,
    fields,
    recipients,
    signedFields,
    pageWidth,
    sessionStorage,
    brandAlert,
    workflowDispatch
  } = params;

  try {
    console.log('🚀 Starting saveDocumentAndStartSigning workflow');

    let documentId = sessionStorage.getItem('currentDocumentId') || undefined;
    let templateId = sessionStorage.getItem('currentTemplateId') || undefined;

    // Handle merged document case
    if (isMergedDocument && mergedTemplateIds && !documentId) {
      console.log('📄 Creating new merged document from templates:', mergedTemplateIds);

      const createResponse = await fetch('/api/documents/merged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateIds: mergedTemplateIds,
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields // Include any pre-filled values
          },
          status: 'IN_PROGRESS', // Start in signing mode
          currentStep: 'signer1'
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create merged document');
      }

      const { document } = await createResponse.json();
      documentId = document.id;
      if (documentId) {
        sessionStorage.setItem('currentDocumentId', documentId);
      }

      console.log('✅ Merged document created for signing:', documentId);
    }
    // If no document exists yet, create one from the current template
    else if (!documentId && templateId) {
      console.log('📄 No document exists, creating new document from template:', templateId);

      const createResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields // Include any pre-filled values
          },
          status: 'IN_PROGRESS', // Set status at creation time
          currentStep: 'signer1'
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create document');
      }

      const { document } = await createResponse.json();
      documentId = document.id;
      if (documentId) {
        sessionStorage.setItem('currentDocumentId', documentId);
      }
      console.log('✅ Document created:', documentId);
    }

    if (!documentId) {
      brandAlert('Unable to create document. Please start over from template selection.', 'error', 'Document Creation Failed');
      return { success: false, error: 'No document ID available' };
    }

    // Document was created with IN_PROGRESS status, no need to update
    console.log('📝 Document already created with IN_PROGRESS status:', documentId);

    // Create signing sessions for each recipient
    console.log('👥 Creating signing sessions for', recipients.length, 'recipients');
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      await fetch('/api/signing-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          signerIndex: i,
          signerEmail: recipient.email || `${recipient.id}@example.com`,
          signerName: recipient.name
        }),
      });
    }

    // Move to first signer using workflow dispatch
    workflowDispatch({
      type: 'START_SIGNING',
      documentId,
      signerCount: recipients.length,
      signingOrder: recipients.map(r => r.id)
    });

    console.log('✅ Document saved and signing workflow started');
    return { success: true, documentId };

  } catch (error: any) {
    console.error('❌ Error in saveDocumentAndStartSigning:', error);
    brandAlert('Failed to start signing workflow: ' + error.message, 'error', 'Signing Failed');
    return { success: false, error: error.message };
  }
}

/**
 * Load document for signing
 * Extracted from PDFEditor.tsx (lines ~1903-2032)
 */
export async function loadDocumentForSigning(params: {
  document: any;
  sessionStorage: Storage;
  brandAlert: (message: string, type: 'success' | 'error' | 'warning', title: string) => void;
}): Promise<{
  success: boolean;
  fields?: FieldFormType[];
  recipients?: Recipient[];
  pdfFile?: File;
  existingSignedFields?: Record<string, any>;
  error?: string;
}> {
  const { document, sessionStorage, brandAlert } = params;

  try {
    console.log('📄 Loading document for signing:', document.id);
    console.log('📄 Full document object:', document);
    console.log('📄 Available document properties:', Object.keys(document));

    // Parse document data - check multiple possible locations
    let documentData = document.templateData || document.documentData || document.data;

    console.log('📄 Document data found:', documentData);
    console.log('📄 Document data type:', typeof documentData);
    console.log('📄 Document data keys:', documentData ? Object.keys(documentData) : 'null');

    if (!documentData) {
      throw new Error('No document data found. Expected templateData, documentData, or data property.');
    }

    const documentFields = documentData.fields || [];
    const documentRecipients = documentData.recipients || [];

    console.log('📋 Parsed document data:', {
      fields: documentFields.length,
      recipients: documentRecipients.length,
      fieldsData: documentFields,
      recipientsData: documentRecipients
    });

    // Validate that we have the essential data
    if (documentFields.length === 0) {
      throw new Error('No fields found in document. Document may be corrupted or incomplete.');
    }

    if (documentRecipients.length === 0) {
      throw new Error('No recipients found in document. Document may be corrupted or incomplete.');
    }

    // Validate field structure
    const invalidFields = documentFields.filter((field: any) =>
      !field.formId ||
      !field.type ||
      field.pageX === undefined ||
      field.pageY === undefined ||
      field.pageWidth === undefined ||
      field.pageHeight === undefined
    );

    if (invalidFields.length > 0) {
      console.error('❌ Invalid fields found:', invalidFields);
      throw new Error(`${invalidFields.length} fields have missing required properties (formId, type, positioning). Document may be corrupted.`);
    }

    // Validate recipient structure
    const invalidRecipients = documentRecipients.filter((recipient: any) =>
      !recipient.id ||
      !recipient.name ||
      !recipient.color
    );

    if (invalidRecipients.length > 0) {
      console.error('❌ Invalid recipients found:', invalidRecipients);
      throw new Error(`${invalidRecipients.length} recipients have missing required properties (id, name, color). Document may be corrupted.`);
    }

    console.log('✅ Field and recipient validation passed');

    // Load the PDF file from the document
    let pdfFile: File | undefined;
    if (document.pdfFileUrl) {
      console.log('📄 Fetching PDF from:', document.pdfFileUrl);
      const pdfResponse = await fetch(document.pdfFileUrl);
      const pdfBlob = await pdfResponse.blob();
      pdfFile = new File([pdfBlob], document.pdfFileName, { type: 'application/pdf' });
      console.log('📄 PDF file created:', pdfFile);
    }

    // Load any existing signed fields from the document response (already includes fieldValues)
    console.log('📝 Loading existing signed fields from document...');
    const existingSignedFields: Record<string, any> = {};

    if (document.fieldValues && document.fieldValues.length > 0) {
      // Convert the field values array to an object keyed by fieldId
      document.fieldValues.forEach((fieldValue: any) => {
        // Check if the value is a signature object and handle it safely
        let displayValue = fieldValue.value;
        if (typeof fieldValue.value === 'object' && fieldValue.value !== null && 'type' in fieldValue.value) {
          console.log(`🔍 Found signature object for ${fieldValue.fieldId}:`, fieldValue.value);
          // For signature objects, just store a boolean to indicate it's signed
          displayValue = true;
        }

        existingSignedFields[fieldValue.fieldId] = displayValue;
        console.log(`📝 Loaded signed value for ${fieldValue.fieldId}: "${displayValue}" (signer: ${fieldValue.signerIndex})`);
      });

      console.log('📝 All existing signed fields loaded (should be handled by parent):', existingSignedFields);
    } else {
      console.log('📝 No existing signed fields found, starting fresh (should be handled by parent)');
    }

    // Store current document ID for signing session
    sessionStorage.setItem('currentDocumentId', document.id);

    console.log('✅ Document loaded for signing:', {
      documentId: document.id,
      fields: documentFields.length,
      recipients: documentRecipients.length
    });

    return {
      success: true,
      fields: documentFields,
      recipients: documentRecipients,
      pdfFile,
      existingSignedFields
    };

  } catch (error: any) {
    console.error('❌ Error loading document for signing:', error);
    brandAlert('Failed to load document: ' + error.message, 'error', 'Load Failed');
    return { success: false, error: error.message };
  }
}

/**
 * Create document and start signing
 * Extracted from PDFEditor.tsx (lines ~2035-2121)
 */
export async function createDocumentAndStartSigning(params: {
  pdfFile: File | null;
  isMergedDocument?: boolean;
  fields: FieldFormType[];
  recipients: Recipient[];
  signedFields: Record<string, any>;
  pageWidth: number;
  sessionStorage: Storage;
  workflowDispatch: (action: any) => void;
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const {
    pdfFile,
    isMergedDocument,
    fields,
    recipients,
    signedFields,
    pageWidth,
    sessionStorage,
    workflowDispatch
  } = params;

  if (!pdfFile) {
    throw new Error('No PDF file available');
  }

  // First save the document (similar to saveDocument but with signing transition)
  let documentId = sessionStorage.getItem('currentDocumentId') || undefined;
  let templateId = sessionStorage.getItem('currentTemplateId') || undefined;

  // For merged documents, we should already have a document ID
  if (isMergedDocument && documentId) {
    // Document already exists and is ready for signing
    // Initialize signing phase with proper signer state
    workflowDispatch({
      type: 'START_SIGNING',
      documentId,
      signerCount: recipients.length,
      signingOrder: recipients.map(r => r.id)
    });
    return { success: true, documentId };
  }

  // If no document exists yet, create one from the current template
  if (!documentId && templateId) {
    const createResponse = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId,
        documentData: {
          fields,
          recipients,
          metadata: { pageWidth },
          signedFields // Include any pre-filled values
        },
        status: 'IN_PROGRESS', // Document is now ready for signing
        currentStep: 'signer1' // Start with first signer
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create document');
    }

    const { document } = await createResponse.json();
    documentId = document.id;
    if (documentId) {
      sessionStorage.setItem('currentDocumentId', documentId);
    }

  } else if (documentId) {
    // Update existing document to ready for signing
    const updateResponse = await fetch(`/api/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentData: {
          fields,
          recipients,
          metadata: { pageWidth },
          signedFields
        },
        status: 'IN_PROGRESS',
        currentStep: 'signer1'
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update document:', updateResponse.status, errorText);
      throw new Error(`Failed to update document: ${updateResponse.status} ${errorText}`);
    }
  } else {
    throw new Error('No template or document ID found. Please start from template creation.');
  }

  // Transition to signing mode with proper signer state initialization
  if (documentId) {
    workflowDispatch({
      type: 'START_SIGNING',
      documentId,
      signerCount: recipients.length,
      signingOrder: recipients.map(r => r.id)
    });
  }

  return { success: true, documentId };
}

/**
 * Save document as draft (without starting signing)
 * Extracted from PDFEditor.tsx (lines ~1602-1694)
 */
export async function saveDocument(params: {
  isMergedDocument?: boolean;
  mergedTemplateIds?: string[];
  fields: FieldFormType[];
  recipients: Recipient[];
  signedFields: Record<string, any>;
  pageWidth: number;
  sessionStorage: Storage;
  brandAlert: (message: string, type: 'success' | 'error' | 'warning', title: string) => void;
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const {
    isMergedDocument,
    mergedTemplateIds,
    fields,
    recipients,
    signedFields,
    pageWidth,
    sessionStorage,
    brandAlert
  } = params;

  try {
    console.log('🚀 Starting saveDocument workflow');

    let documentId = sessionStorage.getItem('currentDocumentId') || undefined;
    let templateId = sessionStorage.getItem('currentTemplateId') || undefined;

    // Handle merged document case
    if (isMergedDocument && mergedTemplateIds && !documentId) {
      console.log('📄 Creating new merged document from templates:', mergedTemplateIds);

      const createResponse = await fetch('/api/documents/merged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateIds: mergedTemplateIds,
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields // Include any pre-filled values
          },
          status: 'DRAFT',
          currentStep: 'document'
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create merged document');
      }

      const { document } = await createResponse.json();
      documentId = document.id;
      if (documentId) {
        sessionStorage.setItem('currentDocumentId', documentId);
      }

      console.log('✅ Merged document created:', documentId);
    }
    // If no document exists yet, create one from the current template
    else if (!documentId && templateId) {
      console.log('📄 No document exists, creating new document from template:', templateId);

      const createResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields // Include any pre-filled values
          },
          status: 'DRAFT', // Keep as draft, don't start signing yet
          currentStep: 'document'
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create document');
      }

      const { document } = await createResponse.json();
      documentId = document.id;
      if (documentId) {
        sessionStorage.setItem('currentDocumentId', documentId);
      }
      console.log('✅ Document created as draft:', documentId);
      brandAlert('Document saved as draft successfully!', 'success', 'Draft Saved');
    } else if (documentId) {
      // Update existing document
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentData: {
            fields,
            recipients,
            metadata: { pageWidth },
            signedFields
          },
          status: 'DRAFT',
          currentStep: 'document'
        }),
      });
      console.log('✅ Document updated:', documentId);
      brandAlert('Document updated successfully!', 'success', 'Document Updated');
    } else {
      throw new Error('No template or document ID found. Please start from template creation.');
    }

    return { success: true, documentId: documentId || undefined };

  } catch (error: any) {
    console.error('❌ Error in saveDocument:', error);
    brandAlert('Failed to save document: ' + error.message, 'error', 'Save Failed');
    return { success: false, error: error.message };
  }
}
