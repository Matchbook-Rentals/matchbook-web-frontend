import { FieldFormType } from '@/components/pdf-editor/types';
import { Recipient } from '@/components/pdf-editor/RecipientManager';

/**
 * Save signer progress asynchronously (doesn't auto-transition)
 * Extracted from PDFEditor.tsx (lines ~1284-1473)
 */
export async function saveSignerProgressAsync(params: {
  signerIndex: number;
  documentId: string;
  fields: FieldFormType[];
  recipients: Recipient[];
  signedFields: Record<string, any>;
  pageWidth: number;
  brandAlert: (message: string, type: 'success' | 'error' | 'warning', title: string) => void;
  useSignedFieldsStore: any; // Zustand store
}): Promise<{ success: boolean; error?: string }> {
  const {
    signerIndex,
    documentId,
    fields,
    recipients,
    signedFields,
    pageWidth,
    brandAlert,
    useSignedFieldsStore
  } = params;

  console.log(`📋 Saving progress for signer ${signerIndex + 1}, document: ${documentId}`);

  try {
    // Save all signed fields for this signer
    const signerFields = fields.filter(f => f.recipientIndex === signerIndex);
    console.log(`💾 Saving ${signerFields.length} field values for signer ${signerIndex + 1}`);

    for (const field of signerFields) {
      const fieldValue = useSignedFieldsStore.getState().signedFields[field.formId];
      if (fieldValue) {
        const requestBody = {
          documentId,
          fieldId: field.formId,
          fieldType: field.type,
          signerIndex,
          signerEmail: recipients[signerIndex]?.email || `signer${signerIndex}@example.com`,
          value: fieldValue
        };

        console.log(`📤 Saving field ${field.formId} to /api/field-values:`, requestBody);

        const response = await fetch('/api/field-values', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ FIELD SAVE FAILED - /api/field-values`, {
            request: {
              url: '/api/field-values',
              method: 'POST',
              body: requestBody
            },
            response: {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            },
            field: {
              formId: field.formId,
              type: field.type,
              recipientIndex: field.recipientIndex,
              value: fieldValue
            }
          });
          throw new Error(`API /api/field-values returned ${response.status}: ${errorText || response.statusText}`);
        }
        console.log(`✅ Field ${field.formId} saved successfully`);
      }
    }

    // Update signing session status (optional - don't fail the entire process if this fails)
    try {
      const sessionBody = {
        documentId,
        signerIndex
      };

      console.log('📤 Updating signing session at /api/signing-sessions/complete:', sessionBody);

      const sessionResponse = await fetch('/api/signing-sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionBody),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('❌ SESSION UPDATE FAILED - /api/signing-sessions/complete', {
          request: {
            url: '/api/signing-sessions/complete',
            method: 'POST',
            body: sessionBody
          },
          response: {
            status: sessionResponse.status,
            statusText: sessionResponse.statusText,
            body: errorText
          }
        });
        console.warn('⚠️ Signing session update failed, but continuing with document completion');
      } else {
        console.log('✅ Signing session updated successfully');
      }
    } catch (sessionError) {
      console.error('❌ Error updating signing session (non-critical):', sessionError);
      console.warn('⚠️ Signing session update failed, but continuing with document completion');
    }

    // Update document with current progress and signed fields (optional - don't fail if this fails)
    try {
      const docUpdateBody = {
        documentData: {
          fields,
          recipients,
          metadata: { pageWidth },
          signedFields // Save current signed state
        },
        currentStep: signerIndex === 0 ? 'signer2' : 'completed',
        status: signerIndex === 0 ? 'IN_PROGRESS' : 'COMPLETED',
        [`signer${signerIndex + 1}CompletedAt`]: new Date().toISOString()
      };

      console.log(`📤 Updating document at /api/documents/${documentId}:`, {
        status: docUpdateBody.status,
        currentStep: docUpdateBody.currentStep,
        fieldsCount: fields.length,
        recipientsCount: recipients.length
      });

      const docUpdateResponse = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docUpdateBody),
      });

      if (!docUpdateResponse.ok) {
        const errorText = await docUpdateResponse.text();
        console.error(`❌ DOCUMENT UPDATE FAILED - /api/documents/${documentId}`, {
          request: {
            url: `/api/documents/${documentId}`,
            method: 'PATCH',
            bodyPreview: {
              status: docUpdateBody.status,
              currentStep: docUpdateBody.currentStep,
              fieldsCount: fields.length,
              signedFieldsCount: Object.keys(signedFields || {}).length
            }
          },
          response: {
            status: docUpdateResponse.status,
            statusText: docUpdateResponse.statusText,
            body: errorText
          }
        });
        console.warn('⚠️ Document status update failed, but field values were saved successfully');
      } else {
        console.log('✅ Document updated successfully');
      }
    } catch (docError) {
      console.error('❌ Error updating document (non-critical):', docError);
      console.warn('⚠️ Document status update failed, but field values were saved successfully');
    }

    // Show success and return to selection
    const signerName = recipients[signerIndex]?.name || `Signer ${signerIndex + 1}`;
    if (signerIndex === 0) {
      brandAlert(`${signerName} has completed signing!\n\n${signerIndex === 0 ? 'Document is now ready for the Renter.' : 'Document is fully signed and complete.'}`, 'success', 'Signing Complete');
    }

    console.log(`Signer ${signerIndex + 1} completed signing asynchronously`);
    return { success: true };

  } catch (error: any) {
    console.error('❌ SAVE SIGNER PROGRESS FAILED:', error);

    // Show the ACTUAL error to the user
    const errorMessage = `SIGNING SAVE FAILED:\n\n${error.message}\n\nDocument ID: ${documentId}\nSigner: ${signerIndex + 1}\n\nCheck console for full details.`;

    // Log everything for debugging
    console.error('❌ COMPLETE ERROR DUMP:', {
      error: error,
      errorMessage: error.message,
      errorStack: error.stack,
      documentId: documentId,
      signerIndex: signerIndex,
      signerFields: fields.filter(f => f.recipientIndex === signerIndex),
      signedFieldsStore: useSignedFieldsStore.getState().signedFields,
      recipients: recipients,
      timestamp: new Date().toISOString()
    });

    brandAlert(errorMessage, 'error', 'Save Failed - Check Console');
    return { success: false, error: error.message };
  }
}

/**
 * Save signer progress and continue (legacy synchronous version)
 * Extracted from PDFEditor.tsx (lines ~1477-1564)
 */
export async function saveSignerProgressAndContinue(params: {
  signerIndex: number;
  documentId: string;
  fields: FieldFormType[];
  recipients: Recipient[];
  brandAlert: (message: string, type: 'success' | 'error' | 'warning', title: string) => void;
  useSignedFieldsStore: any; // Zustand store
  completeSigning: () => Promise<void>;
  setWorkflowState: (state: string) => void;
}): Promise<{ success: boolean; error?: string }> {
  const {
    signerIndex,
    documentId,
    fields,
    recipients,
    brandAlert,
    useSignedFieldsStore,
    completeSigning,
    setWorkflowState
  } = params;

  try {
    // Save all signed fields for this signer
    const signerFields = fields.filter(f => f.recipientIndex === signerIndex);

    for (const field of signerFields) {
      const fieldValue = useSignedFieldsStore.getState().signedFields[field.formId];
      if (fieldValue) {
        const requestBody = {
          documentId,
          fieldId: field.formId,
          fieldType: field.type,
          signerIndex,
          signerEmail: recipients[signerIndex]?.email || `signer${signerIndex}@example.com`,
          value: fieldValue
        };

        console.log(`📤 Saving field ${field.formId} to /api/field-values:`, requestBody);

        const response = await fetch('/api/field-values', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ FIELD SAVE FAILED - /api/field-values`, {
            request: {
              url: '/api/field-values',
              method: 'POST',
              body: requestBody
            },
            response: {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            },
            field: {
              formId: field.formId,
              type: field.type,
              recipientIndex: field.recipientIndex,
              value: fieldValue
            }
          });
          throw new Error(`API /api/field-values returned ${response.status}: ${errorText || response.statusText}`);
        }
        console.log(`✅ Field ${field.formId} saved successfully`);
      }
    }

    // Update signing session status
    await fetch('/api/signing-sessions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        signerIndex
      }),
    });

    // Move to next step
    if (signerIndex === 0) {
      // Moving from signer1 (recipientIndex 0) to signer2
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'signer2'
        }),
      });
      setWorkflowState('signer2');
    } else {
      // All signers complete
      await completeSigning();
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error in saveSignerProgressAndContinue:', error);
    brandAlert('Failed to save signer progress. Please try again.', 'error', 'Save Failed');
    return { success: false, error: error.message };
  }
}
