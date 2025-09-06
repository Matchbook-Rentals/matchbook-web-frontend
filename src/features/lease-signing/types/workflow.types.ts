/**
 * Unified workflow types for the lease signing process
 * Following declarative functional decomposition principles
 */

// Core workflow phases - exactly 5 as specified
export type WorkflowPhase = 
  | 'selection'  // Choose template or existing document
  | 'template'   // Configure template fields and recipients
  | 'document'   // Create document with actual data
  | 'signing'    // Dynamic signing phase (supports N signers)
  | 'success';   // Completion state (handled outside PDF editor)

// Signer state for dynamic multi-signer support
export interface SignerState {
  currentSignerIndex: number;
  totalSigners: number;
  signersCompleted: string[]; // Track by recipient ID
  signingOrder: string[]; // Ordered list of recipient IDs
}

// Complete workflow state
export interface WorkflowState {
  phase: WorkflowPhase;
  signerState?: SignerState;
  templateId?: string;
  documentId?: string;
  error?: string;
  isTransitioning: boolean;
}

// Workflow transition events
export type WorkflowTransition =
  | { type: 'START_TEMPLATE_CREATION' }
  | { type: 'START_DOCUMENT_CREATION'; templateId: string }
  | { type: 'COMPLETE_TEMPLATE'; templateId: string }
  | { type: 'COMPLETE_DOCUMENT'; documentId: string }
  | { type: 'START_SIGNING'; documentId: string; signerCount: number }
  | { type: 'COMPLETE_SIGNER'; signerId: string }
  | { type: 'ADVANCE_TO_NEXT_SIGNER' }
  | { type: 'COMPLETE_ALL_SIGNING' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; error: string };

// Workflow metadata for tracking
export interface WorkflowMetadata {
  startedAt: Date;
  completedAt?: Date;
  currentPhaseStartedAt: Date;
  phaseHistory: {
    phase: WorkflowPhase;
    enteredAt: Date;
    exitedAt?: Date;
  }[];
}

// Constants for workflow configuration
export const WORKFLOW_PHASES = {
  SELECTION: 'selection',
  TEMPLATE: 'template', 
  DOCUMENT: 'document',
  SIGNING: 'signing',
  SUCCESS: 'success'
} as const;

export const WORKFLOW_PHASE_ORDER: WorkflowPhase[] = [
  'selection',
  'template',
  'document',
  'signing',
  'success'
];

// Phase display names for UI
export const WORKFLOW_PHASE_LABELS: Record<WorkflowPhase, string> = {
  selection: 'Select Document',
  template: 'Create Template',
  document: 'Prepare Document',
  signing: 'Sign Document',
  success: 'Complete'
};

// Phase descriptions
export const WORKFLOW_PHASE_DESCRIPTIONS: Record<WorkflowPhase, string> = {
  selection: 'Choose a template or existing document to work with',
  template: 'Set up fields and define signing requirements',
  document: 'Fill in document details and recipient information',
  signing: 'Collect signatures from all parties',
  success: 'Document signing is complete'
};