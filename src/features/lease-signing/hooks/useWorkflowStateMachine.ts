'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  WorkflowPhase,
  WorkflowState,
  WorkflowTransition,
  WorkflowMetadata,
  SignerState,
  WORKFLOW_PHASE_ORDER
} from '../types/workflow.types';

interface UseWorkflowStateMachineReturn {
  // Current state
  state: WorkflowState;
  metadata: WorkflowMetadata;
  
  // Semantic state queries
  isInPhase: (phase: WorkflowPhase) => boolean;
  isSelectionPhase: () => boolean;
  isTemplatePhase: () => boolean;
  isDocumentPhase: () => boolean;
  isSigningPhase: () => boolean;
  isSuccessPhase: () => boolean;
  
  // Signer queries
  getCurrentSignerIndex: () => number;
  getTotalSigners: () => number;
  getCurrentSignerId: () => string | undefined;
  isFirstSigner: () => boolean;
  isLastSigner: () => boolean;
  hasMoreSigners: () => boolean;
  getSignerProgress: () => number;
  
  // Transition queries
  canTransitionForward: () => boolean;
  canTransitionBack: () => boolean;
  canStartSigning: () => boolean;
  canCompleteCurrentPhase: () => boolean;
  
  // State transitions
  dispatch: (transition: WorkflowTransition) => void;
  transitionToPhase: (phase: WorkflowPhase) => void;
  moveToNextPhase: () => void;
  moveToPreviousPhase: () => void;
  advanceToNextSigner: () => void;
  completeCurrentSigner: (signerId: string) => void;
  resetWorkflow: () => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export function useWorkflowStateMachine(
  initialPhase: WorkflowPhase = 'selection'
): UseWorkflowStateMachineReturn {
  // Initialize state
  const [state, setState] = useState<WorkflowState>({
    phase: initialPhase,
    isTransitioning: false
  });

  const [metadata, setMetadata] = useState<WorkflowMetadata>({
    startedAt: new Date(),
    currentPhaseStartedAt: new Date(),
    phaseHistory: [{
      phase: initialPhase,
      enteredAt: new Date()
    }]
  });

  // ===== SEMANTIC STATE QUERIES =====
  const isInPhase = useCallback((phase: WorkflowPhase) => 
    state.phase === phase, [state.phase]);

  const isSelectionPhase = useCallback(() => 
    isInPhase('selection'), [isInPhase]);

  const isTemplatePhase = useCallback(() => 
    isInPhase('template'), [isInPhase]);

  const isDocumentPhase = useCallback(() => 
    isInPhase('document'), [isInPhase]);

  const isSigningPhase = useCallback(() => 
    isInPhase('signing'), [isInPhase]);

  const isSuccessPhase = useCallback(() => 
    isInPhase('success'), [isInPhase]);

  // ===== SIGNER QUERIES =====
  const getCurrentSignerIndex = useCallback(() => 
    state.signerState?.currentSignerIndex ?? 0, [state.signerState]);

  const getTotalSigners = useCallback(() => 
    state.signerState?.totalSigners ?? 0, [state.signerState]);

  const getCurrentSignerId = useCallback(() => {
    if (!state.signerState) return undefined;
    const { currentSignerIndex, signingOrder } = state.signerState;
    return signingOrder[currentSignerIndex];
  }, [state.signerState]);

  const isFirstSigner = useCallback(() => 
    getCurrentSignerIndex() === 0, [getCurrentSignerIndex]);

  const isLastSigner = useCallback(() => 
    getCurrentSignerIndex() === getTotalSigners() - 1, 
    [getCurrentSignerIndex, getTotalSigners]);

  const hasMoreSigners = useCallback(() => 
    getCurrentSignerIndex() < getTotalSigners() - 1,
    [getCurrentSignerIndex, getTotalSigners]);

  const getSignerProgress = useCallback(() => {
    const total = getTotalSigners();
    if (total === 0) return 0;
    const completed = state.signerState?.signersCompleted.length ?? 0;
    return Math.round((completed / total) * 100);
  }, [state.signerState, getTotalSigners]);

  // ===== TRANSITION QUERIES =====
  const getCurrentPhaseIndex = useCallback(() => 
    WORKFLOW_PHASE_ORDER.indexOf(state.phase), [state.phase]);

  const canTransitionForward = useCallback(() => {
    const currentIndex = getCurrentPhaseIndex();
    return currentIndex < WORKFLOW_PHASE_ORDER.length - 1 && !state.isTransitioning;
  }, [getCurrentPhaseIndex, state.isTransitioning]);

  const canTransitionBack = useCallback(() => {
    const currentIndex = getCurrentPhaseIndex();
    return currentIndex > 0 && !state.isTransitioning;
  }, [getCurrentPhaseIndex, state.isTransitioning]);

  const canStartSigning = useCallback(() => 
    isDocumentPhase() && state.documentId != null,
    [isDocumentPhase, state.documentId]);

  const canCompleteCurrentPhase = useCallback(() => {
    if (isTemplatePhase()) return state.templateId != null;
    if (isDocumentPhase()) return state.documentId != null;
    if (isSigningPhase()) {
      const allSigned = state.signerState?.signersCompleted.length === state.signerState?.totalSigners;
      return allSigned;
    }
    return true;
  }, [isTemplatePhase, isDocumentPhase, isSigningPhase, state]);

  // ===== PHASE TRANSITION HELPERS =====
  const recordPhaseTransition = useCallback((
    fromPhase: WorkflowPhase, 
    toPhase: WorkflowPhase
  ) => {
    setMetadata(prev => {
      const updatedHistory = [...prev.phaseHistory];
      const lastEntry = updatedHistory[updatedHistory.length - 1];
      
      if (lastEntry && lastEntry.phase === fromPhase) {
        lastEntry.exitedAt = new Date();
      }

      updatedHistory.push({
        phase: toPhase,
        enteredAt: new Date()
      });

      return {
        ...prev,
        currentPhaseStartedAt: new Date(),
        phaseHistory: updatedHistory,
        completedAt: toPhase === 'success' ? new Date() : undefined
      };
    });
  }, []);

  // ===== STATE TRANSITIONS =====
  const dispatch = useCallback((transition: WorkflowTransition) => {
    setState(prevState => {
      const currentPhase = prevState.phase;
      
      switch (transition.type) {
        case 'START_TEMPLATE_CREATION':
          recordPhaseTransition(currentPhase, 'template');
          return { ...prevState, phase: 'template', isTransitioning: false };

        case 'START_DOCUMENT_CREATION':
          recordPhaseTransition(currentPhase, 'document');
          return { 
            ...prevState, 
            phase: 'document', 
            templateId: transition.templateId,
            isTransitioning: false 
          };

        case 'COMPLETE_TEMPLATE':
          return { ...prevState, templateId: transition.templateId };

        case 'COMPLETE_DOCUMENT':
          return { ...prevState, documentId: transition.documentId };

        case 'START_SIGNING':
          recordPhaseTransition(currentPhase, 'signing');
          // Generate default signing order if not provided
          const signingOrder = transition.signingOrder ||
            Array.from({ length: transition.signerCount }, (_, i) => `signer-${i}`);
          return {
            ...prevState,
            phase: 'signing',
            documentId: transition.documentId,
            signerState: {
              currentSignerIndex: 0,
              totalSigners: transition.signerCount,
              signersCompleted: [],
              signingOrder
            },
            isTransitioning: false
          };

        case 'COMPLETE_SIGNER':
          if (!prevState.signerState) return prevState;
          return {
            ...prevState,
            signerState: {
              ...prevState.signerState,
              signersCompleted: [...prevState.signerState.signersCompleted, transition.signerId]
            }
          };

        case 'ADVANCE_TO_NEXT_SIGNER':
          if (!prevState.signerState) return prevState;
          const nextIndex = prevState.signerState.currentSignerIndex + 1;
          if (nextIndex >= prevState.signerState.totalSigners) {
            recordPhaseTransition('signing', 'success');
            return { ...prevState, phase: 'success', isTransitioning: false };
          }
          return {
            ...prevState,
            signerState: {
              ...prevState.signerState,
              currentSignerIndex: nextIndex
            }
          };

        case 'COMPLETE_ALL_SIGNING':
          recordPhaseTransition(currentPhase, 'success');
          return { ...prevState, phase: 'success', isTransitioning: false };

        case 'GO_BACK':
          const currentIndex = WORKFLOW_PHASE_ORDER.indexOf(prevState.phase);
          if (currentIndex > 0) {
            const previousPhase = WORKFLOW_PHASE_ORDER[currentIndex - 1];
            recordPhaseTransition(currentPhase, previousPhase);
            return { ...prevState, phase: previousPhase, isTransitioning: false };
          }
          return prevState;

        case 'RESET':
          recordPhaseTransition(currentPhase, 'selection');
          return {
            phase: 'selection',
            isTransitioning: false
          };

        case 'SET_ERROR':
          return { ...prevState, error: transition.error };

        default:
          return prevState;
      }
    });
  }, [recordPhaseTransition]);

  // ===== CONVENIENCE METHODS =====
  const transitionToPhase = useCallback((phase: WorkflowPhase) => {
    setState(prev => ({ ...prev, phase, isTransitioning: false }));
    recordPhaseTransition(state.phase, phase);
  }, [state.phase, recordPhaseTransition]);

  const moveToNextPhase = useCallback(() => {
    if (canTransitionForward()) {
      const nextIndex = getCurrentPhaseIndex() + 1;
      const nextPhase = WORKFLOW_PHASE_ORDER[nextIndex];
      transitionToPhase(nextPhase);
    }
  }, [canTransitionForward, getCurrentPhaseIndex, transitionToPhase]);

  const moveToPreviousPhase = useCallback(() => {
    if (canTransitionBack()) {
      dispatch({ type: 'GO_BACK' });
    }
  }, [canTransitionBack, dispatch]);

  const advanceToNextSigner = useCallback(() => {
    dispatch({ type: 'ADVANCE_TO_NEXT_SIGNER' });
  }, [dispatch]);

  const completeCurrentSigner = useCallback((signerId: string) => {
    dispatch({ type: 'COMPLETE_SIGNER', signerId });
    
    // Check if we should advance
    if (hasMoreSigners()) {
      advanceToNextSigner();
    } else {
      dispatch({ type: 'COMPLETE_ALL_SIGNING' });
    }
  }, [dispatch, hasMoreSigners, advanceToNextSigner]);

  const resetWorkflow = useCallback(() => {
    dispatch({ type: 'RESET' });
    setMetadata({
      startedAt: new Date(),
      currentPhaseStartedAt: new Date(),
      phaseHistory: [{
        phase: 'selection',
        enteredAt: new Date()
      }]
    });
  }, [dispatch]);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', error });
  }, [dispatch]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  return {
    state,
    metadata,
    
    // Semantic queries
    isInPhase,
    isSelectionPhase,
    isTemplatePhase,
    isDocumentPhase,
    isSigningPhase,
    isSuccessPhase,
    
    // Signer queries
    getCurrentSignerIndex,
    getTotalSigners,
    getCurrentSignerId,
    isFirstSigner,
    isLastSigner,
    hasMoreSigners,
    getSignerProgress,
    
    // Transition queries
    canTransitionForward,
    canTransitionBack,
    canStartSigning,
    canCompleteCurrentPhase,
    
    // State transitions
    dispatch,
    transitionToPhase,
    moveToNextPhase,
    moveToPreviousPhase,
    advanceToNextSigner,
    completeCurrentSigner,
    resetWorkflow,
    setError,
    clearError
  };
}