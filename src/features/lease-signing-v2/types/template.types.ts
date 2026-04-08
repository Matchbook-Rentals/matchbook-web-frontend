export interface TemplateField {
  id: string;
  type: 'text' | 'signature' | 'date' | 'checkbox' | 'initial';
  label: string;
  required: boolean;
  recipientId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  placeholder?: string;
  validation?: {
    type?: 'email' | 'phone' | 'number' | 'custom';
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface TemplateRecipient {
  id: string;
  name: string;
  email?: string;
  role: 'HOST' | 'RENTER' | 'GUARANTOR' | 'WITNESS';
  title: string;
  color: string;
  signingOrder?: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  type: 'lease' | 'addendum' | 'disclosure' | 'other';
  fields: TemplateField[];
  recipients: TemplateRecipient[];
  pdfUrl?: string;
  pdfFileName?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  metadata?: {
    propertyType?: string;
    duration?: string;
    state?: string;
    tags?: string[];
  };
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  type: Template['type'];
  fields: Omit<TemplateField, 'id'>[];
  recipients: Omit<TemplateRecipient, 'id'>[];
  pdfFile: File;
  metadata?: Template['metadata'];
}

export interface TemplateUpdateInput extends Partial<TemplateCreateInput> {
  id: string;
}

export interface TemplateFilter {
  type?: Template['type'];
  isActive?: boolean;
  searchTerm?: string;
  tags?: string[];
  createdBy?: string;
}