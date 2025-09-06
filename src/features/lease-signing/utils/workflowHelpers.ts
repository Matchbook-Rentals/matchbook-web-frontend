/**
 * Semantic helper functions for workflow logic
 * Following declarative functional decomposition principles
 */

import { WorkflowPhase, WorkflowState, SignerState } from '../types/workflow.types';
import { FieldFormType } from '@/components/pdf-editor/types';

// ===== PHASE VALIDATION HELPERS =====

export const isEditablePhase = (phase: WorkflowPhase): boolean =>
  phase === 'template' || phase === 'document';

export const isSigningPhase = (phase: WorkflowPhase): boolean =>
  phase === 'signing';

export const isReadOnlyPhase = (phase: WorkflowPhase): boolean =>
  phase === 'signing' || phase === 'success';

export const requiresRecipients = (phase: WorkflowPhase): boolean =>
  phase === 'document' || phase === 'signing';

export const requiresFields = (phase: WorkflowPhase): boolean =>
  phase !== 'selection' && phase !== 'success';

// ===== SIGNER HELPERS =====

export const getSignerLabel = (index: number, total: number): string =>
  `Signer ${index + 1} of ${total}`;

export const getSignerName = (
  signerState: SignerState | undefined,
  recipients: Array<{ id: string; name: string }>
): string => {
  if (!signerState) return 'Unknown Signer';
  
  const currentId = signerState.signingOrder[signerState.currentSignerIndex];
  const recipient = recipients.find(r => r.id === currentId);
  
  return recipient?.name || `Signer ${signerState.currentSignerIndex + 1}`;
};

export const isSignerComplete = (
  signerId: string,
  signerState: SignerState | undefined
): boolean =>
  signerState?.signersCompleted.includes(signerId) ?? false;

export const getAllSignersComplete = (signerState: SignerState | undefined): boolean => {
  if (!signerState) return false;
  return signerState.signersCompleted.length === signerState.totalSigners;
};

export const getNextSignerId = (signerState: SignerState | undefined): string | null => {
  if (!signerState) return null;
  
  const { currentSignerIndex, signingOrder, totalSigners } = signerState;
  const nextIndex = currentSignerIndex + 1;
  
  if (nextIndex >= totalSigners) return null;
  return signingOrder[nextIndex];
};

// ===== FIELD HELPERS =====

export const getFieldsForCurrentSigner = (
  fields: FieldFormType[],
  signerState: SignerState | undefined
): FieldFormType[] => {
  if (!signerState) return [];
  
  const currentSignerIndex = signerState.currentSignerIndex;
  return fields.filter(field => field.recipientIndex === currentSignerIndex);
};

export const getRequiredFieldsForSigner = (
  fields: FieldFormType[],
  signerIndex: number
): FieldFormType[] =>
  fields.filter(field => 
    field.recipientIndex === signerIndex && field.required
  );

export const areAllRequiredFieldsSigned = (
  fields: FieldFormType[],
  signerIndex: number,
  signedFields: Record<string, any>
): boolean => {
  const requiredFields = getRequiredFieldsForSigner(fields, signerIndex);
  return requiredFields.every(field => signedFields[field.formId]);
};

// ===== TRANSITION HELPERS =====

export const canTransitionFromTemplate = (
  hasFields: boolean,
  hasRecipients: boolean
): boolean =>
  hasFields && hasRecipients;

export const canTransitionFromDocument = (
  documentId: string | undefined,
  recipientCount: number
): boolean =>
  documentId != null && recipientCount > 0;

export const canTransitionFromSigning = (
  signerState: SignerState | undefined
): boolean =>
  getAllSignersComplete(signerState);

export const shouldAutoAdvanceToNextSigner = (
  currentSignerFields: FieldFormType[],
  signedFields: Record<string, any>
): boolean => {
  const requiredFields = currentSignerFields.filter(f => f.required);
  return requiredFields.every(field => signedFields[field.formId]);
};

// ===== VALIDATION HELPERS =====

