/**
 * Adapter to migrate from old signer1/signer2 system to new dynamic workflow
 * This provides compatibility layer during migration
 */

import { WorkflowPhase, WorkflowState } from '../types/workflow.types';

// Old workflow state type from PDFEditor
type LegacyWorkflowState = 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed';

/**
 * Convert legacy workflow state to new workflow phase
 */
export const legacyStateToPhase = (legacyState: LegacyWorkflowState): WorkflowPhase => {
  switch (legacyState) {
    case 'signer1':
    case 'signer2':
      return 'signing';
    case 'completed':
      return 'success';
    default:
      return legacyState as WorkflowPhase;
  }
};

/**
 * Convert new workflow state to legacy state for backward compatibility
 */
export const phaseToLegacyState = (
  phase: WorkflowPhase,
  signerIndex: number = 0
): LegacyWorkflowState => {
  switch (phase) {
    case 'signing':
      // Map to signer1 or signer2 based on index
      return signerIndex === 0 ? 'signer1' : 'signer2';
    case 'success':
      return 'completed';
    default:
      return phase as LegacyWorkflowState;
  }
};

/**
 * Get signer index from legacy state
 */
export const getSignerIndexFromLegacy = (legacyState: LegacyWorkflowState): number | null => {
  switch (legacyState) {
    case 'signer1':
      return 0;
    case 'signer2':
      return 1;
    default:
      return null;
  }
};

/**
 * Check if legacy state is a signing state
 */
export const isLegacySigningState = (state: LegacyWorkflowState): boolean =>
  state === 'signer1' || state === 'signer2';

/**
 * Create initial workflow state from legacy state
 */
export const createWorkflowStateFromLegacy = (
  legacyState: LegacyWorkflowState,
  recipientCount: number = 2
): WorkflowState => {
  const phase = legacyStateToPhase(legacyState);
  const signerIndex = getSignerIndexFromLegacy(legacyState);
  
  const state: WorkflowState = {
    phase,
    isTransitioning: false
  };
  
  // Add signer state if in signing phase
  if (phase === 'signing' && signerIndex !== null) {
    state.signerState = {
      currentSignerIndex: signerIndex,
      totalSigners: recipientCount,
      signersCompleted: signerIndex > 0 ? ['signer-0'] : [],
      signingOrder: Array.from({ length: recipientCount }, (_, i) => `signer-${i}`)
    };
  }
  
  return state;
};

/**
 * Get next legacy state for compatibility
 */
export const getNextLegacyState = (
  currentState: LegacyWorkflowState,
  recipientCount: number = 2
): LegacyWorkflowState | null => {
  switch (currentState) {
    case 'selection':
      return 'template';
    case 'template':
      return 'document';
    case 'document':
      return 'signer1';
    case 'signer1':
      return recipientCount > 1 ? 'signer2' : 'completed';
    case 'signer2':
      return 'completed';
    case 'completed':
      return null;
    default:
      return null;
  }
};

/**
 * Get previous legacy state for compatibility
 */
export const getPreviousLegacyState = (
  currentState: LegacyWorkflowState
): LegacyWorkflowState | null => {
  switch (currentState) {
    case 'completed':
      return 'signer2';
    case 'signer2':
      return 'signer1';
    case 'signer1':
      return 'document';
    case 'document':
      return 'template';
    case 'template':
      return 'selection';
    case 'selection':
      return null;
    default:
      return null;
  }
};

/**
 * Map legacy completeCurrentStep behavior to new workflow
 */
export const mapLegacyStepCompletion = (
  legacyState: LegacyWorkflowState,
  recipientCount: number = 2
): {
  action: 'next_phase' | 'next_signer' | 'complete' | 'none';
  nextState?: LegacyWorkflowState;
} => {
  switch (legacyState) {
    case 'template':
      return { action: 'next_phase', nextState: 'document' };
    
    case 'document':
      return { action: 'next_phase', nextState: 'signer1' };
    
    case 'signer1':
      if (recipientCount > 1) {
        return { action: 'next_signer', nextState: 'signer2' };
      } else {
        return { action: 'complete', nextState: 'completed' };
      }
    
    case 'signer2':
      return { action: 'complete', nextState: 'completed' };
    
    default:
      return { action: 'none' };
  }
};

/**
 * Convert field recipientIndex for new dynamic system
 * In the new system, we track actual recipient IDs, not just indices
 */
export const convertRecipientIndexToId = (
  recipientIndex: number,
  recipients: Array<{ id: string; name: string }>
): string => {
  if (recipientIndex < recipients.length) {
    return recipients[recipientIndex].id;
  }
  // Fallback for missing recipients
  return `recipient-${recipientIndex}`;
};

/**
 * Check if should show field for current signer
 */
export const shouldShowFieldForSigner = (
  fieldRecipientIndex: number,
  currentSignerIndex: number,
  phase: WorkflowPhase
): boolean => {
  // In template/document phase, show all fields
  if (phase === 'template' || phase === 'document') {
    return true;
  }
  
  // In signing phase, only show fields for current signer
  if (phase === 'signing') {
    return fieldRecipientIndex === currentSignerIndex;
  }
  
  // In other phases, show all
  return true;
};

/**
 * Get display text for current workflow state
 */
export const getWorkflowDisplayText = (
  state: WorkflowState,
  recipients: Array<{ name: string }>
): {
  title: string;
  description: string;
  progress: string;
} => {
  const phaseTexts = {
    selection: {
      title: 'Select Document',
      description: 'Choose a template or existing document',
      progress: 'Getting Started'
    },
    template: {
      title: 'Create Template',
      description: 'Set up fields and signing requirements',
      progress: 'Step 1 of 4'
    },
    document: {
      title: 'Prepare Document',
      description: 'Fill in document details',
      progress: 'Step 2 of 4'
    },
    signing: {
      title: 'Sign Document',
      description: 'Collect signatures from all parties',
      progress: 'Step 3 of 4'
    },
    success: {
      title: 'Complete',
      description: 'Document signing is complete',
      progress: 'Finished'
    }
  };
  
  let result = phaseTexts[state.phase];
  
  // Customize for signing phase with signer info
  if (state.phase === 'signing' && state.signerState) {
    const currentSigner = recipients[state.signerState.currentSignerIndex];
    result = {
      title: `${currentSigner?.name || 'Signer'} - Sign Document`,
      description: `Signer ${state.signerState.currentSignerIndex + 1} of ${state.signerState.totalSigners}`,
      progress: `Step 3 of 4 - Signer ${state.signerState.currentSignerIndex + 1}/${state.signerState.totalSigners}`
    };
  }
  
  return result;
};