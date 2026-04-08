"use client";

import { useState, useCallback } from 'react';
import type { 
  Document, 
  DocumentSendInput, 
  SigningSession, 
  SigningWorkflow, 
  DocumentRecipient 
} from '../types';

interface UseSigningManagerReturn {
  signingWorkflow?: SigningWorkflow;
  signingSessions: SigningSession[];
  isLoading: boolean;
  error?: string;
  sendForSignature: (input: DocumentSendInput) => Promise<void>;
  getSigningStatus: (documentId: string) => Promise<SigningWorkflow | undefined>;
  resendToRecipient: (sessionId: string) => Promise<void>;
  cancelSigning: (workflowId: string) => Promise<void>;
  downloadSignedDocument: (documentId: string) => Promise<void>;
  completeWorkflow: (workflowId: string) => Promise<Document>;
}

export function useSigningManager(): UseSigningManagerReturn {
  const [signingWorkflow, setSigningWorkflow] = useState<SigningWorkflow | undefined>();
  const [signingSessions, setSigningSessions] = useState<SigningSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const sendForSignature = useCallback(async (input: DocumentSendInput) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create mock signing workflow
      const workflow: SigningWorkflow = {
        id: Math.random().toString(36).substr(2, 9),
        documentId: input.documentId,
        currentStep: 1,
        totalSteps: 2, // Host and Renter
        signingOrder: [
          {
            order: 1,
            recipientId: 'renter-recipient',
            status: 'pending',
          },
          {
            order: 2,
            recipientId: 'host-recipient',
            status: 'pending',
          },
        ],
        status: 'active',
        startedAt: new Date(),
        metadata: {
          sendReminders: true,
          reminderSchedule: [1, 3, 7], // Days
          expiresInDays: input.expiresInDays || 30,
          requireInOrderSigning: true,
          allowDecline: true,
          allowReassign: false,
        },
      };

      // Create mock signing sessions
      const sessions: SigningSession[] = [
        {
          id: Math.random().toString(36).substr(2, 9),
          documentId: input.documentId,
          recipientId: 'renter-recipient',
          token: Math.random().toString(36).substr(2, 16),
          status: 'pending',
          expiresAt: new Date(Date.now() + (input.expiresInDays || 30) * 24 * 60 * 60 * 1000),
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          documentId: input.documentId,
          recipientId: 'host-recipient',
          token: Math.random().toString(36).substr(2, 16),
          status: 'pending',
          expiresAt: new Date(Date.now() + (input.expiresInDays || 30) * 24 * 60 * 60 * 1000),
        },
      ];

      setSigningWorkflow(workflow);
      setSigningSessions(sessions);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send document for signature');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSigningStatus = useCallback(async (documentId: string): Promise<SigningWorkflow | undefined> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return existing workflow or undefined
      if (signingWorkflow?.documentId === documentId) {
        return signingWorkflow;
      }

      return undefined;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get signing status');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [signingWorkflow]);

  const resendToRecipient = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Update session with new sent timestamp
      setSigningSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, startedAt: new Date() }
            : session
        )
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend to recipient');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelSigning = useCallback(async (workflowId: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (signingWorkflow?.id === workflowId) {
        setSigningWorkflow(prev => prev ? { ...prev, status: 'cancelled' } : undefined);
      }

      // Cancel all related sessions
      setSigningSessions(prev => 
        prev.map(session => ({ ...session, status: 'expired' }))
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel signing');
    } finally {
      setIsLoading(false);
    }
  }, [signingWorkflow]);

  const downloadSignedDocument = useCallback(async (documentId: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // In a real implementation, this would download the file
      console.log(`Downloading signed document: ${documentId}`);
      
      // Simulate file download
      const blob = new Blob(['Mock signed PDF content'], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-document-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeWorkflow = useCallback(async (workflowId: string): Promise<Document> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (signingWorkflow?.id === workflowId) {
        setSigningWorkflow(prev => prev ? { 
          ...prev, 
          status: 'completed',
          completedAt: new Date(),
        } : undefined);
      }

      // Create mock completed document
      const completedDocument: Document = {
        id: signingWorkflow?.documentId || 'doc-1',
        templateId: 'template-1',
        name: 'Completed Lease Agreement',
        status: 'completed',
        fields: [],
        recipients: [
          {
            id: 'host-recipient',
            name: 'John Host',
            email: 'host@example.com',
            role: 'HOST',
            title: 'Host',
            color: '#0B6E6E',
            status: 'signed',
            signedAt: new Date(),
          },
          {
            id: 'renter-recipient',
            name: 'Jane Renter',
            email: 'renter@example.com',
            role: 'RENTER',
            title: 'Primary Renter',
            color: '#fb8c00',
            status: 'signed',
            signedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        signedPdfUrl: '/api/documents/signed/mock-document.pdf',
      };

      return completedDocument;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete workflow';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [signingWorkflow]);

  return {
    signingWorkflow,
    signingSessions,
    isLoading,
    error,
    sendForSignature,
    getSigningStatus,
    resendToRecipient,
    cancelSigning,
    downloadSignedDocument,
    completeWorkflow,
  };
}