export const validatePhaseTransition = (
  fromPhase: WorkflowPhase,
  toPhase: WorkflowPhase
): { valid: boolean; reason?: string } => {
  const phaseOrder = ['selection', 'template', 'document', 'signing', 'success'];
  const fromIndex = phaseOrder.indexOf(fromPhase);
  const toIndex = phaseOrder.indexOf(toPhase);
  
  // Can't skip phases forward (except selection -> document for existing docs)
  if (toIndex > fromIndex + 1) {
    if (!(fromPhase === 'selection' && toPhase === 'document')) {
      return { 
        valid: false, 
        reason: `Cannot skip from ${fromPhase} to ${toPhase}` 
      };
    }
  }
  
  // Can go back to any previous phase
  if (toIndex < fromIndex) {
    return { valid: true };
  }
  
  // Forward transitions are valid if sequential
  if (toIndex === fromIndex + 1) {
    return { valid: true };
  }
  
  return { 
    valid: false, 
    reason: `Invalid transition from ${fromPhase} to ${toPhase}` 
  };
};

// ===== PROGRESS HELPERS =====

export const getPhaseProgress = (state: WorkflowState): number => {
  const phaseWeights: Record<WorkflowPhase, number> = {
    selection: 0,
    template: 25,
    document: 50,
    signing: 75,
    success: 100
  };
  
  let baseProgress = phaseWeights[state.phase];
  
  // Add signer progress if in signing phase
  if (state.phase === 'signing' && state.signerState) {
    const signerProgress = (state.signerState.signersCompleted.length / state.signerState.totalSigners) * 25;
    baseProgress += signerProgress;
  }
  
  return Math.min(100, Math.round(baseProgress));
};

export const getPhaseCompletionStatus = (
  phase: WorkflowPhase,
  state: WorkflowState
): 'pending' | 'active' | 'completed' => {
  const phaseOrder = ['selection', 'template', 'document', 'signing', 'success'];
  const currentIndex = phaseOrder.indexOf(state.phase);
  const targetIndex = phaseOrder.indexOf(phase);
  
  if (targetIndex < currentIndex) return 'completed';
  if (targetIndex === currentIndex) return 'active';
  return 'pending';
};

// ===== ERROR HELPERS =====

export const getPhaseErrorMessage = (
  phase: WorkflowPhase,
  error: string | undefined
): string | null => {
  if (!error) return null;
  
  const phaseErrors: Record<WorkflowPhase, string> = {
    selection: 'Please select a template or document to continue',
    template: 'Please complete the template configuration',
    document: 'Please fill in all required document fields',
    signing: 'All signers must complete their signatures',
    success: ''
  };
  
  return phaseErrors[phase] || error;
};

// ===== UI HELPERS =====

export const shouldShowFieldBorders = (phase: WorkflowPhase): boolean =>
  phase === 'template' || phase === 'document';

export const shouldShowRecipientSelector = (phase: WorkflowPhase): boolean =>
  phase === 'template' || phase === 'document';

export const shouldShowSignatureTools = (phase: WorkflowPhase): boolean =>
  phase === 'signing';

export const shouldAllowFieldEditing = (
  phase: WorkflowPhase,
  fieldOwnerIndex: number,
  currentSignerIndex: number
): boolean => {
  if (isEditablePhase(phase)) return true;
  if (phase === 'signing') {
    return fieldOwnerIndex === currentSignerIndex;
  }
  return false;
};

export const getFieldOpacity = (phase: WorkflowPhase): number =>
  isEditablePhase(phase) ? 0.3 : 1.0;

// ===== DOCUMENT HELPERS =====

export const getDocumentFileName = (
  originalName: string,
  phase: WorkflowPhase
): string => {
  const baseName = originalName.replace('.pdf', '');
  
  const suffixMap: Record<WorkflowPhase, string> = {
    selection: '',
    template: '_template',
    document: '_document',
    signing: '_signing',
    success: '_signed'
  };
  
  return `${baseName}${suffixMap[phase]}.pdf`;
};