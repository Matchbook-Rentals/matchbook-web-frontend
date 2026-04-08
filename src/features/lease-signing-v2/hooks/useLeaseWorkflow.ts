"use client";

import { useState, useCallback } from 'react';
import type { Template, Document, DocumentCreateInput } from '../types';

export type WorkflowStep = 'template' | 'document' | 'signing' | 'completed';

interface WorkflowState {
  currentStep: WorkflowStep;
  template?: Template;
  document?: Document;
  isLoading: boolean;
  error?: string;
}

interface UseLeaseWorkflowReturn {
  state: WorkflowState;
  goToStep: (step: WorkflowStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  setTemplate: (template: Template) => void;
  setDocument: (document: Document) => void;
  createDocument: (input: DocumentCreateInput) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  resetWorkflow: () => void;
}

const STEP_ORDER: WorkflowStep[] = ['template', 'document', 'signing', 'completed'];

export function useLeaseWorkflow(initialStep: WorkflowStep = 'template'): UseLeaseWorkflowReturn {
  const [state, setState] = useState<WorkflowState>({
    currentStep: initialStep,
    template: undefined,
    document: undefined,
    isLoading: false,
    error: undefined,
  });

  const goToStep = useCallback((step: WorkflowStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      error: undefined,
    }));
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      goToStep(nextStep);
    }
  }, [state.currentStep, goToStep]);

  const previousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      goToStep(prevStep);
    }
  }, [state.currentStep, goToStep]);

  const setTemplate = useCallback((template: Template) => {
    setState(prev => ({
      ...prev,
      template,
      error: undefined,
    }));
  }, []);

  const setDocument = useCallback((document: Document) => {
    setState(prev => ({
      ...prev,
      document,
      error: undefined,
    }));
  }, []);

  const createDocument = useCallback(async (input: DocumentCreateInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      // In a real implementation, this would call an API
      // For now, we'll create a mock document
      const mockDocument: Document = {
        id: Math.random().toString(36).substr(2, 9),
        templateId: input.templateId,
        name: input.name,
        status: 'draft',
        fields: input.fields?.map((field, index) => ({
          id: field.id || `field-${index}`,
          type: 'text', // This would come from the template
          label: `Field ${index + 1}`,
          required: true,
          recipientId: 'recipient-1',
          page: 1,
          x: 0,
          y: 0,
          width: 100,
          height: 30,
          value: field.value,
        })) || [],
        recipients: input.recipients.map((recipient, index) => ({
          id: `recipient-${index}`,
          name: recipient.name,
          email: recipient.email,
          role: recipient.role,
          title: recipient.role,
          color: index === 0 ? '#0B6E6E' : '#fb8c00',
          status: 'pending',
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: input.metadata,
      };

      setDocument(mockDocument);
      nextStep();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create document',
        isLoading: false,
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [setDocument, nextStep]);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | undefined) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const resetWorkflow = useCallback(() => {
    setState({
      currentStep: 'template',
      template: undefined,
      document: undefined,
      isLoading: false,
      error: undefined,
    });
  }, []);

  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    setTemplate,
    setDocument,
    createDocument,
    setLoading,
    setError,
    resetWorkflow,
  };
}