import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { handleSignerCompletion } from '@/app/actions/documents';
import { FieldFormType, FieldType } from '@/components/pdf-editor/types';
import { Recipient } from '@/components/pdf-editor/RecipientManager';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';

type LegacyWorkflowState = 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed';

interface WorkflowStateMachine {
  isTemplatePhase: () => boolean;
  isDocumentPhase: () => boolean;
  isSigningPhase: () => boolean;
  isFirstSigner: () => boolean;
  getCurrentSignerIndex: () => number;
  completeCurrentSigner: (signerId: string) => void;
  dispatch: (action: any) => void;
}

interface UseStepCompletionParams {
  workflow: WorkflowStateMachine;
  legacyWorkflowState: LegacyWorkflowState;
  pdfFile: File | null;
  fields: FieldFormType[];
  recipients: Recipient[];
  templateType?: 'lease' | 'addendum' | 'disclosure' | 'other';
  housingRequestId?: string;
  signedFields: Record<string, any>;
  setIsSavingTemplate: (value: boolean) => void;
  setIsCreatingDocument: (value: boolean) => void;
  setStepCompleted: (value: boolean) => void;
  setShowFieldValidationModal: (value: boolean) => void;
  brandAlert: (message: string, type: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  validateSignatureFields: () => { hasHostSignature: boolean; hasRenterSignature: boolean; isValid: boolean };
  proceedWithTemplateCompletion: () => Promise<void>;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onDocumentCreated?: (documentId: string) => void;
  createDocumentAndStartSigning: () => Promise<void>;
  saveSignerProgressAsync: (signerIndex: number) => Promise<void>;
  onFinish?: (stepName: string) => void;
}

export const useStepCompletion = (params: UseStepCompletionParams) => {
  const router = useRouter();

  const {
    workflow,
    legacyWorkflowState,
    pdfFile,
    fields,
    recipients,
    templateType,
    housingRequestId,
    signedFields,
    setIsSavingTemplate,
    setIsCreatingDocument,
    setStepCompleted,
    setShowFieldValidationModal,
    brandAlert,
    validateSignatureFields,
    proceedWithTemplateCompletion,
    onSave,
    onDocumentCreated,
    createDocumentAndStartSigning,
    saveSignerProgressAsync,
    onFinish
  } = params;

  const completeCurrentStep = useCallback(async () => {
    console.log('🎯🎯🎯 COMPLETE CURRENT STEP CALLED! 🎯🎯🎯');
    console.log('📋 PDFEditor completeCurrentStep context:', {
      workflowState: legacyWorkflowState,
      housingRequestId: housingRequestId || 'UNDEFINED!',
      hasHousingRequestId: !!housingRequestId,
      recipientsCount: recipients.length
    });

    const stepNames: Record<LegacyWorkflowState, string> = {
      'selection': 'Selection',
      'template': 'Template Creation',
      'document': 'Document Creation',
      'signer1': 'Signer 1',
      'signer2': 'Signer 2',
      'completed': 'Document Completion'
    };

    const stepName = stepNames[legacyWorkflowState] || legacyWorkflowState;

    switch (legacyWorkflowState) {
      case 'template':
        // Start loading for template workflow
        setIsSavingTemplate(true);

        if (!pdfFile) {
          brandAlert('Please upload a PDF file first.', 'warning', 'File Required');
          setIsSavingTemplate(false);
          return;
        }


        if (!templateType) {

          brandAlert('Please select a template type (lease or addendum).', 'warning', 'Template Type Required');
          setIsSavingTemplate(false);
          return;
        }

        // Check for signature fields validation
        const validation = validateSignatureFields();
        if (!validation.isValid && templateType === 'lease') {
          setIsSavingTemplate(false);
          setShowFieldValidationModal(true);
          return;
        }

        if (fields.length === 0) {
          brandAlert('Please add some fields to your template first!', 'warning', 'Fields Required');
          setIsSavingTemplate(false);
          return;
        }

        // If onSave callback is provided (editing existing template), use it
        if (onSave && pdfFile) {
          try {
            await onSave({ fields, recipients, pdfFile });
            setIsSavingTemplate(false);
            // onSave should handle navigation/completion
          } catch (error) {
            console.error('Error in onSave callback:', error);
            brandAlert('Failed to save template. Please try again.', 'error', 'Save Failed');
            setIsSavingTemplate(false);
          }
        } else {
          // Creating new template - use the original flow
          await proceedWithTemplateCompletion();
        }
        break;

      case 'document':
        if (fields.length === 0) {
          brandAlert('Please add some fields before finishing!', 'warning', 'Fields Required');
          return;
        }

        // If onSave callback is provided, use it instead of internal API calls
        if (onSave && pdfFile) {
          setIsCreatingDocument(true);
          try {
            await onSave({ fields, recipients, pdfFile });

            // Check if we have a document ID to transition to signing
            const documentId = sessionStorage.getItem('currentDocumentId');
            if (documentId && onDocumentCreated) {
              onDocumentCreated(documentId);

              // Update document status to IN_PROGRESS for signing
              try {
                await fetch(`/api/documents/${documentId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: 'IN_PROGRESS',
                    currentStep: 'signer1'
                  }),
                });
              } catch (error) {
                console.error('Failed to update document status:', error);
              }

              // Transition to signing workflow for the host
              // The approval will happen AFTER the host completes signing in signer1 state
              console.log('📝 Document created, transitioning to signing for host signature');
              workflow.dispatch({
                type: 'START_SIGNING',
                documentId,
                signerCount: recipients.length,
                signingOrder: recipients.map(r => r.id)
              });
            }
          } catch (error: any) {
            console.error('Error in onSave callback:', error);
            brandAlert('Failed to save document: ' + error.message, 'error', 'Save Failed');
          } finally {
            setIsCreatingDocument(false);
          }
          return;
        }

        // Set loading state for document creation
        setIsCreatingDocument(true);

        try {
          // Create the document and transition to signing
          await createDocumentAndStartSigning();
          return; // Don't continue to the normal completion flow
        } catch (error: any) {
          console.error('❌ Error creating document:', error);
          brandAlert('Failed to create document: ' + error.message, 'error', 'Creation Failed');
          setIsCreatingDocument(false);
          return;
        }

      case 'signer1':
      case 'signer2':
        // Get signer info without validation
        const currentSignerIndex = workflow.getCurrentSignerIndex();

        let signingProgressSuccess = false;
        let serverActionSuccess = false;

        try {
          // Save signing progress to the backend (always use proper signing workflow)
          console.log(`🖊️ Saving signing progress for signer ${currentSignerIndex + 1}...`);
          await saveSignerProgressAsync(currentSignerIndex);
          signingProgressSuccess = true;
          console.log('✅ Signing progress saved successfully');
        } catch (error) {
          console.error('❌ Error saving signing progress:', error);
          // Continue processing even if signing progress fails - the field values were saved
          signingProgressSuccess = false;
        }

        try {
          // Call server action to handle notifications and booking creation
          const documentId = sessionStorage.getItem('currentDocumentId');
          console.log(`🔍 Debug - Complete step called with:`, {
            currentSignerIndex,
            documentId,
            housingRequestId,
            hasHousingRequestId: !!housingRequestId,
            recipientsCount: recipients.length,
            workflowState: legacyWorkflowState
          });

          if (documentId) {
            console.log(`📤 Calling server action for signer completion...`);
            console.log(`📋 handleSignerCompletion params:`, {
              documentId,
              currentSignerIndex,
              recipientsLength: recipients.length,
              housingRequestId: housingRequestId || 'MISSING!',
              isHost: currentSignerIndex === 0
            });

            const result = await handleSignerCompletion(
              documentId,
              currentSignerIndex,
              recipients.map(r => ({
                id: r.id,
                name: r.name,
                email: r.email,
                role: r.role || ''
              })),
              housingRequestId
            );
            if (!result.success) {
              console.error('❌ Server action failed:', result.error);
              serverActionSuccess = false;
              // Don't return early - continue with workflow completion
            } else {
              console.log('✅ handleSignerCompletion succeeded');
              serverActionSuccess = true;
            }
          } else {
            console.error('❌ No document ID found in session storage!');
            serverActionSuccess = false;
          }
        } catch (error) {
          console.error('❌ Error in server action:', error);
          serverActionSuccess = false;
          // Continue processing even if server action fails
        }

        // Always proceed with workflow state changes and onFinish call
        // The essential data (field values) has been saved even if other APIs failed
        console.log('📊 Signing completion status:', {
          signingProgressSuccess,
          serverActionSuccess,
          proceedingWithCompletion: true
        });

        // Transition workflow state using new workflow system
        if (workflow.isSigningPhase() && workflow.isFirstSigner()) {
          // Check if host should be redirected after signing
          const hostRedirectUrl = sessionStorage.getItem('hostSigningRedirectUrl');
          if (hostRedirectUrl) {
            console.log('✅ Host completed signing, redirecting to:', hostRedirectUrl);
            sessionStorage.removeItem('hostSigningRedirectUrl'); // Clean up
            router.push(hostRedirectUrl);
            return; // Exit early to avoid further state changes
          }

          // Complete current signer and advance using workflow system
          const currentSignerId = recipients[currentSignerIndex]?.id || `signer-${currentSignerIndex}`;
          workflow.completeCurrentSigner(currentSignerId);
          console.log(`✅ Signer ${currentSignerIndex + 1} completed, workflow advancing`);
        } else if (workflow.isSigningPhase() && !workflow.isFirstSigner()) {
          // Complete final signer and transition to success
          const currentSignerId = recipients[currentSignerIndex]?.id || `signer-${currentSignerIndex}`;
          workflow.completeCurrentSigner(currentSignerId);
          console.log('✅ All signers completed, document finished');

          // Show success toast and redirect to leases list
          brandAlert(
            'Template created successfully!',
            'success',
            'Success'
          );

          // Redirect to leases list
          const redirectUrl = `/app/host/${listingId}/leases`;
          console.log('🔄 Redirecting to:', redirectUrl);
          router.push(redirectUrl);
          return; // Exit early to prevent success phase rendering
        }

        // Reset validation states for the next step
        break;
    }

    // Set completion state
    setStepCompleted(true);

    // Call onFinish if provided, otherwise show default success
    if (onFinish) {
      onFinish(stepName);
    }
  }, [
    workflow,
    legacyWorkflowState,
    pdfFile,
    fields,
    recipients,
    templateType,
    housingRequestId,
    signedFields,
    setIsSavingTemplate,
    setIsCreatingDocument,
    setStepCompleted,
    setShowFieldValidationModal,
    brandAlert,
    validateSignatureFields,
    proceedWithTemplateCompletion,
    onSave,
    onDocumentCreated,
    createDocumentAndStartSigning,
    saveSignerProgressAsync,
    onFinish,
    router
  ]);

  return { completeCurrentStep };
};
