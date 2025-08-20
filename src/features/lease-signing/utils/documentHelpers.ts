import type { Document, DocumentField, DocumentRecipient, Template } from '../types';

/**
 * Validates if a document is ready to be sent for signing
 */
export function validateDocumentForSigning(document: Document): string[] {
  const errors: string[] = [];

  if (!document.name?.trim()) {
    errors.push('Document name is required');
  }

  if (!document.recipients || document.recipients.length === 0) {
    errors.push('Document must have at least one recipient');
  }

  // Check that all recipients have valid email addresses
  document.recipients?.forEach((recipient, index) => {
    if (!recipient.email?.trim()) {
      errors.push(`Recipient ${index + 1}: Email is required`);
    } else if (!isValidEmail(recipient.email)) {
      errors.push(`Recipient ${index + 1}: Invalid email format`);
    }
    
    if (!recipient.name?.trim()) {
      errors.push(`Recipient ${index + 1}: Name is required`);
    }
  });

  // Skip required field validation for addendums (they're loosy goosy)
  if (document.template?.type !== 'addendum') {
    // Check required fields are filled
    const requiredFields = document.fields.filter(field => field.required);
    const unfilledRequired = requiredFields.filter(field => 
      !field.value || (typeof field.value === 'string' && !field.value.trim())
    );

    if (unfilledRequired.length > 0) {
      errors.push(`${unfilledRequired.length} required fields are not filled`);
    }
  }

  return errors;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculates document completion percentage
 */
export function calculateDocumentCompletion(document: Document): number {
  if (!document.fields || document.fields.length === 0) return 0;

  const filledFields = document.fields.filter(field => 
    field.value !== undefined && 
    field.value !== null && 
    field.value !== ''
  );

  return Math.round((filledFields.length / document.fields.length) * 100);
}

/**
 * Gets the current status of document signing
 */
export function getSigningProgress(document: Document): {
  completed: number;
  total: number;
  percentage: number;
  nextSigner?: DocumentRecipient;
} {
  const signedRecipients = document.recipients.filter(r => r.status === 'signed');
  const total = document.recipients.length;
  const completed = signedRecipients.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Find next signer (first one that hasn't signed)
  const nextSigner = document.recipients
    .sort((a, b) => (a.signingOrder || 0) - (b.signingOrder || 0))
    .find(r => r.status !== 'signed');

  return {
    completed,
    total,
    percentage,
    nextSigner,
  };
}

/**
 * Auto-populates document fields based on metadata and templates
 */
export function autoPopulateDocument(
  document: Document, 
  template: Template,
  metadata?: Document['metadata']
): DocumentField[] {
  return document.fields.map(field => {
    if (field.value) return field; // Already has a value

    const label = field.label.toLowerCase();
    let autoValue: string | number | Date | undefined;

    // Property-related auto-population
    if (metadata?.propertyAddress && (
      label.includes('property address') || 
      label.includes('premises') ||
      label.includes('rental property')
    )) {
      autoValue = metadata.propertyAddress;
    }

    // Tenant-related auto-population
    if (metadata?.tenantName && (
      label.includes('tenant name') || 
      label.includes('renter name') ||
      label.includes('lessee name')
    )) {
      autoValue = metadata.tenantName;
    }

    // Host-related auto-population
    if (metadata?.hostName && (
      label.includes('landlord name') || 
      label.includes('host name') ||
      label.includes('lessor name')
    )) {
      autoValue = metadata.hostName;
    }

    // Financial auto-population
    if (metadata?.monthlyRent && (
      label.includes('monthly rent') || 
      label.includes('rent amount')
    )) {
      autoValue = `$${metadata.monthlyRent.toLocaleString()}`;
    }

    if (metadata?.securityDeposit && (
      label.includes('security deposit') || 
      label.includes('deposit amount')
    )) {
      autoValue = `$${metadata.securityDeposit.toLocaleString()}`;
    }

    // Date auto-population
    if (metadata?.leaseStartDate && (
      label.includes('lease start') || 
      label.includes('commencement date') ||
      label.includes('start date')
    )) {
      autoValue = metadata.leaseStartDate.toISOString().split('T')[0];
    }

    if (metadata?.leaseEndDate && (
      label.includes('lease end') || 
      label.includes('termination date') ||
      label.includes('end date')
    )) {
      autoValue = metadata.leaseEndDate.toISOString().split('T')[0];
    }

    // Current date for signature dates
    if (field.type === 'date' && (
      label.includes('date signed') || 
      label.includes('signature date')
    )) {
      autoValue = new Date().toISOString().split('T')[0];
    }

    return autoValue ? { ...field, value: autoValue } : field;
  });
}

/**
 * Groups document fields by recipient
 */
export function groupDocumentFieldsByRecipient(
  document: Document
): Record<string, { recipient: DocumentRecipient; fields: DocumentField[] }> {
  const groups: Record<string, { recipient: DocumentRecipient; fields: DocumentField[] }> = {};

  document.recipients.forEach(recipient => {
    groups[recipient.id] = {
      recipient,
      fields: document.fields.filter(field => field.recipientId === recipient.id),
    };
  });

  return groups;
}

/**
 * Generates a document summary for display
 */
export function generateDocumentSummary(document: Document): {
  fieldCount: number;
  recipientCount: number;
  completionPercentage: number;
  status: string;
  signedCount: number;
} {
  const fieldCount = document.fields.length;
  const recipientCount = document.recipients.length;
  const completionPercentage = calculateDocumentCompletion(document);
  const signedCount = document.recipients.filter(r => r.status === 'signed').length;

  let status = 'Draft';
  if (document.status === 'sent') status = 'Sent for Signature';
  else if (document.status === 'partially_signed') status = 'Partially Signed';
  else if (document.status === 'completed') status = 'Fully Signed';
  else if (document.status === 'expired') status = 'Expired';
  else if (document.status === 'declined') status = 'Declined';

  return {
    fieldCount,
    recipientCount,
    completionPercentage,
    status,
    signedCount,
  };
}

/**
 * Checks if all signatures are collected
 */
export function isDocumentFullySigned(document: Document): boolean {
  const signatureFields = document.fields.filter(field => field.type === 'signature');
  return signatureFields.every(field => field.value);
}

/**
 * Gets the next action required for the document
 */
export function getNextAction(document: Document): {
  action: 'complete_fields' | 'send_for_signature' | 'wait_for_signatures' | 'download' | 'none';
  description: string;
  recipient?: DocumentRecipient;
} {
  const validation = validateDocumentForSigning(document);
  
  if (validation.length > 0) {
    return {
      action: 'complete_fields',
      description: 'Complete required fields before sending',
    };
  }

  if (document.status === 'draft' || document.status === 'ready') {
    return {
      action: 'send_for_signature',
      description: 'Send document for signature',
    };
  }

  if (document.status === 'sent' || document.status === 'partially_signed') {
    const progress = getSigningProgress(document);
    return {
      action: 'wait_for_signatures',
      description: `Waiting for ${progress.nextSigner?.name || 'recipients'} to sign`,
      recipient: progress.nextSigner,
    };
  }

  if (document.status === 'completed') {
    return {
      action: 'download',
      description: 'Download signed document',
    };
  }

  return {
    action: 'none',
    description: 'No action required',
  };
}

/**
 * Estimates signing completion time based on current progress
 */
export function estimateCompletionTime(document: Document): {
  estimatedDays: number;
  confidence: 'low' | 'medium' | 'high';
} {
  const progress = getSigningProgress(document);
  const remainingSigners = progress.total - progress.completed;

  if (remainingSigners === 0) {
    return { estimatedDays: 0, confidence: 'high' };
  }

  // Base estimate: 1-3 days per signer depending on various factors
  let daysPerSigner = 2; // Default
  
  // Adjust based on document status
  if (document.status === 'sent') {
    daysPerSigner = 1.5; // People tend to sign faster when first sent
  } else if (document.status === 'partially_signed') {
    daysPerSigner = 1; // Momentum effect
  }

  const estimatedDays = Math.ceil(remainingSigners * daysPerSigner);
  
  // Confidence based on number of remaining signers
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (remainingSigners === 1) confidence = 'high';
  else if (remainingSigners > 3) confidence = 'low';

  return { estimatedDays, confidence };
}