import { Template, TemplateField, TemplateRecipient } from './template.types';

export interface DocumentField extends TemplateField {
  value?: string | boolean | Date;
  filledAt?: Date;
  filledBy?: string;
}

export interface DocumentRecipient extends TemplateRecipient {
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
  signedAt?: Date;
  viewedAt?: Date;
  sentAt?: Date;
  ipAddress?: string;
}

export interface Document {
  id: string;
  templateId: string;
  template?: Template;
  name: string;
  status: 'draft' | 'ready' | 'sent' | 'partially_signed' | 'completed' | 'expired' | 'declined';
  fields: DocumentField[];
  recipients: DocumentRecipient[];
  pdfUrl?: string;
  signedPdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata?: {
    propertyId?: string;
    propertyAddress?: string;
    leaseStartDate?: Date;
    leaseEndDate?: Date;
    monthlyRent?: number;
    securityDeposit?: number;
    tenantId?: string;
    tenantName?: string;
    hostId?: string;
    hostName?: string;
  };
}

export interface DocumentCreateInput {
  templateId: string;
  name: string;
  fields?: Partial<DocumentField>[];
  recipients: Array<{
    role: TemplateRecipient['role'];
    name: string;
    email: string;
  }>;
  metadata?: Document['metadata'];
  autoPopulate?: boolean;
}

export interface DocumentUpdateInput {
  id: string;
  fields?: Partial<DocumentField>[];
  recipients?: Partial<DocumentRecipient>[];
  status?: Document['status'];
  metadata?: Document['metadata'];
}

export interface DocumentFieldValue {
  fieldId: string;
  value: string | boolean | Date;
}

export interface DocumentSendInput {
  documentId: string;
  subject?: string;
  message?: string;
  expiresInDays?: number;
  reminderDays?: number[];
}

export interface DocumentFilter {
  status?: Document['status'] | Document['status'][];
  templateId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  searchTerm?: string;
  propertyId?: string;
  tenantId?: string;
  hostId?: string;
}