import { Document, DocumentRecipient } from './document.types';

export interface SigningSession {
  id: string;
  documentId: string;
  document?: Document;
  recipientId: string;
  recipient?: DocumentRecipient;
  token: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'declined';
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  signatureData?: {
    type: 'drawn' | 'typed' | 'uploaded';
    data: string;
    timestamp: Date;
  };
  fields?: SigningFieldData[];
}

export interface SigningFieldData {
  fieldId: string;
  value: string | boolean | Date;
  filledAt: Date;
}

export interface SigningWorkflow {
  id: string;
  documentId: string;
  currentStep: number;
  totalSteps: number;
  signingOrder: Array<{
    order: number;
    recipientId: string;
    status: 'pending' | 'completed' | 'skipped';
  }>;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  metadata?: {
    sendReminders: boolean;
    reminderSchedule?: number[];
    expiresInDays: number;
    requireInOrderSigning: boolean;
    allowDecline: boolean;
    allowReassign: boolean;
  };
}

export interface SignerCredentials {
  email: string;
  name: string;
  role: 'HOST' | 'RENTER' | 'GUARANTOR' | 'WITNESS';
  verificationMethod?: 'email' | 'sms' | 'none';
  verificationCode?: string;
}

export interface SigningEvent {
  id: string;
  sessionId: string;
  type: 'session_started' | 'document_viewed' | 'field_filled' | 'signature_added' | 
        'document_signed' | 'session_completed' | 'document_downloaded' | 'session_expired' | 
        'document_declined' | 'reminder_sent';
  timestamp: Date;
  recipientId: string;
  metadata?: Record<string, any>;
}

export interface SignatureStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  italic?: boolean;
}

export interface SigningValidation {
  requireAllFields: boolean;
  requireInOrderSigning: boolean;
  allowSaveProgress: boolean;
  requireAuthentication: boolean;
  requireAgreement: boolean;
  agreementText?: string;
}

export interface BulkSigningRequest {
  templateId: string;
  documents: Array<{
    name: string;
    recipients: SignerCredentials[];
    fieldValues?: Record<string, any>;
    metadata?: Record<string, any>;
  }>;
  workflow?: Partial<SigningWorkflow['metadata']>;
}

export interface SigningNotification {
  type: 'invitation' | 'reminder' | 'completed' | 'declined' | 'expired';
  recipientEmail: string;
  subject: string;
  message: string;
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}